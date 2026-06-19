/**
 * Build-time favicon raster generator (sharp).
 *
 * Why: the primary favicon is an SVG (see src/index.html + useDynamicFavicon),
 * but WebKit (Safari macOS/iOS) does not render SVG favicons at all. Without a
 * raster fallback those browsers show no icon. This pass renders the canonical
 * brand icon (the `default` mood) into the PNG shapes the rest of the platform
 * expects, so every browser gets an icon while modern ones keep the live SVG.
 *
 * Outputs (into public/, served from the site root):
 *   - favicon-96.png      96x96, transparent — fallback for `rel="icon"`.
 *   - apple-touch-icon.png 180x180, flattened onto the brand background
 *                          (iOS ignores transparency and masks to a rounded square).
 *
 * Run with `npm run favicons:generate`. Safe to run repeatedly (idempotent output).
 * Re-run whenever favicon-default.svg changes.
 */
import { stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const publicDir = join(projectRoot, 'public');

// Canonical brand icon = the `default` mood (what a first-time visitor sees).
const SOURCE = join(publicDir, 'assets/images/favicon-default.svg');
// Brand background for the iOS touch icon (matches theme_color / index.html).
const TOUCH_BG = '#050400';
// Render the 64-unit SVG large, then downscale, so edges stay crisp.
const RENDER_DENSITY = 384;

const targets = [
  { out: 'favicon-96.png', size: 96, background: null },
  { out: 'apple-touch-icon.png', size: 180, background: TOUCH_BG },
];

const kb = (bytes) => `${(bytes / 1024).toFixed(1)}KB`;

const run = async () => {
  for (const { out, size, background } of targets) {
    const outPath = join(publicDir, out);
    let pipeline = sharp(SOURCE, { density: RENDER_DENSITY }).resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });
    if (background) {
      pipeline = pipeline.flatten({ background });
    }
    const info = await pipeline.png().toFile(outPath);
    const { size: bytes } = await stat(outPath);
    console.log(`  ${out} ${info.width}x${info.height} (${kb(bytes)})`);
  }
  console.log('\nFavicon rasters generated from assets/images/favicon-default.svg');
};

run().catch((error) => {
  console.error('Failed to generate favicons:', error);
  process.exitCode = 1;
});
