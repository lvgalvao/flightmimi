require('dotenv').config();

module.exports = {
  api: {
    key: process.env.RAPIDAPI_KEY,
    host: process.env.RAPIDAPI_HOST || 'flights-sky.p.rapidapi.com',
    baseUrl: process.env.RAPIDAPI_BASE_URL || 'https://flights-sky.p.rapidapi.com',
    timeoutMs: parseInt(process.env.API_TIMEOUT_MS) || 30000,
    maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
  },

  monitoring: {
    cronIntervalHours: parseInt(process.env.CRON_INTERVAL_HOURS) || 4,
    maxActiveAlerts: parseInt(process.env.MAX_ACTIVE_ALERTS) || 5,
    delayBetweenRequestsMs: parseInt(process.env.DELAY_BETWEEN_REQUESTS_MS) || 2000,
  },

  searchDefaults: {
    currency: process.env.DEFAULT_CURRENCY || 'BRL',
    market: process.env.DEFAULT_MARKET || 'BR',
    locale: process.env.DEFAULT_LOCALE || 'pt-BR',
    cabinClass: process.env.DEFAULT_CABIN_CLASS || 'economy',
    adults: parseInt(process.env.DEFAULT_ADULTS) || 1,
  },

  server: {
    port: parseInt(process.env.PORT) || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  }
};
