import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  base: './',
  publicDir: '../public',
  
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        projets: resolve(__dirname, 'src/projets.html'),
        'projets-personnels': resolve(__dirname, 'src/projets-personnels.html'),
        'projet-MEGASAE': resolve(__dirname, 'src/projet-MEGASAE.html'),
        'projet-SAE12': resolve(__dirname, 'src/projet-SAE12.html'),
        'projet-SAE3': resolve(__dirname, 'src/projet-SAE3.html'),
        'projet-SAE4': resolve(__dirname, 'src/projet-SAE4.html'),
        'projet-SAE56': resolve(__dirname, 'src/projet-SAE56.html'),
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
    },
  },
  
  server: {
    port: 3000,
    open: true,
    host: true,
  },
  
  preview: {
    port: 8080,
  },
});
