#!/usr/bin/env node
/**
 * Generate PWA icons (192x192 and 512x512) with dark background and gold accent.
 * Run: node scripts/generatePWAIcons.ts (or compile first if needed)
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);

interface CanvasModule {
  createCanvas: (width: number, height: number) => {
    getContext: (contextId: '2d') => CanvasRenderingContext2DLike;
    toBuffer: (mimeType: 'image/png') => Buffer;
  };
}

interface CanvasRenderingContext2DLike {
  fillStyle: string;
  strokeStyle: string;
  lineWidth: number;
  beginPath: () => void;
  moveTo: (x: number, y: number) => void;
  lineTo: (x: number, y: number) => void;
  closePath: () => void;
  stroke: () => void;
  fillRect: (x: number, y: number, w: number, h: number) => void;
  arc: (x: number, y: number, r: number, sAngle: number, eAngle: number) => void;
  fill: () => void;
}

let createCanvas: CanvasModule['createCanvas'];

try {
  const canvas = require('canvas') as CanvasModule;
  createCanvas = canvas.createCanvas;
} catch {
  console.error('"canvas" module not found. Install it with: npm install canvas');
  console.error('(This is optional for development; pre-generated icons are in public/)');
  process.exit(1);
}

const colors = {
  dark: '#050400',
  gold: '#d4af37',
} as const;

function generateIcon(size: number): Buffer {
  const cvs = createCanvas(size, size);
  const ctx = cvs.getContext('2d');

  ctx.fillStyle = colors.dark;
  ctx.fillRect(0, 0, size, size);

  const margin = size * 0.15;
  const points = 8;
  const radius = size / 2 - margin;
  const center = size / 2;

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

  ctx.fillStyle = colors.gold;
  ctx.beginPath();
  ctx.arc(center, center, radius * 0.5, 0, 2 * Math.PI);
  ctx.fill();

  return cvs.toBuffer('image/png');
}

const __filename = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(__filename), '..');
const publicDir = path.join(projectRoot, 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

try {
  fs.writeFileSync(path.join(publicDir, 'pwa-192.png'), generateIcon(192));
  console.log('pwa-192.png created');

  fs.writeFileSync(path.join(publicDir, 'pwa-512.png'), generateIcon(512));
  console.log('pwa-512.png created');
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error('Error:', message);
  process.exit(1);
}
