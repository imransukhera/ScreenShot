const { upsertActivity } = require('../store/activity');

let mouseClicks = 0;
let keyPresses = 0;
let currentApp = 'Unknown';
let flushTimer = null;
let uiohookStarted = false;
let mainWindowRef = null;

// Mouse movement tracking
let mousePositions = [];        // Sampled positions: [{x, y, t}]
let lastSampleTime = 0;
const SAMPLE_INTERVAL_MS = 300; // Sample cursor every 300ms
let mouseDistance = 0;          // Total pixels moved
let lastMouseX = null;
let lastMouseY = null;
let mouseMoveCount = 0;

function getBucketKey() {
  const now = new Date();
  now.setSeconds(0, 0);
  return now.toISOString().slice(0, 16); // "2026-03-25T14:32"
}

function getActiveApp() {
  try {
    const { getWindowSync } = require('get-windows');
    const win = getWindowSync();
    return win && win.owner ? win.owner.name : 'Unknown';
  } catch {
    return 'Unknown';
  }
}

function flushActivity() {
  if (mouseClicks === 0 && keyPresses === 0 && mouseMoveCount === 0) return;

  const bucket = getBucketKey();
  const appName = currentApp;
  const row = {
    bucket,
    appName,
    mouseClicks,
    keyPresses,
    mouseMoveCount,
    mouseDistance: Math.round(mouseDistance)
  };

  upsertActivity(row);

  // Push to renderer
  if (mainWindowRef && !mainWindowRef.isDestroyed()) {
    mainWindowRef.webContents.send('activity:update', row);
  }

  // Reset counters
  mouseClicks = 0;
  keyPresses = 0;
  mouseMoveCount = 0;
  mouseDistance = 0;
}

function startTracking(mainWindow) {
  mainWindowRef = mainWindow;

  // Update current app every 5 seconds
  setInterval(() => {
    currentApp = getActiveApp();
  }, 5000);
  currentApp = getActiveApp();

  try {
    const { uIOhook } = require('uiohook-napi');

    // Track mouse clicks
    uIOhook.on('mousedown', () => {
      mouseClicks++;
    });

    // Track key presses
    uIOhook.on('keydown', () => {
      keyPresses++;
    });

    // Track mouse MOVEMENT — sample position every 300ms to avoid flooding
    uIOhook.on('mousemove', (event) => {
      const now = Date.now();
      mouseMoveCount++;

      // Calculate distance moved
      if (lastMouseX !== null && lastMouseY !== null) {
        const dx = event.x - lastMouseX;
        const dy = event.y - lastMouseY;
        mouseDistance += Math.sqrt(dx * dx + dy * dy);
      }
      lastMouseX = event.x;
      lastMouseY = event.y;

      // Sample for trail visualization (throttled)
      if (now - lastSampleTime >= SAMPLE_INTERVAL_MS) {
        lastSampleTime = now;
        const sample = { x: event.x, y: event.y, t: now };
        mousePositions.push(sample);

        // Keep last 500 samples in memory
        if (mousePositions.length > 500) {
          mousePositions.shift();
        }

        // Send live cursor position to renderer (throttled)
        if (mainWindowRef && !mainWindowRef.isDestroyed()) {
          mainWindowRef.webContents.send('cursor:move', sample);
        }
      }
    });

    uIOhook.start();
    uiohookStarted = true;
    console.log('Activity tracking started (mouse move + click + keyboard)');
  } catch (err) {
    console.warn('uiohook-napi failed:', err.message);
  }

  // Flush every 60 seconds
  flushTimer = setInterval(flushActivity, 60 * 1000);
}

function stopTracking() {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }

  flushActivity();

  if (uiohookStarted) {
    try {
      const { uIOhook } = require('uiohook-napi');
      uIOhook.stop();
      uiohookStarted = false;
    } catch {}
  }

  console.log('Activity tracking stopped');
}

function getMouseTrail() {
  return mousePositions.slice(-200); // Return last 200 samples
}

module.exports = { startTracking, stopTracking, getMouseTrail };
