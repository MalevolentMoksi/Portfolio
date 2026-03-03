import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'src',
  base: '/',
  publicDir: '../public',
  
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    // Cible des navigateurs récents (3 dernières versions)
    target: ['es2020', 'chrome90', 'firefox88', 'safari14', 'edge90'],
    rollupOptions: {
      input: resolve(__dirname, 'src/index.html'),
      output: {
        // Séparer Framer Motion en chunk dédié — chargé à la demande
        manualChunks: {
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
