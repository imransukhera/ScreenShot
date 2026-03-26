const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('loginBridge', {
  loginSuccess: (userData) => ipcRenderer.invoke('auth:loginSuccess', userData),
  getConfig: () => ipcRenderer.invoke('auth:getConfig')
});
