import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NormalizedOutputOptions, OutputBundle } from 'rollup';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const buildDate = new Date().toISOString().split('T')[0];
// Unique per build: compared against the deployed version.json to detect new deploys.
const buildId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Plugin: publish the build id as version.json so open tabs can tell that a newer
 * build has been deployed (see src/utils/appUpdate.ts).
 */
const versionManifestPlugin = {
  name: 'version-manifest',
  apply: 'build' as const,
  generateBundle(this: { emitFile: (file: { type: 'asset'; fileName: string; source: string }) => void }) {
    this.emitFile({
      type: 'asset',
      fileName: 'version.json',
      source: JSON.stringify({ buildId, buildDate }),
    });
  },
};

/**
 * Plugin: Exclude music files from build output
 * Music files are served separately (on-demand from public/)
 * and not included in the dist/ folder to reduce initial bundle
 */
const excludeMusicFilesPlugin = {
  name: 'exclude-music-files',
  apply: 'build',
  generateBundle(_options: NormalizedOutputOptions, bundle: OutputBundle) {
    // Remove music files from the build output
    Object.keys(bundle).forEach((fileName) => {
      if (/\.(mp3|m4a|ogg)$/i.test(fileName)) {
        delete bundle[fileName];
      }
    });
  },
};

export default defineConfig({
  plugins: [
    react(),
    excludeMusicFilesPlugin,
    versionManifestPlugin,
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      workbox: {
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // Strip the favicon cache-busting `?v=` param when matching precache so the
        // SW still serves the freshest precached icon (online and offline) despite
        // the query used to bust the browser's dedicated favicon cache.
        ignoreURLParametersMatching: [/^utm_/, /^fbclid$/, /^v$/],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        // Keep install-time precache lean; cache heavy assets on demand at runtime.
        globPatterns: ['**/*.{html,ico,png,svg,webmanifest}'],
        globIgnores: [
          '**/assets/images/_unused/**',
          '**/assets/images/drawings/**',
          '**/assets/images/projects/**',
          '**/assets/music/**',
          '**/assets/**/*.{mp3,m4a,ogg}',
        ],
        navigateFallback: null,
        // index.html stays precached (offline shell below) but must not answer
        // navigations to `/` cache-first: that served the previous build after every
        // deploy and forced a reload once the new worker took over.
        directoryIndex: null,
        runtimeCaching: [
          {
            // Page loads always fetch fresh HTML (revalidated past GitHub Pages'
            // 10-minute HTTP cache), so a new visit runs the latest build without any
            // reload. Offline, every route falls back to the precached shell.
            // Plugin functions are serialized into sw.js: keep them self-contained.
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkOnly',
            options: {
              fetchOptions: { cache: 'no-cache' },
              plugins: [
                {
                  handlerDidError: async () => caches.match('index.html', { ignoreSearch: true }),
                },
              ],
            },
          },
          {
            urlPattern: /\/assets\/.*\.(mp3|m4a|ogg)$/i,
            handler: 'NetworkOnly',
          },
          {
            // Build output is content-hashed (`name-XXXXXXXX.js`): a URL never changes
            // content, so the cached copy is always the right one. CacheFirst lets a
            // returning visit boot without waiting on the network. NetworkFirst made
            // every file wait for the server (up to 3 s each, with several waves
            // before the first render): a blank page for 6-10 s on a slow or
            // congested connection, while a private window stayed instant.
            urlPattern: /\/assets\/[^/]+-[A-Za-z0-9_-]{8}\.js$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'portfolio-assets-js',
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: { statuses: [200] },
              plugins: [
                {
                  // After a deploy, removed chunks come back as an HTML page (GitHub
                  // Pages' 404, or a 200 SPA rewrite elsewhere). Treat that as a
                  // failure so the HTML is never cached under a .js URL.
                  // Plugin functions are serialized into sw.js: keep them self-contained.
                  fetchDidSucceed: async ({ response }) => {
                    const type = response.headers.get('content-type') || '';
                    if (response.status >= 400 || type.includes('text/html')) {
                      throw new Error(`Unexpected ${response.status} ${type}`);
                    }
                    return response;
                  },
                },
              ],
            },
          },
          {
            urlPattern: /\/assets\/[^/]+-[A-Za-z0-9_-]{8}\.css$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'portfolio-assets-css',
              expiration: {
                maxEntries: 40,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: { statuses: [200] },
              plugins: [
                {
                  fetchDidSucceed: async ({ response }) => {
                    const type = response.headers.get('content-type') || '';
                    if (response.status >= 400 || type.includes('text/html')) {
                      throw new Error(`Unexpected ${response.status} ${type}`);
                    }
                    return response;
                  },
                },
              ],
            },
          },
          {
            urlPattern: /\/assets\/.*\.woff2$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'portfolio-fonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/assets\/images\/(?:drawings|projects|_unused)\/.*\.(jpg|jpeg|png|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'portfolio-images-large',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 60,
                // Gracefully evict instead of throwing if the device hits its storage
                // quota (these multi-MB images can fill the cache on constrained devices).
                purgeOnQuotaError: true,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/assets\/images\/backgrounds\/.*\.(jpg|jpeg|png|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'portfolio-images-bg',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 90,
                purgeOnQuotaError: true,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'Portfolio — Enzo Morello',
        short_name: 'Portfolio',
        description: 'Portfolio professionnel de développeur web',
        lang: 'fr',
        theme_color: '#050400',
        background_color: '#050400',
        display: 'browser',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  root: 'src',
  base: '/',
  publicDir: '../public',
  define: {
    __BUILD_DATE__: JSON.stringify(buildDate),
    __APP_BUILD_ID__: JSON.stringify(buildId),
  },

  build: {
    outDir: '../dist',
    emptyOutDir: true,
    target: ['es2020', 'chrome90', 'firefox88', 'safari14', 'edge90'],
    modulePreload: {
      resolveDependencies(_filename, deps, context) {
        if (context.hostType !== 'js') {
          return deps;
        }

        // Avoid preloading the already-loaded app entry chunk from lazy imports.
        return deps.filter((dep) => !/^assets\/index-[A-Za-z0-9_-]+\.js$/i.test(dep));
      },
    },
    rollupOptions: {
      input: resolve(__dirname, 'src/index.html'),
      external: ['react-native-fs'],
      output: {
        // A group also captures every module its matches import, unless a higher
        // priority group took it first. The old `manualChunks` groups for
        // src/components/ambient/ and src/scripts/ swallowed the contexts, i18n and
        // utils they import, so the entry had to load them statically: all the lazy
        // ambient effects and legacy scripts landed on the first-render path. Dropping
        // those groups then let `framer` swallow React and become render-blocking.
        // Explicit priorities keep each group to what it names; everything else is
        // split by the lazy imports themselves.
        codeSplitting: {
          groups: [
            {
              name: 'vendor',
              test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|react-i18next|scheduler|@remix-run)[\\/]/,
              priority: 30,
            },
            {
              // Only the lazy pet components use it: stays off the first render.
              name: 'framer',
              test: /node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/,
              priority: 20,
            },
            {
              // Only the eagerly-bundled default locale belongs in the shared i18n
              // chunk. Other languages are dynamically imported (see src/i18n.ts) and
              // keep their own lazy chunks, so a default-language visitor never
              // downloads them.
              name: 'i18n',
              test: /[\\/]src[\\/]locales[\\/]fr\.json$/,
              priority: 10,
            },
          ],
        },
      },
    },
    assetsInlineLimit: 4096,
    cssCodeSplit: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@styles': resolve(__dirname, 'src/styles'),
      '@scripts': resolve(__dirname, 'src/scripts'),
      '@components': resolve(__dirname, 'src/components'),
      '@assets': resolve(__dirname, 'public/assets'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@contexts': resolve(__dirname, 'src/contexts'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@data': resolve(__dirname, 'src/data'),
    },
  },

  server: {
    port: 3000,
    open: true,
    host: true,
    middlewareMode: false,
  },

  preview: {
    port: 8080,
  },
  test: {
    root: __dirname,
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'tests/',
          'dist/',
          'public/',
          '**/*.d.ts',
          '**/*.test.tsx',
          '**/*.test.ts',
        ],
        thresholds: {
          lines: 50,
          functions: 45,
          branches: 30,
          statements: 50,
        },
      },
    include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['tests/e2e/**'],
  },
});
