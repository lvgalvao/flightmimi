const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const { migrate } = require('./db/migrate');
const { startCron } = require('./services/cronJob');
const errorHandler = require('./middleware/errorHandler');

const alertsRouter = require('./routes/alerts');
const airportsRouter = require('./routes/airports');
const notificationsRouter = require('./routes/notifications');

const app = express();

app.use(cors({ origin: config.server.frontendUrl }));
app.use(express.json());

// API Routes
app.use('/api/alerts', alertsRouter);
app.use('/api/airports', airportsRouter);
app.use('/api/notifications', notificationsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve frontend in production
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(frontendDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// Error handler
app.use(errorHandler);

// Initialize
migrate();
startCron();

app.listen(config.server.port, '0.0.0.0', () => {
  console.log(`[SERVER] Running on port ${config.server.port} (${config.server.nodeEnv})`);
});
