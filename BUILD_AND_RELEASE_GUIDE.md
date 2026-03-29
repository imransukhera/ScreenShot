# Build & Release Guide for Desktop Monitor

## Prerequisites

Ensure you have:
- Node.js and npm installed
- Git installed
- A GitHub account

## Step 1: Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Create a new repository named `desktop-monitor` (or your preferred name)
3. Copy the HTTPS URL of your repository
4. In your project directory, run:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/desktop-monitor.git
git push -u origin main
```

## Step 2: Update package.json

Update the `publish` section in `package.json` with your GitHub info:

```json
"publish": {
  "provider": "github",
  "owner": "YOUR_GITHUB_USERNAME",
  "repo": "desktop-monitor"
}
```

Example:
```json
"publish": {
  "provider": "github",
  "owner": "johndoe",
  "repo": "desktop-monitor"
}
```

## Step 3: Create GitHub Personal Access Token

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a name like "Desktop Monitor Build"
4. Select scopes:
   - `public_repo` - for public repositories
   - `repo` - if you use private repositories
5. Click "Generate token"
6. **COPY the token immediately** (you won't see it again)

## Step 4: Build for Windows

### Option 1: Build with Auto-Release (Recommended)

Set the GitHub token environment variable and build:

**On Windows PowerShell:**
```powershell
$env:GH_TOKEN = "YOUR_GITHUB_TOKEN"
npm run build:win
```

**On Command Prompt:**
```cmd
set GH_TOKEN=YOUR_GITHUB_TOKEN
npm run build:win
```

### Option 2: Manual Build (Without Auto-Release)

```bash
npm run build:win
```

The installer will be created in the `dist` folder.

## Step 5: Create GitHub Release

If you used auto-release, the release will be created automatically. Otherwise, do this manually:

1. Go to your GitHub repository
2. Click "Releases" on the right sidebar
3. Click "Create a new release"
4. Tag version: `v1.0.0` (must match your package.json version)
5. Release title: `Desktop Monitor v1.0.0`
6. Upload the installer from `dist/Desktop Monitor Setup 1.0.0.exe`
7. Click "Publish release"

## Step 6: Install on User Laptops

1. Go to your GitHub repository's releases page
2. Download the `.exe` installer
3. Run the installer
4. The app will:
   - Install automatically
   - Run on background
   - Start automatically when Windows boots
   - Begin capturing screenshots immediately
   - Upload screenshots to Firebase

## Auto-Start Configuration

The app automatically:
- ✅ Runs in system tray (not visible on desktop)
- ✅ Starts when Windows boots (if enabled in settings)
- ✅ Captures screenshots at configured interval
- ✅ Uploads to Firebase automatically
- ✅ Can be toggled on/off from the dashboard

## Building After Updates

1. Update your code
2. Update version in `package.json` (e.g., `1.0.1`)
3. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update features"
   git push
   ```
4. Set GitHub token and build:
   ```powershell
   $env:GH_TOKEN = "YOUR_GITHUB_TOKEN"
   npm run build:win
   ```
   OR build without auto-release and create release manually
5. Users will be notified of the update on next app restart

## Environment Variables

For automated builds:
- `GH_TOKEN` - Your GitHub personal access token
- `CSC_LINK` - (Optional) Path to code signing certificate
- `CSC_KEY_PASSWORD` - (Optional) Code signing password

## Troubleshooting

### Build fails with "publish" error
- Run `npm install` to ensure all dependencies are installed
- Check that `GH_TOKEN` is set correctly

### Installer won't run
- Ensure you're on Windows 10 or later
- Run as Administrator if needed
- Disable antivirus temporarily during installation

### App doesn't auto-start
- Check Settings tab → "Launch at Login" is enabled
- Open Task Scheduler and search for "DesktopMonitor" to verify registry entry

### Screenshots not uploading
- Check Firebase credentials are correct in `src/main/firebase-api.js`
- Verify Firebase project has file upload rules configured

## Distributing to Users

### Option 1: Direct Download
- Send users the GitHub releases page link
- They download and install the `.exe`

### Option 2: Automated Installer Script
Create `installer.bat` for your team:
```batch
@echo off
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/YOUR_USERNAME/desktop-monitor/releases/download/v1.0.0/Desktop%20Monitor%20Setup%201.0.0.exe' -OutFile 'Desktop Monitor Setup.exe'; Start-Process 'Desktop Monitor Setup.exe'"
```

Share this script with users to automatically download and install the latest version.

## Notes

- The app runs **completely in the background** after installation
- Only appears in the system tray (bottom-right corner)
- Screenshot interval is configurable (default: 60 seconds)
- All screenshots are automatically uploaded to Firebase
- Right-click the tray icon to access the dashboard
