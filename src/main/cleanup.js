const fs = require('fs');
const { getSettings } = require('./settings');
const { getScreenshotsOlderThan, deleteOlderThan: deleteOldScreenshots } = require('./store/screenshots');
const { deleteOlderThan: deleteOldActivity } = require('./store/activity');

function runCleanup() {
  const settings = getSettings();
  const days = settings.maxStorageDays || 30;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const isoDate = cutoff.toISOString();
  const bucketDate = isoDate.slice(0, 16);

  // Delete files from disk before removing DB records
  const oldScreenshots = getScreenshotsOlderThan(isoDate);
  oldScreenshots.forEach(s => {
    try {
      if (s.file_path && fs.existsSync(s.file_path)) {
        fs.unlinkSync(s.file_path);
      }
    } catch {}
  });

  deleteOldScreenshots(isoDate);
  deleteOldActivity(bucketDate);

  console.log(`Cleanup: removed ${oldScreenshots.length} screenshots older than ${days} days`);
}

function scheduleCleanup() {
  // Run once after app settles (10s delay)
  setTimeout(runCleanup, 10000);
  // Then every 24 hours
  setInterval(runCleanup, 24 * 60 * 60 * 1000);
}

module.exports = { runCleanup, scheduleCleanup };
