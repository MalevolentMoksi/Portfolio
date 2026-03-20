import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

const DEFAULT_SITE_URL = 'https://moksi.studio';

const ROUTES = [
  '/',
  '/projets',
  '/projets-personnels',
  '/projet-MEGASAE',
  '/projet-SAE12',
  '/projet-SAE3',
  '/projet-SAE4',
  '/projet-SAE56',
  '/projet-SAE3.01',
  '/about',
  '/credits',
  '/informations-legales',
];

const ROUTE_META = {
  '/': { changefreq: 'weekly', priority: '1.0' },
  '/projets': { changefreq: 'weekly', priority: '0.9' },
  '/projets-personnels': { changefreq: 'weekly', priority: '0.9' },
  '/projet-MEGASAE': { changefreq: 'monthly', priority: '0.8' },
  '/projet-SAE12': { changefreq: 'monthly', priority: '0.8' },
  '/projet-SAE3': { changefreq: 'monthly', priority: '0.8' },
  '/projet-SAE4': { changefreq: 'monthly', priority: '0.8' },
  '/projet-SAE56': { changefreq: 'monthly', priority: '0.8' },
  '/projet-SAE3.01': { changefreq: 'monthly', priority: '0.8' },
  '/about': { changefreq: 'monthly', priority: '0.7' },
  '/credits': { changefreq: 'yearly', priority: '0.5' },
  '/informations-legales': { changefreq: 'yearly', priority: '0.4' },
};

const DEFAULT_OUTPUT_DIR = 'dist';

const parseOutputDirArg = () => {
  const prefixedArg = process.argv.find((arg) => arg.startsWith('--outDir='));
  if (prefixedArg) {
    const value = prefixedArg.slice('--outDir='.length).trim();
    if (value) return value;
  }

  const flagIndex = process.argv.findIndex((arg) => arg === '--outDir');
  if (flagIndex >= 0) {
    const value = process.argv[flagIndex + 1]?.trim();
    if (value) return value;
  }

  return process.env.SEO_OUTPUT_DIR?.trim() || DEFAULT_OUTPUT_DIR;
};

const xmlEscape = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const normalizeSiteUrl = (rawSiteUrl) => {
  const parsed = new URL(rawSiteUrl);
  parsed.hash = '';
  parsed.search = '';
  const pathname = parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/+$/, '');
  return `${parsed.origin}${pathname}`;
};

const resolveRouteUrl = (siteUrl, routePath) =>
  routePath === '/' ? `${siteUrl}/` : `${siteUrl}${routePath}`;

const createSitemapXml = (siteUrl, lastModified) => {
  const entries = ROUTES.map((routePath) => {
    const { changefreq, priority } = ROUTE_META[routePath] ?? {
      changefreq: 'monthly',
      priority: '0.6',
    };

    return [
      '  <url>',
      `    <loc>${xmlEscape(resolveRouteUrl(siteUrl, routePath))}</loc>`,
      `    <lastmod>${lastModified}</lastmod>`,
      `    <changefreq>${changefreq}</changefreq>`,
      `    <priority>${priority}</priority>`,
      '  </url>',
    ].join('\n');
  }).join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entries,
    '</urlset>',
    '',
  ].join('\n');
};

const createRobotsTxt = (siteUrl) =>
  [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /api/webhook',
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    '',
  ].join('\n');

const main = async () => {
  const configuredSiteUrl = process.env.SITE_URL || process.env.VITE_SITE_URL || DEFAULT_SITE_URL;
  const siteUrl = normalizeSiteUrl(configuredSiteUrl);
  const lastModified = new Date().toISOString().split('T')[0];
  const outputDir = resolve(projectRoot, parseOutputDirArg());

  await mkdir(outputDir, { recursive: true });

  await writeFile(resolve(outputDir, 'sitemap.xml'), createSitemapXml(siteUrl, lastModified), 'utf8');
  await writeFile(resolve(outputDir, 'robots.txt'), createRobotsTxt(siteUrl), 'utf8');

  console.log(`Generated sitemap.xml and robots.txt for ${siteUrl} in ${outputDir}`);
};

main().catch((error) => {
  console.error('Failed to generate SEO files:', error);
  process.exitCode = 1;
});
