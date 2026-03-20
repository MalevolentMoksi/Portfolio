import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');
const seoScriptPath = resolve(projectRoot, 'scripts/generate-seo-files.mjs');

test('SEO generator includes legal route and only writes sitemap to requested output dir', async () => {
  const outDir = await mkdtemp(join(tmpdir(), 'portfolio-seo-test-'));

  try {
    await execFileAsync(process.execPath, [seoScriptPath, `--outDir=${outDir}`], {
      cwd: projectRoot,
      env: {
        ...process.env,
        SITE_URL: 'https://example.test',
      },
    });

    const sitemapPath = resolve(outDir, 'sitemap.xml');
    const robotsPath = resolve(outDir, 'robots.txt');

    const sitemap = await readFile(sitemapPath, 'utf8');

    assert.match(sitemap, /https:\/\/example\.test\//);
    assert.match(sitemap, /https:\/\/example\.test\/informations-legales/);
    await assert.rejects(readFile(robotsPath, 'utf8'), /ENOENT/);
  } finally {
    await rm(outDir, { recursive: true, force: true });
  }
});
