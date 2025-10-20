import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    open: true,
    fs: {
      // Allow serving files from parent directory (for /data)
      allow: ['..', '../..'],
    },
  },
  resolve: {
    alias: {
      // Alias /data to the parent data directory
      '/data': resolve(__dirname, '../data'),
    },
  },
  publicDir: resolve(__dirname, '../data'),
});
