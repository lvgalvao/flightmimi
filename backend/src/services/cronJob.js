const cron = require('node-cron');
const config = require('../config');
const queries = require('../db/queries');
const priceChecker = require('./priceChecker');

function startCron() {
  const { cronIntervalHours, delayBetweenRequestsMs, maxActiveAlerts } = config.monitoring;
  const expression = `0 */${cronIntervalHours} * * *`;

  console.log('[CRON] Config:');
  console.log(`  - Interval: ${cronIntervalHours}h (${expression})`);
  console.log(`  - Max active alerts: ${maxActiveAlerts}`);
  console.log(`  - Delay between requests: ${delayBetweenRequestsMs}ms`);

  cron.schedule(expression, async () => {
    console.log(`[CRON] ${new Date().toISOString()} — Starting price check`);

    const alerts = queries.getActiveAlerts();
    const alertsToCheck = alerts.slice(0, maxActiveAlerts);
    console.log(`[CRON] Checking ${alertsToCheck.length} alerts`);

    let checked = 0;
    let triggered = 0;
    let errors = 0;

    for (const alert of alertsToCheck) {
      try {
        if (new Date(alert.depart_date) < new Date()) {
          queries.updateAlertStatus(alert.id, 'expired');
          console.log(`[CRON] Alert #${alert.id} expired (departure date passed)`);
          continue;
        }

        const result = await priceChecker.checkAlert(alert);
        checked++;

        if (result?.triggered) {
          triggered++;
          console.log(`[CRON] Alert #${alert.id} TRIGGERED! R$${result.price}`);
        } else {
          console.log(`[CRON] Alert #${alert.id}: R$${result?.price || 'N/A'}`);
        }
      } catch (err) {
        errors++;
        console.error(`[CRON] Error on alert #${alert.id}:`, err.message);
      }

      await new Promise((r) => setTimeout(r, delayBetweenRequestsMs));
    }

    console.log(`[CRON] Complete: ${checked} checked, ${triggered} triggered, ${errors} errors`);
  });

  console.log('[CRON] Scheduled');
}

module.exports = { startCron };
