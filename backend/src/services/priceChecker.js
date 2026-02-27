const flightSearchApi = require('./flightSearchApi');
const queries = require('../db/queries');

function extractCheapest(result) {
  let items = [];

  // Real API: data.itineraries is a flat array of itinerary objects
  if (Array.isArray(result?.data?.itineraries)) {
    items = result.data.itineraries;
  }
  // Fallback: bucket-based structure (search-everywhere, etc.)
  else {
    const buckets =
      result?.data?.itineraries?.buckets ||
      result?.data?.everywhereDestination?.buckets ||
      result?.data?.buckets ||
      [];
    for (const bucket of buckets) {
      for (const item of bucket.items || []) {
        items.push({ ...item, _bucketType: bucket.id });
      }
    }
  }

  let cheapest = null;

  for (const item of items) {
    const price = item?.price?.raw;
    if (price && (!cheapest || price < cheapest.price)) {
      const leg = item.legs?.[0];
      cheapest = {
        price,
        formatted: item.price.formatted,
        airline: leg?.carriers?.marketing?.[0]?.name || leg?.segments?.[0]?.carrier?.name || 'N/A',
        stops: leg?.stopCount ?? leg?.stops ?? 0,
        flightNumbers: leg?.segments?.map((s) => s.flightNumber).filter(Boolean).join(',') || null,
        bucketType: item._bucketType || 'CHEAPEST',
      };
    }
  }

  return cheapest;
}

module.exports = {
  extractCheapest,

  async checkAlert(alert) {
    const searchFn = alert.return_date ? 'searchRoundtrip' : 'searchOneWay';
    const params = {
      fromEntityId: alert.origin_entity_id,
      toEntityId: alert.dest_entity_id,
      departDate: alert.depart_date,
      adults: alert.passengers,
      cabinClass: alert.cabin_class,
      currency: alert.currency,
    };
    if (alert.return_date) {
      params.returnDate = alert.return_date;
    }

    const result = await flightSearchApi[searchFn](params);
    const cheapest = extractCheapest(result);

    if (!cheapest) {
      queries.addPriceHistory(alert.id, {
        price: 0,
        airline: null,
        flightNumbers: null,
        stops: null,
        bucketType: null,
        rawSummary: 'No results found',
      });
      return null;
    }

    queries.addPriceHistory(alert.id, {
      price: cheapest.price,
      airline: cheapest.airline,
      flightNumbers: cheapest.flightNumbers,
      stops: cheapest.stops,
      bucketType: cheapest.bucketType,
      rawSummary: null,
    });

    queries.updateAlertPrice(alert.id, cheapest.price);

    let triggered = false;
    if (cheapest.price <= alert.target_price) {
      queries.triggerAlert(alert.id, cheapest.price);
      const message = `Preço atingiu o alvo! ${cheapest.formatted} (alvo: R$ ${alert.target_price.toLocaleString('pt-BR')})`;
      queries.addNotification(alert.id, cheapest.price, message);
      triggered = true;
    }

    return { ...cheapest, triggered };
  },
};
