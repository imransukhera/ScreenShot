const { ipcMain, dialog, shell } = require('electron');
const { getSettings, patchSettings } = require('./settings');
const { getScreenshots, deleteScreenshot } = require('./store/screenshots');
const { getActivity } = require('./store/activity');
const { startScheduler, stopScheduler, isRunning, getNextCaptureIn, captureNow, restartScheduler } = require('./capture/screenshot');
const { startTracking, stopTracking, getMouseTrail } = require('./capture/activity');
const { enableAutoStart, disableAutoStart, isAutoStartEnabled } = require('./autostart');
const fs = require('fs');

function registerHandlers(mainWindow) {
  ipcMain.handle('monitor:getSettings', () => getSettings());

  ipcMain.handle('monitor:saveSettings', (_e, patch) => {
    patchSettings(patch);
    if (patch.captureInterval && isRunning()) restartScheduler(mainWindow);
    if (typeof patch.launchAtLogin !== 'undefined') {
      const { app } = require('electron');
      app.setLoginItemSettings({ openAtLogin: patch.launchAtLogin, openAsHidden: true });
    }
    return { ok: true };
  });

  ipcMain.handle('monitor:getScreenshots', (_e, opts) =>
    getScreenshots(opts || {}).map(r => ({
      id: r.id,
      filePath: r.file_path,
      timestamp: r.timestamp,
      appName: r.app_name,
      filename: r.file_path ? r.file_path.split('/').pop() : ''
    }))
  );

  ipcMain.handle('monitor:getActivity', (_e, opts) => getActivity(opts || {}));

  ipcMain.handle('monitor:getMouseTrail', () => getMouseTrail());

  ipcMain.handle('monitor:startCapture', () => {
    startScheduler(mainWindow);
    startTracking(mainWindow);
    patchSettings({ isRunning: true });
    return { ok: true };
  });

  ipcMain.handle('monitor:stopCapture', () => {
    stopScheduler();
    stopTracking();
    patchSettings({ isRunning: false });
    return { ok: true };
  });

  ipcMain.handle('monitor:captureNow', () => captureNow(mainWindow));

  ipcMain.handle('monitor:deleteScreenshot', (_e, id, filePath) => {
    deleteScreenshot(id);
    if (filePath) {
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch {}
    }
    return { ok: true };
  });

  ipcMain.handle('monitor:openScreenshot', (_e, filePath) => {
    if (filePath && fs.existsSync(filePath)) shell.openPath(filePath);
    return { ok: true };
  });

  ipcMain.handle('monitor:getStatus', () => ({
    isRunning: isRunning(),
    nextCaptureIn: getNextCaptureIn()
  }));

  ipcMain.handle('monitor:selectDirectory', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Screenshots Folder'
    });
    return (!result.canceled && result.filePaths.length > 0) ? result.filePaths[0] : null;
  });

  // Auto-start handlers
  ipcMain.handle('monitor:enableAutoStart', () => {
    enableAutoStart();
    patchSettings({ launchAtLogin: true });
    return { ok: true };
  });

  ipcMain.handle('monitor:disableAutoStart', () => {
    disableAutoStart();
    patchSettings({ launchAtLogin: false });
    return { ok: true };
  });

  ipcMain.handle('monitor:isAutoStartEnabled', () => isAutoStartEnabled());
}

module.exports = { registerHandlers };
