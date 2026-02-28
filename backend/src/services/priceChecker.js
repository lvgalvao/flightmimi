const flightSearchApi = require('./flightSearchApi');
const queries = require('../db/queries');

function shiftDate(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

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

    function buildParams(departDate, returnDate) {
      const params = {
        fromEntityId: alert.origin_entity_id,
        toEntityId: alert.dest_entity_id,
        departDate,
        adults: alert.passengers,
        cabinClass: alert.cabin_class,
        currency: alert.currency,
      };
      if (returnDate) params.returnDate = returnDate;
      return params;
    }

    // Try exact dates first
    const params = buildParams(alert.depart_date, alert.return_date);
    const result = await flightSearchApi[searchFn](params);
    let cheapest = extractCheapest(result);
    let approxInfo = null;

    // Fallback: try nearby dates (±1 to ±3 days) if no results
    if (!cheapest) {
      console.log(`[PRICE] No results for exact dates, trying approximate dates for alert ${alert.id}`);
      const offsets = [-1, 1, -2, 2, -3, 3];
      const today = new Date().toISOString().split('T')[0];

      for (const offset of offsets) {
        const altDepart = shiftDate(alert.depart_date, offset);
        if (altDepart < today) continue; // skip past dates

        const altReturn = alert.return_date ? shiftDate(alert.return_date, offset) : null;
        if (altReturn && altReturn < altDepart) continue;

        try {
          const altParams = buildParams(altDepart, altReturn);
          const altResult = await flightSearchApi[searchFn](altParams);
          const altCheapest = extractCheapest(altResult);
          if (altCheapest) {
            cheapest = altCheapest;
            approxInfo = { departDate: altDepart, returnDate: altReturn, offsetDays: offset };
            console.log(`[PRICE] Found result with offset ${offset > 0 ? '+' : ''}${offset} day(s): R$ ${altCheapest.price}`);
            break;
          }
        } catch (err) {
          console.error(`[PRICE] Approx search offset ${offset} failed:`, err.message);
        }

        // Small delay between API calls
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    if (!cheapest) {
      queries.addPriceHistory(alert.id, {
        price: 0,
        airline: null,
        flightNumbers: null,
        stops: null,
        bucketType: null,
        rawSummary: 'Nenhum resultado encontrado (incluindo datas próximas)',
      });
      return null;
    }

    const summary = approxInfo
      ? `Aproximado: ${approxInfo.offsetDays > 0 ? '+' : ''}${approxInfo.offsetDays} dia(s) (${approxInfo.departDate}${approxInfo.returnDate ? ' — ' + approxInfo.returnDate : ''})`
      : null;

    queries.addPriceHistory(alert.id, {
      price: cheapest.price,
      airline: cheapest.airline,
      flightNumbers: cheapest.flightNumbers,
      stops: cheapest.stops,
      bucketType: cheapest.bucketType,
      rawSummary: summary,
    });

    queries.updateAlertPrice(alert.id, cheapest.price);

    let triggered = false;
    if (cheapest.price <= alert.target_price) {
      queries.triggerAlert(alert.id, cheapest.price);
      const message = `Preço atingiu o alvo! ${cheapest.formatted} (alvo: R$ ${alert.target_price.toLocaleString('pt-BR')})`;
      queries.addNotification(alert.id, cheapest.price, message);
      triggered = true;
    }

    return { ...cheapest, triggered, approxInfo };
  },
};
