import { test, expect } from 'vitest';
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

test('SEO generator writes sitemap (incl. all routes) and robots.txt to the requested dir', async () => {
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

    expect(sitemap).toMatch(/https:\/\/example\.test\//);
    expect(sitemap).toMatch(/https:\/\/example\.test\/informations-legales/);
    // Route added later must be present so deep pages aren't orphaned from sitemaps.
    expect(sitemap).toMatch(/https:\/\/example\.test\/projet-SAE401/);

    // robots.txt is now generated and must advertise the sitemap.
    const robots = await readFile(robotsPath, 'utf8');
    expect(robots).toMatch(/User-agent: \*/);
    expect(robots).toMatch(/Allow: \//);
    expect(robots).toMatch(/Sitemap: https:\/\/example\.test\/sitemap\.xml/);
  } finally {
    await rm(outDir, { recursive: true, force: true });
  }
});
