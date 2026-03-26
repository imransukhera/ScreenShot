const { Tray, Menu, nativeImage, app } = require('electron');
const path = require('path');
const { isRunning, getNextCaptureIn } = require('./capture/screenshot');

let tray = null;
let countdownTimer = null;

function createTray() {
  // Create a simple programmatic icon if assets don't exist
  const iconPath = path.join(__dirname, '../../assets/tray-icon.png');
  let icon;
  try {
    icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
      icon = nativeImage.createEmpty();
    }
  } catch {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip('Desktop Monitor');

  updateTrayMenu();

  // Update countdown every 5 seconds (less heavy on Windows)
  countdownTimer = setInterval(updateTrayMenu, 5000);


  return tray;
}

function updateTrayMenu() {
  if (!tray) return;

  const running = isRunning();
  const nextIn = getNextCaptureIn();
  const nextLabel = running && nextIn !== null ? `Next capture in: ${nextIn}s` : 'Paused';

  const menu = Menu.buildFromTemplate([
    { label: 'Desktop Monitor', enabled: false },
    { type: 'separator' },
    { label: running ? '● Recording' : '○ Paused', enabled: false },
    { label: nextLabel, enabled: false },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => app.quit()
    }
  ]);

  tray.setContextMenu(menu);
}

function destroyTray() {
  if (countdownTimer) clearInterval(countdownTimer);
  if (tray) tray.destroy();
}

module.exports = { createTray, updateTrayMenu, destroyTray };
