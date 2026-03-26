const { getDb } = require('./db');

function insertScreenshot({ filePath, timestamp, appName }) {
  const db = getDb();
  const stmt = db.prepare(
    'INSERT INTO screenshots (file_path, timestamp, app_name) VALUES (?, ?, ?)'
  );
  const result = stmt.run(filePath, timestamp, appName || 'Unknown');
  return result.lastInsertRowid;
}

function getScreenshots({ limit = 100, offset = 0, date } = {}) {
  const db = getDb();
  let sql = 'SELECT * FROM screenshots';
  const params = [];
  if (date) {
    sql += ' WHERE timestamp LIKE ?';
    params.push(`${date}%`);
  }
  sql += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  return db.prepare(sql).all(...params);
}

function deleteScreenshot(id) {
  const db = getDb();
  return db.prepare('DELETE FROM screenshots WHERE id = ?').run(id);
}

function deleteOlderThan(isoDate) {
  const db = getDb();
  return db.prepare("DELETE FROM screenshots WHERE timestamp < ?").run(isoDate);
}

function getScreenshotsOlderThan(isoDate) {
  const db = getDb();
  return db.prepare('SELECT id, file_path FROM screenshots WHERE timestamp < ?').all(isoDate);
}

module.exports = { insertScreenshot, getScreenshots, deleteScreenshot, deleteOlderThan, getScreenshotsOlderThan };
