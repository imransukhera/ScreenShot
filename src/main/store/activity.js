const { getDb } = require('./db');

function upsertActivity({ bucket, appName, mouseClicks, keyPresses, mouseMoveCount = 0, mouseDistance = 0 }) {
  const db = getDb();
  const existing = db.prepare(
    'SELECT id, mouse_clicks, key_presses, mouse_move_count, mouse_distance FROM activity WHERE bucket = ? AND app_name = ?'
  ).get(bucket, appName);

  if (existing) {
    db.prepare(
      'UPDATE activity SET mouse_clicks = ?, key_presses = ?, mouse_move_count = ?, mouse_distance = ? WHERE id = ?'
    ).run(
      existing.mouse_clicks + mouseClicks,
      existing.key_presses + keyPresses,
      (existing.mouse_move_count || 0) + mouseMoveCount,
      (existing.mouse_distance || 0) + mouseDistance,
      existing.id
    );
  } else {
    db.prepare(
      'INSERT INTO activity (bucket, app_name, mouse_clicks, key_presses, mouse_move_count, mouse_distance) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(bucket, appName, mouseClicks, keyPresses, mouseMoveCount, mouseDistance);
  }
}

function getActivity({ start, end, limit = 500 } = {}) {
  const db = getDb();
  let sql = 'SELECT * FROM activity';
  const params = [];
  const conditions = [];
  if (start) { conditions.push('bucket >= ?'); params.push(start); }
  if (end)   { conditions.push('bucket <= ?'); params.push(end); }
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY bucket ASC LIMIT ?';
  params.push(limit);
  return db.prepare(sql).all(...params);
}

function deleteOlderThan(isoDate) {
  return getDb().prepare('DELETE FROM activity WHERE bucket < ?').run(isoDate);
}

module.exports = { upsertActivity, getActivity, deleteOlderThan };
