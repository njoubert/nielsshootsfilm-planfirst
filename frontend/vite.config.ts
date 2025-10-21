import fs from 'fs';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  publicDir: resolve(__dirname, '../data'),
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    assetsDir: 'assets',
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
      name: 'serve-static-uploads',
      configureServer(server) {
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
