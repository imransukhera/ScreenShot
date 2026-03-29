@echo off
REM This script builds the Windows installer for Desktop Monitor
REM Usage: build-win.bat [GITHUB_TOKEN]
REM 
REM The GITHUB_TOKEN is optional and only needed if you want automatic GitHub release publishing

echo ========================================
echo  Desktop Monitor - Windows Build Script
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    exit /b 1
)

echo [1/4] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    exit /b 1
)
echo [✓] Dependencies installed

echo.
echo [2/4] Removing old build...
if exist "dist" (
    rmdir /s /q dist
    echo [✓] Old build removed
)

echo.
echo [3/4] Building installer...

REM Check if GitHub token is provided as argument
if not "%1"=="" (
    echo [→] Using GitHub token for auto-release to GitHub
    set GH_TOKEN=%1
)

REM If GH_TOKEN is set in environment, it will be used
if defined GH_TOKEN (
    echo [→] GitHub token detected - will publish to GitHub Releases
) else (
    echo [→] GitHub token not provided - build only (no auto-publish)
    echo    To enable auto-publish, provide token: build-win.bat YOUR_GITHUB_TOKEN
)

call npm run build:win
if errorlevel 1 (
    echo ERROR: Build failed
    exit /b 1
)
echo [✓] Build completed

echo.
echo [4/4] Checking output...

REM Look for the installer file
if exist "dist\Desktop Monitor Setup*.exe" (
    echo [✓] Installer created successfully!
    echo.
    echo Build output directory: dist\
    echo.
    REM List the installer file(s)
    echo Installer file(s):
    dir /b "dist\*.exe"
    echo.
    echo Next steps:
    echo 1. Test the installer: Run "dist\Desktop Monitor Setup X.X.X.exe"
    echo 2. Push to GitHub: git push origin main
    echo 3. Create GitHub Release: Visit https://github.com/YOUR_USERNAME/desktop-monitor/releases
    echo.
) else (
    echo ERROR: Installer not found in dist folder
    exit /b 1
)

echo Build completed successfully!
echo.
pause
