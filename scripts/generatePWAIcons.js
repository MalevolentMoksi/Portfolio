#!/usr/bin/env node
/**
 * Generate PWA icons (192x192 and 512x512) with dark background and gold accent
 * Run: node scripts/generatePWAIcons.js
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is installed
let canvas, createCanvas, registerFont;
try {
  const skiaCanvas = require('canvas');
  canvas = skiaCanvas;
  createCanvas = skiaCanvas.createCanvas;
  registerFont = skiaCanvas.registerFont;
} catch (e) {
  console.error('❌ "canvas" module not found. Install it with: npm install canvas');
  console.error('   (This is optional for development; pre-generated icons are in public/)');
  process.exit(1);
}

const colors = {
  dark: '#050400',
  gold: '#d4af37',
};

function generateIcon(size) {
  console.log(`📦 Generating PWA icon (${size}x${size})...`);

  const cvs = createCanvas(size, size);
  const ctx = cvs.getContext('2d');

  // Dark background
  ctx.fillStyle = colors.dark;
  ctx.fillRect(0, 0, size, size);

  // Center:  geometric octagon with gold accent (minimal, recognizable icon)
  const margin = size * 0.15;
  const points = 8;
  const radius = (size / 2) - margin;
  const center = size / 2;

  // Draw octagon outline
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = Math.max(2, size / 64);
  ctx.beginPath();
  for (let i = 0; i < points; i++) {
    const angle = (i * 2 * Math.PI) / points - Math.PI / 2;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();

  // Draw inner circle (simple design)
  ctx.fillStyle = colors.gold;
  ctx.beginPath();
  ctx.arc(center, center, radius * 0.5, 0, 2 * Math.PI);
  ctx.fill();

  return cvs.toBuffer('image/png');
}

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

try {
  fs.writeFileSync(path.join(publicDir, 'pwa-192.png'), generateIcon(192));
  console.log('✅ pwa-192.png created');

  fs.writeFileSync(path.join(publicDir, 'pwa-512.png'), generateIcon(512));
  console.log('✅ pwa-512.png created');

  console.log('\n🎉 PWA icon generation complete!');
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
