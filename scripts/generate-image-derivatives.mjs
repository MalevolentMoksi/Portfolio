/**
 * Build-time image derivative generator (sharp).
 *
 * Why this and not vite-plugin-image-optimizer: every image in this project lives
 * in `public/` and is referenced by absolute path. Vite copies `publicDir` verbatim
 * and never runs plugins on it, so a Vite image plugin would be inert here. A direct
 * sharp pass over `public/` is the correct tool.
 *
 * Currently it generates lightweight WebP thumbnails for the drawings gallery so the
 * grid no longer downloads multi-MB originals just to paint ~400px tiles. The full
 * resolution originals stay in place and are loaded on demand by the lightbox
 * (via each tile's `data-full` attribute).
 *
 * Idempotent: a thumbnail is regenerated only when missing or older than its source.
 * Run with `npm run images:generate` (also safe to run repeatedly).
 */
import { readdir, mkdir, stat } from 'node:fs/promises';
import { dirname, extname, join, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

const DRAWINGS_DIR = join(projectRoot, 'public/assets/images/drawings');
const THUMBS_SUBDIR = 'thumbs';
const SOURCE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);
// Bounding box for the gallery tiles (displayed ~400px, so ~2x for retina).
const THUMB_MAX = 800;
const THUMB_QUALITY = 80;

const isStale = async (sourcePath, targetPath) => {
  try {
    const [src, dst] = await Promise.all([stat(sourcePath), stat(targetPath)]);
    return src.mtimeMs > dst.mtimeMs;
  } catch {
    return true; // target missing
  }
};

const kb = (bytes) => `${(bytes / 1024).toFixed(0)}KB`;

const generateThumbs = async () => {
  const thumbsDir = join(DRAWINGS_DIR, THUMBS_SUBDIR);
  await mkdir(thumbsDir, { recursive: true });

  const entries = await readdir(DRAWINGS_DIR, { withFileTypes: true });
  const sources = entries
    .filter((e) => e.isFile() && SOURCE_EXT.has(extname(e.name).toLowerCase()))
    .map((e) => e.name);

  let generated = 0;
  let skipped = 0;
  const manifest = [];

  for (const name of sources) {
    const sourcePath = join(DRAWINGS_DIR, name);
    const targetName = `${basename(name, extname(name))}.webp`;
    const targetPath = join(thumbsDir, targetName);

    if (!(await isStale(sourcePath, targetPath))) {
      const meta = await sharp(targetPath).metadata();
      manifest.push({ source: name, thumb: targetName, width: meta.width, height: meta.height });
      skipped += 1;
      continue;
    }

    const srcSize = (await stat(sourcePath)).size;
    const info = await sharp(sourcePath)
      .resize(THUMB_MAX, THUMB_MAX, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: THUMB_QUALITY })
      .toFile(targetPath);

    const dstSize = (await stat(targetPath)).size;
    manifest.push({ source: name, thumb: targetName, width: info.width, height: info.height });
    generated += 1;
    console.log(
      `  ${name} (${kb(srcSize)}) -> ${THUMBS_SUBDIR}/${targetName} ` +
        `${info.width}x${info.height} (${kb(dstSize)})`
    );
  }

  console.log(`\nThumbnails: ${generated} generated, ${skipped} up-to-date (in ${THUMBS_SUBDIR}/).`);
  // Print a compact dimension map to make wiring width/height attributes easy.
  console.log('DIMS ' + JSON.stringify(Object.fromEntries(
    manifest.map((m) => [m.thumb, [m.width, m.height]])
  )));
};

generateThumbs().catch((error) => {
  console.error('Failed to generate image derivatives:', error);
  process.exitCode = 1;
});
