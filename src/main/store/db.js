const path = require('path');
const { app } = require('electron');

let db;

function getDb() {
  if (!db) {
    try {
      const Database = require('better-sqlite3');
      const dbDir = app.getPath('userData');
      const dbPath = path.join(dbDir, 'monitor.db');
      db = new Database(dbPath);
      db.pragma('journal_mode = WAL');
      initSchema(db);
    } catch (err) {
      // better-sqlite3 not installed — use in-memory fallback
      console.warn('better-sqlite3 not available, using in-memory store:', err.message);
      db = createInMemoryDb();
    }
  }
  return db;
}

function initSchema(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS screenshots (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path   TEXT NOT NULL,
      timestamp   TEXT NOT NULL,
      app_name    TEXT,
      created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS activity (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      bucket            TEXT NOT NULL,
      app_name          TEXT NOT NULL DEFAULT 'Unknown',
      mouse_clicks      INTEGER DEFAULT 0,
      key_presses       INTEGER DEFAULT 0,
      mouse_move_count  INTEGER DEFAULT 0,
      mouse_distance    INTEGER DEFAULT 0,
      created_at        TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_screenshots_timestamp ON screenshots(timestamp);
    CREATE INDEX IF NOT EXISTS idx_activity_bucket ON activity(bucket);
  `);
}

// Simple in-memory fallback (no persistence) when better-sqlite3 is unavailable
function createInMemoryDb() {
  const screenshots = [];
  const activity = [];
  let ssId = 1;
  let actId = 1;

  return {
    prepare: (sql) => {
      if (sql.includes('INSERT INTO screenshots')) {
        return {
          run: (params) => {
            screenshots.push({ id: ssId++, ...params, created_at: new Date().toISOString() });
            return { lastInsertRowid: ssId - 1 };
          }
        };
      }
      if (sql.includes('INSERT INTO activity')) {
        return {
          run: (params) => {
            activity.push({ id: actId++, ...params, created_at: new Date().toISOString() });
            return { lastInsertRowid: actId - 1 };
          }
        };
      }
      if (sql.includes('SELECT') && sql.includes('screenshots')) {
        return { all: () => screenshots.slice(-200) };
      }
      if (sql.includes('SELECT') && sql.includes('activity')) {
        return {
          get: (bucket, appName) => activity.find(r => r.bucket === bucket && r.app_name === appName) || null,
          all: () => activity.slice(-500)
        };
      }
      if (sql.includes('DELETE')) {
        return { run: () => {} };
      }
      return { run: () => {}, all: () => [], get: () => null };
    },
    exec: () => {},
    pragma: () => {},
    _screenshots: screenshots,
    _activity: activity
  };
}

module.exports = { getDb };
