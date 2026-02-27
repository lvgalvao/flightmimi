const db = require('./database');

module.exports = {
  // --- Alerts ---

  createAlert({ originEntityId, originName, originDisplayCode, destEntityId, destName, destDisplayCode, departDate, returnDate, targetPrice, cabinClass, passengers, currency }) {
    const stmt = db.prepare(`
      INSERT INTO alerts (origin_entity_id, origin_name, origin_display_code, dest_entity_id, dest_name, dest_display_code, depart_date, return_date, target_price, cabin_class, passengers, currency)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(originEntityId, originName, originDisplayCode, destEntityId, destName, destDisplayCode, departDate, returnDate, targetPrice, cabinClass || 'economy', passengers || 1, currency || 'BRL');
    return this.getAlertById(result.lastInsertRowid);
  },

  getAllAlerts() {
    return db.prepare('SELECT * FROM alerts ORDER BY created_at DESC').all();
  },

  getActiveAlerts() {
    return db.prepare("SELECT * FROM alerts WHERE status = 'active' ORDER BY created_at ASC").all();
  },

  getActiveAlertsCount() {
    const row = db.prepare("SELECT COUNT(*) as count FROM alerts WHERE status = 'active'").get();
    return row.count;
  },

  getAlertById(id) {
    return db.prepare('SELECT * FROM alerts WHERE id = ?').get(id);
  },

  updateAlert(id, fields) {
    const sets = [];
    const values = [];
    for (const [key, value] of Object.entries(fields)) {
      sets.push(`${key} = ?`);
      values.push(value);
    }
    sets.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    db.prepare(`UPDATE alerts SET ${sets.join(', ')} WHERE id = ?`).run(...values);
    return this.getAlertById(id);
  },

  updateAlertPrice(id, price) {
    const alert = this.getAlertById(id);
    const lowestPrice = alert.lowest_price ? Math.min(alert.lowest_price, price) : price;
    db.prepare(`
      UPDATE alerts SET current_price = ?, lowest_price = ?, last_checked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(price, lowestPrice, id);
  },

  updateAlertStatus(id, status) {
    db.prepare('UPDATE alerts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
  },

  triggerAlert(id, price) {
    db.prepare("UPDATE alerts SET status = 'triggered', triggered_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
  },

  deleteAlert(id) {
    db.prepare('DELETE FROM alerts WHERE id = ?').run(id);
  },

  // --- Price History ---

  addPriceHistory(alertId, { price, airline, flightNumbers, stops, bucketType, rawSummary }) {
    db.prepare(`
      INSERT INTO price_history (alert_id, price, cheapest_airline, cheapest_flight_numbers, stops, bucket_type, raw_response_summary)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(alertId, price, airline, flightNumbers, stops, bucketType, rawSummary);
  },

  getPriceHistory(alertId) {
    return db.prepare('SELECT * FROM price_history WHERE alert_id = ? ORDER BY checked_at DESC').all(alertId);
  },

  getRecentPrices(alertId, limit = 20) {
    return db.prepare('SELECT price, checked_at FROM price_history WHERE alert_id = ? ORDER BY checked_at DESC LIMIT ?').all(alertId, limit);
  },

  // --- Notifications ---

  addNotification(alertId, price, message) {
    db.prepare(`
      INSERT INTO notifications (alert_id, type, price_at_trigger, message)
      VALUES (?, 'price_target', ?, ?)
    `).run(alertId, price, message);
  },

  getUnreadNotifications() {
    return db.prepare(`
      SELECT n.*, a.origin_name, a.dest_name, a.origin_display_code, a.dest_display_code
      FROM notifications n
      JOIN alerts a ON a.id = n.alert_id
      WHERE n.read_at IS NULL
      ORDER BY n.created_at DESC
    `).all();
  },

  getUnreadCount() {
    const row = db.prepare("SELECT COUNT(*) as count FROM notifications WHERE read_at IS NULL").get();
    return row.count;
  },

  markNotificationRead(id) {
    db.prepare('UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
  },

  getNotificationsByAlert(alertId) {
    return db.prepare('SELECT * FROM notifications WHERE alert_id = ? ORDER BY created_at DESC').all(alertId);
  },
};
