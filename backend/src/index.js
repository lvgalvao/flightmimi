const express = require('express');
const cors = require('cors');
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

// Routes
app.use('/api/alerts', alertsRouter);
app.use('/api/airports', airportsRouter);
app.use('/api/notifications', notificationsRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Initialize
migrate();
startCron();

app.listen(config.server.port, () => {
  console.log(`[SERVER] Running on port ${config.server.port} (${config.server.nodeEnv})`);
});
