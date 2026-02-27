const axios = require('axios');
const config = require('../config');

const api = axios.create({
  baseURL: config.api.baseUrl,
  timeout: config.api.timeoutMs,
  headers: {
    'x-rapidapi-key': config.api.key,
    'x-rapidapi-host': config.api.host,
  },
});

async function withRetry(fn, retries = config.api.maxRetries) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      const isRetryable = err.response?.status === 429 || err.response?.status >= 500;
      if (i === retries || !isRetryable) throw err;
      const delay = Math.pow(2, i) * 1000;
      console.log(`[API] Retry ${i + 1}/${retries} in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

module.exports = {
  async searchAirports(query) {
    return withRetry(async () => {
      const { data } = await api.get('/flights/auto-complete', {
        params: { query },
      });
      return data;
    });
  },

  async searchRoundtrip({ fromEntityId, toEntityId, departDate, returnDate, adults, cabinClass, currency, market, locale }) {
    return withRetry(async () => {
      const { data } = await api.get('/flights/search-roundtrip', {
        params: {
          fromEntityId,
          toEntityId,
          departDate,
          returnDate,
          adults: adults || config.searchDefaults.adults,
          cabinClass: cabinClass || config.searchDefaults.cabinClass,
          currency: currency || config.searchDefaults.currency,
          market: market || config.searchDefaults.market,
          locale: locale || config.searchDefaults.locale,
        },
      });
      return data;
    });
  },

  async searchOneWay({ fromEntityId, toEntityId, departDate, adults, cabinClass, currency, market, locale }) {
    return withRetry(async () => {
      const { data } = await api.get('/flights/search-one-way', {
        params: {
          fromEntityId,
          toEntityId,
          departDate,
          adults: adults || config.searchDefaults.adults,
          cabinClass: cabinClass || config.searchDefaults.cabinClass,
          currency: currency || config.searchDefaults.currency,
          market: market || config.searchDefaults.market,
          locale: locale || config.searchDefaults.locale,
        },
      });
      return data;
    });
  },
};
