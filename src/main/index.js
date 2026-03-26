const { app, BrowserWindow, protocol, ipcMain } = require('electron');
const path = require('path');
const { registerHandlers } = require('./ipc-handlers');
const { createTray } = require('./tray');
const { startScheduler, stopScheduler } = require('./capture/screenshot');
const { startTracking, stopTracking } = require('./capture/activity');
const { startAdminSync, stopAdminSync } = require('./capture/admin-sync');
const { getSettings } = require('./settings');
const { scheduleCleanup } = require('./cleanup');
const { createLoginWindow, closeLoginWindow } = require('./login-window');

// Single instance lock
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  process.exit(0);
}

let mainWindow = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 700,
    minWidth: 800,
    minHeight: 500,
    title: 'Desktop Monitor',
    backgroundColor: '#1a1a2e',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // Allow loading local file:// images in renderer
      webSecurity: false
    },
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Staff app is tray-only — window stays hidden unless opened explicitly
  mainWindow.once('ready-to-show', () => {
    if (process.argv.includes('--dev')) mainWindow.show();
  });

  // Don't quit when window is closed — stay in tray
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  return mainWindow;
}

function bootMainApp() {
  mainWindow = createMainWindow();
  registerHandlers(mainWindow);
  createTray();
  scheduleCleanup();

  const settings = getSettings();
  if (settings.isRunning) {
    startScheduler(mainWindow);
    startTracking(mainWindow);
  }

  // Poll Firestore every 30s for admin-controlled config
  startAdminSync(mainWindow);
}

app.whenReady().then(() => {
  // Register a custom protocol for serving local screenshots
  protocol.registerFileProtocol('monitor', (request, callback) => {
    const url = request.url.replace('monitor://', '');
    callback({ path: decodeURIComponent(url) });
  });

  const settings = getSettings();

  if (!settings.refreshToken) {
    // First run — show login window
    ipcMain.handle('auth:getConfig', () => ({
      apiKey: 'AIzaSyBPxR6GnIa1b9KEQ_R3IWDNSobjaYSLbIU',
      authDomain: 'screenshot-2bb17.firebaseapp.com',
      projectId: 'screenshot-2bb17'
    }));

    ipcMain.handle('auth:loginSuccess', async (_e, userData) => {
      const { patchSettings } = require('./settings');
      const { saveUserRecord, refreshIdToken } = require('./firebase-api');

      patchSettings({
        userId: userData.uid,
        userEmail: userData.email,
        refreshToken: userData.refreshToken,
        companyName: userData.companyName
      });

      // Create/update user profile in Firestore users table
      try {
        const tokens = await refreshIdToken(userData.refreshToken);
        await saveUserRecord({
          idToken: tokens.idToken,
          userId: userData.uid,
          userEmail: userData.email,
          companyName: userData.companyName
        });
        patchSettings({ refreshToken: tokens.refreshToken });
      } catch (err) {
        console.error('Failed to save user record:', err.message);
      }

      closeLoginWindow();
      bootMainApp();
      return { ok: true };
    });

    const loginWin = createLoginWindow();

    // If user closes login window without logging in → quit the app.
    // Without this, the app runs invisibly (no window, no tray) on Windows
    // and becomes impossible to close without Task Manager.
    loginWin.on('closed', () => {
      if (!getSettings().refreshToken) {
        app.quit();
      }
    });
  } else {
    bootMainApp();
  }

  // macOS: re-create window if dock icon clicked
  app.on('activate', () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      if (getSettings().refreshToken) {
        mainWindow = createMainWindow();
      }
    } else {
      mainWindow.show();
    }
  });
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
  stopAdminSync();
  stopScheduler();
  stopTracking();
});

// Prevent quit when all windows closed (stay in tray)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // On non-mac, keep running (tray app)
    // app.quit() — removed intentionally
  }
});
