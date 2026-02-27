const express = require('express');
const router = express.Router();
const queries = require('../db/queries');
const config = require('../config');
const priceChecker = require('../services/priceChecker');

// POST /api/alerts — create alert
router.post('/', async (req, res, next) => {
  try {
    const activeCount = queries.getActiveAlertsCount();
    if (activeCount >= config.monitoring.maxActiveAlerts) {
      return res.status(400).json({
        error: `Limite de ${config.monitoring.maxActiveAlerts} alertas ativos atingido. Pause ou delete um alerta.`,
      });
    }

    const { originEntityId, originName, originDisplayCode, destEntityId, destName, destDisplayCode, departDate, returnDate, targetPrice, cabinClass, passengers } = req.body;

    if (!originEntityId || !originName || !destEntityId || !destName || !departDate || !targetPrice) {
      return res.status(400).json({ error: 'Campos obrigatórios: originEntityId, originName, destEntityId, destName, departDate, targetPrice' });
    }

    const alert = queries.createAlert({
      originEntityId,
      originName,
      originDisplayCode,
      destEntityId,
      destName,
      destDisplayCode,
      departDate,
      returnDate: returnDate || null,
      targetPrice: parseFloat(targetPrice),
      cabinClass,
      passengers: parseInt(passengers) || 1,
      currency: 'BRL',
    });

    // First price check
    let initialPrice = null;
    try {
      const result = await priceChecker.checkAlert(alert);
      initialPrice = result?.price || null;
    } catch (err) {
      console.error('[ALERT] Initial price check failed:', err.message);
    }

    res.status(201).json({ alert: queries.getAlertById(alert.id), initialPrice });
  } catch (err) {
    next(err);
  }
});

// GET /api/alerts — list all alerts
router.get('/', (req, res, next) => {
  try {
    const alerts = queries.getAllAlerts();

    const alertsWithPrices = alerts.map((alert) => {
      const recentPrices = queries.getRecentPrices(alert.id, 20);
      return { ...alert, recentPrices: recentPrices.reverse() };
    });

    res.json({ alerts: alertsWithPrices });
  } catch (err) {
    next(err);
  }
});

// GET /api/alerts/:id — alert detail with history
router.get('/:id', (req, res, next) => {
  try {
    const alert = queries.getAlertById(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: 'Alerta não encontrado' });
    }

    const priceHistory = queries.getPriceHistory(alert.id);
    const notifications = queries.getNotificationsByAlert(alert.id);

    res.json({ alert, priceHistory, notifications });
  } catch (err) {
    next(err);
  }
});

// PUT /api/alerts/:id — update alert
router.put('/:id', (req, res, next) => {
  try {
    const alert = queries.getAlertById(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: 'Alerta não encontrado' });
    }

    const allowed = ['target_price', 'status'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    const updated = queries.updateAlert(alert.id, updates);
    res.json({ alert: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/alerts/:id — delete alert
router.delete('/:id', (req, res, next) => {
  try {
    const alert = queries.getAlertById(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: 'Alerta não encontrado' });
    }
    queries.deleteAlert(alert.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/alerts/:id/check — force price check
router.post('/:id/check', async (req, res, next) => {
  try {
    const alert = queries.getAlertById(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: 'Alerta não encontrado' });
    }

    const result = await priceChecker.checkAlert(alert);
    const previousPrice = alert.current_price;
    const variation = previousPrice && result ? (((result.price - previousPrice) / previousPrice) * 100).toFixed(2) : null;

    res.json({
      price: result?.price || null,
      previousPrice,
      variation: variation ? parseFloat(variation) : null,
      triggered: result?.triggered || false,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/alerts/:id/export — export price history as CSV
router.get('/:id/export', (req, res, next) => {
  try {
    const alert = queries.getAlertById(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: 'Alerta não encontrado' });
    }

    const history = queries.getPriceHistory(alert.id);
    const header = 'Data/Hora,Preco,Companhia,Paradas,Voo\n';
    const rows = history
      .map((h) => `${h.checked_at},${h.price},${h.cheapest_airline || ''},${h.stops ?? ''},${h.cheapest_flight_numbers || ''}`)
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=alert-${alert.id}-history.csv`);
    res.send(header + rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
