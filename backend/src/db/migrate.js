const db = require('./database');

function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      origin_entity_id TEXT NOT NULL,
      origin_name TEXT NOT NULL,
      origin_display_code TEXT,
      dest_entity_id TEXT NOT NULL,
      dest_name TEXT NOT NULL,
      dest_display_code TEXT,
      depart_date TEXT NOT NULL,
      return_date TEXT,
      target_price REAL NOT NULL,
      cabin_class TEXT DEFAULT 'economy',
      passengers INTEGER DEFAULT 1,
      currency TEXT DEFAULT 'BRL',
      status TEXT DEFAULT 'active',
      current_price REAL,
      lowest_price REAL,
      last_checked_at DATETIME,
      triggered_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alert_id INTEGER NOT NULL,
      price REAL NOT NULL,
      cheapest_airline TEXT,
      cheapest_flight_numbers TEXT,
      stops INTEGER,
      bucket_type TEXT,
      raw_response_summary TEXT,
      checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alert_id INTEGER NOT NULL,
      type TEXT DEFAULT 'price_target',
      price_at_trigger REAL,
      message TEXT,
      read_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
    CREATE INDEX IF NOT EXISTS idx_price_history_alert ON price_history(alert_id, checked_at);
    CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(alert_id, read_at);
  `);

  console.log('[DB] Migration complete');
}

module.exports = { migrate };
