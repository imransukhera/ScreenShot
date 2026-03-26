const { BrowserWindow } = require('electron');
const path = require('path');

let loginWindow = null;

function createLoginWindow() {
  loginWindow = new BrowserWindow({
    width: 420,
    height: 500,
    resizable: false,
    title: 'Desktop Monitor — Login',
    backgroundColor: '#0f0f23',
    webPreferences: {
      preload: path.join(__dirname, '../preload/login-preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  loginWindow.loadFile(path.join(__dirname, '../renderer/login.html'));
  loginWindow.setMenuBarVisibility(false);

  loginWindow.on('closed', () => { loginWindow = null; });

  return loginWindow;
}

function closeLoginWindow() {
  if (loginWindow && !loginWindow.isDestroyed()) {
    loginWindow.close();
    loginWindow = null;
  }
}

module.exports = { createLoginWindow, closeLoginWindow };
