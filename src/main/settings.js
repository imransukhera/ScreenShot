const Store = require('electron-store');
const path = require('path');
const { app } = require('electron');

const schema = {
  captureInterval: {
    type: 'number',
    minimum: 3,
    maximum: 3600,
    default: 30
  },
  storageDir: {
    type: 'string',
    default: ''
  },
  maxStorageDays: {
    type: 'number',
    default: 30
  },
  maxStorageMB: {
    type: 'number',
    default: 2048
  },
  isRunning: {
    type: 'boolean',
    default: true
  },
  launchAtLogin: {
    type: 'boolean',
    default: false
  },
  theme: {
    type: 'string',
    default: 'dark'
  },
  userId: {
    type: 'string',
    default: ''
  },
  userEmail: {
    type: 'string',
    default: ''
  },
  refreshToken: {
    type: 'string',
    default: ''
  },
  companyName: {
    type: 'string',
    default: ''
  }
};

let store;

function getStore() {
  if (!store) {
    store = new Store({ schema });
    // Set default storageDir if not set
    if (!store.get('storageDir')) {
      const defaultDir = path.join(app.getPath('documents'), 'desktop-monitor', 'screenshots');
      store.set('storageDir', defaultDir);
    }
  }
  return store;
}

function getSettings() {
  const s = getStore();
  return {
    captureInterval: s.get('captureInterval'),
    storageDir: s.get('storageDir'),
    maxStorageDays: s.get('maxStorageDays'),
    maxStorageMB: s.get('maxStorageMB'),
    isRunning: s.get('isRunning'),
    launchAtLogin: s.get('launchAtLogin'),
    theme: s.get('theme'),
    userId: s.get('userId'),
    userEmail: s.get('userEmail'),
    refreshToken: s.get('refreshToken'),
    companyName: s.get('companyName')
  };
}

function patchSettings(patch) {
  const s = getStore();
  Object.entries(patch).forEach(([key, value]) => {
    s.set(key, value);
  });
}

module.exports = { getSettings, patchSettings, getStore };
