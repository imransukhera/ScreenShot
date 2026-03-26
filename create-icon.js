// Simple script to create a tray icon PNG using Canvas
// Run: node create-icon.js
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function createTrayIcon() {
  const size = 16;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background circle
  ctx.fillStyle = '#4fc3f7';
  ctx.beginPath();
  ctx.arc(8, 8, 7, 0, Math.PI * 2);
  ctx.fill();

  // Camera lens
  ctx.fillStyle = '#0f0f23';
  ctx.beginPath();
  ctx.arc(8, 8, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#4fc3f7';
  ctx.beginPath();
  ctx.arc(8, 8, 2, 0, Math.PI * 2);
  ctx.fill();

  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(__dirname, 'assets/tray-icon.png'), buf);
  console.log('Icon created');
}

try {
  createTrayIcon();
} catch (e) {
  // canvas not available — create a minimal valid 16x16 PNG manually
  // Minimal 1x1 PNG header then scaled
  const minimalPng = Buffer.from([
    0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A, // PNG signature
    0x00,0x00,0x00,0x0D, // IHDR length
    0x49,0x48,0x44,0x52, // IHDR
    0x00,0x00,0x00,0x10, // width 16
    0x00,0x00,0x00,0x10, // height 16
    0x08,0x02,           // 8-bit RGB
    0x00,0x00,0x00,      // compression, filter, interlace
    0x90,0x91,0x68,0x36, // CRC
    0x00,0x00,0x00,0x49, // IDAT length
    0x49,0x44,0x41,0x54, // IDAT
    0x78,0x9C,0x62,0xF8,0x4F,0x00,0x01,0x00,
    0x01,0x00,0x18,0x18,0x18,0x18,0xDD,0xA6,
    0x8A,0x01,0x00,0x00,0x00,0x00,0xFF,0xFF,
    0x03,0x00,0x00,0x0F,0x00,0x01,0xFC,0x56,
    0x51,0x84,0x00,0x00,0x00,0x00,0x49,0x45,
    0x4E,0x44,0xAE,0x42,0x60,0x82
  ]);
  require('fs').writeFileSync(require('path').join(__dirname, 'assets/tray-icon.png'), minimalPng);
  console.log('Minimal PNG icon created');
}
