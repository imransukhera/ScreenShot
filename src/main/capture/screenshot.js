const path = require('path');
const fs = require('fs');
const { format } = require('date-fns');
const { getSettings, patchSettings } = require('../settings');
const { insertScreenshot } = require('../store/screenshots');
const { saveScreenshotRecord } = require('../firebase-api');

let timer = null;
let nextCaptureTime = null;

function getActiveAppName() {
  try {
    const { getWindowSync } = require('get-windows');
    const win = getWindowSync();
    return win ? (win.owner ? win.owner.name : 'Unknown') : 'Unknown';
  } catch {
    return 'Unknown';
  }
}

async function captureNow(mainWindow) {
  const settings = getSettings();
  const storageDir = settings.storageDir;

  // Ensure storage dir exists
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  const now = new Date();
  const timestamp = now.toISOString();
  const filename = format(now, "yyyy-MM-dd_HH-mm-ss") + '.png';
  const filePath = path.join(storageDir, filename);

  try {
    const screenshot = require('screenshot-desktop');
    const imgBuffer = await screenshot({ format: 'png' });
    fs.writeFileSync(filePath, imgBuffer);

    const appName = getActiveAppName();
    const id = insertScreenshot({ filePath, timestamp, appName });

    const record = { id, filePath, timestamp, appName, filename };

    // Save metadata to Firestore (async, non-blocking — no image upload)
    const fbSettings = getSettings();
    if (fbSettings.refreshToken && fbSettings.userId) {
      saveScreenshotRecord({
        refreshToken: fbSettings.refreshToken,
        filePath,
        timestamp,
        appName,
        userId: fbSettings.userId,
        userEmail: fbSettings.userEmail,
        companyName: fbSettings.companyName
      }).then(({ refreshToken: newToken }) => {
        patchSettings({ refreshToken: newToken });
      }).catch(err => {
        console.error('Firestore save failed:', err.message);
      });
    }

    // Notify renderer
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('screenshot:new', record);
    }

    return record;
  } catch (err) {
    console.error('Screenshot failed:', err.message);
    return null;
  }
}

function startScheduler(mainWindow) {
  const settings = getSettings();
  const intervalMs = settings.captureInterval * 1000;

  if (timer) clearInterval(timer);

  // Capture immediately on start
  captureNow(mainWindow);

  timer = setInterval(() => {
    captureNow(mainWindow);
    nextCaptureTime = Date.now() + intervalMs;
  }, intervalMs);

  nextCaptureTime = Date.now() + intervalMs;
  console.log(`Screenshot scheduler started: every ${settings.captureInterval}s`);
}

function stopScheduler() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  nextCaptureTime = null;
  console.log('Screenshot scheduler stopped');
}

function isRunning() {
  return timer !== null;
}

function getNextCaptureIn() {
  if (!nextCaptureTime) return null;
  return Math.max(0, Math.round((nextCaptureTime - Date.now()) / 1000));
}

function restartScheduler(mainWindow) {
  stopScheduler();
  startScheduler(mainWindow);
  const settings = getSettings();
  const intervalMs = settings.captureInterval * 1000;
  nextCaptureTime = Date.now() + intervalMs;
}

module.exports = { startScheduler, stopScheduler, isRunning, getNextCaptureIn, captureNow, restartScheduler };
