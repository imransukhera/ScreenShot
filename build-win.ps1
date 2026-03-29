#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Build script for Desktop Monitor Windows installer
.DESCRIPTION
    This PowerShell script automates the build process for creating Windows installers
.PARAMETER GitHubToken
    GitHub personal access token for automatic release publishing (optional)
.EXAMPLE
    .\build-win.ps1
    .\build-win.ps1 -GitHubToken "ghp_xxxxxxxxxxxx"
#>

param(
    [string]$GitHubToken
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Desktop Monitor - Windows Build Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "[✓] Node.js $nodeVersion found" -ForegroundColor Green
} catch {
    Write-Host "[✗] ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "   Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Step 1: Install dependencies
Write-Host "[1/4] Installing dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "      Dependencies already installed, skipping..." -ForegroundColor Gray
} else {
    try {
        npm install
        Write-Host "[✓] Dependencies installed" -ForegroundColor Green
    } catch {
        Write-Host "[✗] ERROR: Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

# Step 2: Clean old build
Write-Host ""
Write-Host "[2/4] Removing old build..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item "dist" -Recurse -Force
    Write-Host "[✓] Old build removed" -ForegroundColor Green
} else {
    Write-Host "[✓] No previous build found" -ForegroundColor Green
}

# Step 3: Build installer
Write-Host ""
Write-Host "[3/4] Building installer..." -ForegroundColor Yellow

if ($GitHubToken) {
    $env:GH_TOKEN = $GitHubToken
    Write-Host "      GitHub token provided - will attempt auto-release" -ForegroundColor Cyan
} elseif ($env:GH_TOKEN) {
    Write-Host "      GitHub token from environment - will attempt auto-release" -ForegroundColor Cyan
} else {
    Write-Host "      No GitHub token - build only (no auto-publish)" -ForegroundColor Gray
    Write-Host "      Use: .\build-win.ps1 -GitHubToken 'your_token' for auto-release" -ForegroundColor Gray
}

try {
    npm run build:win
    Write-Host "[✓] Build completed successfully" -ForegroundColor Green
} catch {
    Write-Host "[✗] ERROR: Build failed" -ForegroundColor Red
    exit 1
}

# Step 4: Verify output
Write-Host ""
Write-Host "[4/4] Checking output..." -ForegroundColor Yellow

$installers = Get-ChildItem -Path "dist" -Filter "*.exe" -ErrorAction SilentlyContinue
if ($installers) {
    Write-Host "[✓] Installer created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Build output directory: dist/" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Installer file(s):" -ForegroundColor Cyan
    foreach ($installer in $installers) {
        $size = "{0:N2} MB" -f ($installer.Length / 1MB)
        Write-Host "  • $($installer.Name) ($size)"
    }
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Green
    Write-Host "  1. Test the installer: Run the .exe file from dist folder" -ForegroundColor White
    Write-Host "  2. Verify app runs and captures screenshots" -ForegroundColor White
    Write-Host "  3. Commit changes: git add . && git commit -m 'v1.0.0 build'" -ForegroundColor White
    Write-Host "  4. Push to GitHub: git push origin main" -ForegroundColor White
    Write-Host "  5. Create release on GitHub: https://github.com/YOUR_USERNAME/desktop-monitor/releases" -ForegroundColor White
    Write-Host ""
    Write-Host "Build completed successfully!" -ForegroundColor Green
} else {
    Write-Host "[✗] ERROR: No installer found in dist folder" -ForegroundColor Red
    exit 1
}
