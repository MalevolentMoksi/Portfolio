import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

const buildDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',           // SW silently self-updates on new deploy
      injectRegister: false,                // Disable auto-injection; we'll manually add defer
      workbox: {
        // Precache limit: only small assets (JS, CSS, small images, fonts)
        // Large audio and images are cached at runtime when accessed
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MB
        globPatterns: [
          // Include build artifacts + small static assets
          '**/*.{js,css,html,ico,svg,woff,woff2}',
          // Include small images (webp optimized)
          'assets/images/**/*.webp',
        ],
        globIgnores: [
          // Exclude unused and large image folders from precache
          '**/assets/images/_unused/**',
          '**/assets/images/drawings/**',
          '**/assets/images/projects/**',
          // Exclude music (cached at runtime)
          '**/assets/music/**',
          '**/assets/**/*.{mp3,m4a,ogg}',
        ],
        // Don't cache the SPA shell routes as navigation — only assets
        navigateFallback: null,
        runtimeCaching: [
          {
            // Google Fonts stylesheet (external, cache-first)
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxAgeSeconds: 60 * 60 * 24 * 7 }, // 1 week
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Google Fonts font files (gstatic, cache indefinitely)
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Music files — NetworkOnly: browser audio uses byte-range requests (206 Partial
            // Content) which CacheFirst can't handle after storing a 200 response. The
            // browser's native HTTP cache manages audio streaming correctly on its own.
            // Pattern is broad (/assets/*.mp3) to also cover Vite-hashed filenames.
            urlPattern: /\/assets\/.*\.(mp3|m4a|ogg)$/i,
            handler: 'NetworkOnly',
          },
          {
            // Large images (cache on first view)
            urlPattern: /\/assets\/images\/(?:drawings|projects|_unused)\/.*\.(jpg|jpeg|png|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'portfolio-images-large',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 60, // 60 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Background images (cache on first view)
            urlPattern: /\/assets\/images\/backgrounds\/.*\.(jpg|jpeg|png|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'portfolio-images-bg',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 90, // 90 days
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
        theme_color: '#050400',
        background_color: '#050400',
        display: 'browser',     // 'browser' = no install prompt, stays in browser tab
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
  },
  
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    // Cible des navigateurs récents (3 dernières versions)
    target: ['es2020', 'chrome90', 'firefox88', 'safari14', 'edge90'],
    rollupOptions: {
      input: resolve(__dirname, 'src/index.html'),
      output: {
        // Vendor split : les librairies stables sont mises en cache indépendamment
        // des déploiements de l'app.
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'framer': ['framer-motion'],
        },
      },
    },
    // Optimize assets
    assetsInlineLimit: 4096, // Inline small assets as base64
    cssCodeSplit: true, // Split CSS for better caching
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
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
    // Enable SPA fallback to index.html for routing
    historyApiFallback: true,
  },
  
  preview: {
    port: 8080,
  },
});
