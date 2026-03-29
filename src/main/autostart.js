const { app } = require('electron');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Enable auto-start on Windows by adding to Registry
 */
function enableAutoStart() {
  if (process.platform !== 'win32') return;

  try {
    const appPath = app.getPath('exe');
    const regKey = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';
    const appName = 'DesktopMonitor';

    // Use PowerShell to set registry value (more reliable on modern Windows)
    const psCommand = `
      $regPath = "${regKey}"
      $regName = "${appName}"
      $appPath = "${appPath}"
      
      if (!(Test-Path $regPath)) {
        New-Item -Path $regPath -Force | Out-Null
      }
      
      New-ItemProperty -Path $regPath -Name $regName -Value $appPath -PropertyType String -Force | Out-Null
    `;

    execSync(`powershell -Command "${psCommand.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`, {
      windowsHide: true
    });

    console.log('[AutoStart] ✓ Auto-start enabled');
    return true;
  } catch (error) {
    console.error('[AutoStart] Error enabling auto-start:', error.message);
    return false;
  }
}

/**
 * Disable auto-start on Windows
 */
function disableAutoStart() {
  if (process.platform !== 'win32') return;

  try {
    const regKey = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';
    const appName = 'DesktopMonitor';

    const psCommand = `
      $regPath = "${regKey}"
      $regName = "${appName}"
      
      try {
        Remove-ItemProperty -Path $regPath -Name $regName -Force -ErrorAction Stop
      } catch {}
    `;

    execSync(`powershell -Command "${psCommand.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`, {
      windowsHide: true
    });

    console.log('[AutoStart] ✓ Auto-start disabled');
    return true;
  } catch (error) {
    console.error('[AutoStart] Error disabling auto-start:', error.message);
    return false;
  }
}

/**
 * Check if auto-start is currently enabled
 */
function isAutoStartEnabled() {
  if (process.platform !== 'win32') return false;

  try {
    const appName = 'DesktopMonitor';
    const regKey = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';

    const psCommand = `
      $regPath = "${regKey}"
      $regName = "${appName}"
      
      $regValue = Get-ItemProperty -Path $regPath -Name $regName -ErrorAction SilentlyContinue
      if ($regValue) {
        Write-Host "ENABLED"
      }
    `;

    const output = execSync(`powershell -Command "${psCommand.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`, {
      windowsHide: true,
      encoding: 'utf-8'
    });

    return output.includes('ENABLED');
  } catch (error) {
    console.error('[AutoStart] Error checking auto-start status:', error.message);
    return false;
  }
}

module.exports = {
  enableAutoStart,
  disableAutoStart,
  isAutoStartEnabled
};
