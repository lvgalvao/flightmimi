const express = require('express');
const router = express.Router();
const flightSearchApi = require('../services/flightSearchApi');

// GET /api/airports/search?query=rio+de+janeiro
router.get('/search', async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query || query.length < 2) {
      return res.json({ data: [] });
    }

    const result = await flightSearchApi.searchAirports(query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
