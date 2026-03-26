const { getSettings, patchSettings } = require('../settings');
const { refreshIdToken, getAdminConfig } = require('../firebase-api');
const { startScheduler, stopScheduler, restartScheduler, isRunning, captureNow } = require('./screenshot');
const { startTracking, stopTracking } = require('./activity');

const POLL_INTERVAL_MS = 30 * 1000; // check every 30 seconds

let syncTimer = null;
let mainWindowRef = null;
let lastForceScreenshotAt = null;

async function syncConfig() {
  const settings = getSettings();
  if (!settings.refreshToken || !settings.companyName) return;

  try {
    const tokens = await refreshIdToken(settings.refreshToken);
    patchSettings({ refreshToken: tokens.refreshToken });

    const config = await getAdminConfig(tokens.idToken, settings.companyName);
    if (!config) return;

    const currentInterval = getSettings().captureInterval;
    const currentlyRunning = isRunning();

    // Apply interval change — restart scheduler if active
    if (config.captureInterval !== undefined && config.captureInterval !== currentInterval) {
      patchSettings({ captureInterval: config.captureInterval });
      if (currentlyRunning) {
        restartScheduler(mainWindowRef);
      }
      console.log(`[admin-sync] captureInterval updated to ${config.captureInterval}s`);
    }

    // Apply enabled/disabled change
    if (config.captureEnabled !== undefined && config.captureEnabled !== currentlyRunning) {
      if (config.captureEnabled) {
        startScheduler(mainWindowRef);
        startTracking(mainWindowRef);
        patchSettings({ isRunning: true });
        console.log('[admin-sync] capture ENABLED by admin');
      } else {
        stopScheduler();
        stopTracking();
        patchSettings({ isRunning: false });
        console.log('[admin-sync] capture DISABLED by admin');
      }
    }

    // Force screenshot if admin triggered one
    if (config.forceScreenshotAt && config.forceScreenshotAt !== lastForceScreenshotAt) {
      lastForceScreenshotAt = config.forceScreenshotAt;
      captureNow(mainWindowRef);
      console.log('[admin-sync] force screenshot triggered by admin');
    }

    // Notify tray to redraw
    try {
      const { updateTrayMenu } = require('../tray');
      updateTrayMenu();
    } catch {}
  } catch (err) {
    console.warn('[admin-sync] config fetch failed:', err.message);
  }
}

function startAdminSync(mainWindow) {
  mainWindowRef = mainWindow;
  syncConfig(); // immediate first sync
  syncTimer = setInterval(syncConfig, POLL_INTERVAL_MS);
}

function stopAdminSync() {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
}

module.exports = { startAdminSync, stopAdminSync };
