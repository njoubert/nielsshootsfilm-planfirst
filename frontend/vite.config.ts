import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  publicDir: resolve(__dirname, '../data'),
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
});
