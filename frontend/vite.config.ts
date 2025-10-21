import fs from 'fs';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  publicDir: false, // We'll handle data/static manually for production
  base: '/', // Serve from root of domain
  build: {
    outDir: '../build',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
      },
    },
  },
  server: {
    port: 5173,
    open: true,
    fs: {
      // Allow serving files from parent directory (for /data)
      allow: ['..', '../..'],
    },
  },
  plugins: [
    {
      name: 'serve-dev-assets',
      configureServer(server) {
        // Serve /data/ during development
        server.middlewares.use('/data', (req, res, next) => {
          if (!req.url) {
            next();
            return;
          }

          const dataPath = resolve(__dirname, '../data');
          const filePath = resolve(dataPath, req.url.substring(1));

          // Security check: ensure path is within data/
          if (!filePath.startsWith(dataPath)) {
            res.statusCode = 403;
            res.end('Forbidden');
            return;
          }

          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            res.setHeader('Content-Type', 'application/json');
            fs.createReadStream(filePath).pipe(res);
          } else {
            next();
          }
        });

        // Serve /uploads/ during development
        server.middlewares.use('/uploads', (req, res, next) => {
          if (!req.url) {
            next();
            return;
          }

          const staticPath = resolve(__dirname, '../static/uploads');
          const filePath = resolve(staticPath, req.url.substring(1));

          // Security check: ensure path is within static/uploads
          if (!filePath.startsWith(staticPath)) {
            res.statusCode = 403;
            res.end('Forbidden');
            return;
          }

          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            res.setHeader('Content-Type', 'image/jpeg');
            fs.createReadStream(filePath).pipe(res);
          } else {
            next();
          }
        });
      },
    },
  ],
});
