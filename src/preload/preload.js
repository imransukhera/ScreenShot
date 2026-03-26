const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('monitor', {
  // Settings
  getSettings: () => ipcRenderer.invoke('monitor:getSettings'),
  saveSettings: (patch) => ipcRenderer.invoke('monitor:saveSettings', patch),

  // Screenshots
  getScreenshots: (opts) => ipcRenderer.invoke('monitor:getScreenshots', opts),
  deleteScreenshot: (id, filePath) => ipcRenderer.invoke('monitor:deleteScreenshot', id, filePath),
  openScreenshot: (filePath) => ipcRenderer.invoke('monitor:openScreenshot', filePath),

  // Activity
  getActivity: (opts) => ipcRenderer.invoke('monitor:getActivity', opts),
  getMouseTrail: () => ipcRenderer.invoke('monitor:getMouseTrail'),

  // Capture control
  startCapture: () => ipcRenderer.invoke('monitor:startCapture'),
  stopCapture: () => ipcRenderer.invoke('monitor:stopCapture'),
  captureNow: () => ipcRenderer.invoke('monitor:captureNow'),

  // Status
  getStatus: () => ipcRenderer.invoke('monitor:getStatus'),

  // Dialog
  selectDirectory: () => ipcRenderer.invoke('monitor:selectDirectory'),

  // Events (push from main) — prefix unused ipcRenderer event arg with _
  onScreenshotNew: (callback) => {
    const handler = (_e, data) => callback(data);
    ipcRenderer.on('screenshot:new', handler);
    return () => ipcRenderer.removeListener('screenshot:new', handler);
  },
  onActivityUpdate: (callback) => {
    const handler = (_e, data) => callback(data);
    ipcRenderer.on('activity:update', handler);
    return () => ipcRenderer.removeListener('activity:update', handler);
  },
  onStatusChanged: (callback) => {
    const handler = (_e, data) => callback(data);
    ipcRenderer.on('status:changed', handler);
    return () => ipcRenderer.removeListener('status:changed', handler);
  },
  onCursorMove: (callback) => {
    const handler = (_e, data) => callback(data);
    ipcRenderer.on('cursor:move', handler);
    return () => ipcRenderer.removeListener('cursor:move', handler);
  }
});
