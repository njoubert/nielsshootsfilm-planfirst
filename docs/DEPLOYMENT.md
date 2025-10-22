# Deployment Guide

## Overview

This project consists of two parts:

- **Frontend**: Static website (HTML/CSS/JS)
- **Backend**: Go server for admin operations

## Admin Password Configuration

### Local Development

For local testing with a simple password:

1. Copy `.env.example` to `.env` (if not already done)
2. Set `ADMIN_PASSWORD=admin` in `.env`
3. The backend will automatically hash this password when it starts
4. `.env` is in `.gitignore` and won't be deployed

### Production Deployment

For production with a secure password:

1. Generate a secure password hash:

   ```bash
   cd backend
   go run cmd/hash-password/main.go YOUR_SECURE_PASSWORD
   ```

2. **Option A**: Set in environment variable (recommended for Docker/cloud):

   ```bash
   export ADMIN_PASSWORD_HASH='$2a$10$...'
   ```

3. **Option B**: Set in `data/admin_config.json`:

   ```json
   {
     "username": "admin",
     "password_hash": "$2a$10$..."
   }
   ```

4. **Important**: Do NOT set `ADMIN_PASSWORD` in production - only use `ADMIN_PASSWORD_HASH`

**Priority order**: `ADMIN_PASSWORD` (dev) > `ADMIN_PASSWORD_HASH` (env) > `admin_config.json`

---

## Frontend Deployment

The frontend is built as a static website that can be hosted on any static web server (nginx, Apache, Netlify, Vercel, S3+CloudFront, etc.). The build process compiles TypeScript to JavaScript, bundles assets, and copies necessary data files.

## Building for Production

### Quick Build

From the project root:

```bash
cd frontend
./scripts/build.sh
```

This will:

1. Compile TypeScript and bundle JavaScript/CSS
2. Create a `frontend/build/` directory
3. Copy `data/` directory (JSON configuration files)
4. Copy `uploads/` directory (uploaded images from `static/uploads/`)

### Build Output Structure

```text
frontend/build/
├── index.html          # Main HTML file
├── assets/             # Compiled JS and CSS
│   ├── main-[hash].js
│   └── main-[hash].css
├── data/               # JSON data files
│   ├── site_config.json
│   ├── albums.json
│   └── blog_posts.json
└── uploads/            # User-uploaded images
    ├── originals/      # Original uploaded files
    ├── display/        # Resized for display (~1200px wide)
    └── thumbnails/     # Small thumbnails (~400px wide)
```

## Deployment

### Requirements

- Static web server capable of serving files from root
- All files in `build/` directory must be served from domain root
- Example: `nielsshootsfilm.com/index.html`, not `nielsshootsfilm.com/frontend/index.html`
- **SPA Fallback Required**: Server must serve `index.html` for all non-file routes

### Path Structure

The application expects these paths from domain root:

- `/` - index.html
- `/assets/*` - JavaScript and CSS bundles
- `/data/*.json` - Configuration and album data
- `/uploads/**/*` - Image files

### Deployment Steps

1. **Build the frontend:**

   ```bash
   cd frontend
   ./scripts/build.sh
   ```

2. **Copy to web server:**
   Copy the entire contents of `frontend/build/` to your web server's root directory.

   Example with rsync:

   ```bash
   rsync -avz --delete frontend/build/ user@server:/var/www/html/
   ```

   Example with AWS S3:

   ```bash
   aws s3 sync frontend/build/ s3://your-bucket-name/ --delete
   ```

3. **Verify paths:**
   - Open `https://yourdomain.com/` - should load the site
   - Check browser console for any 404 errors
   - Verify images load correctly

### Server Configuration

#### Nginx

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/html;
    index index.html;

    # Serve static assets with caching
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Serve images with caching
    location /uploads/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Serve data files without caching (they may be updated by admin)
    location /data/ {
        expires -1;
        add_header Cache-Control "no-cache";
    }

    # SPA fallback - serve index.html for all other routes
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### Apache

**Option 1: Use the provided configuration template**

A complete Apache VirtualHost configuration template is available in `deployment/apache-site.conf`. To use it:

```bash
# Generate site-specific configuration
./scripts/generate-apache-config.sh

# The script will create deployment/apache-site-{yourdomain}.conf
# Follow the instructions printed by the script to deploy
```

See `deployment/README.md` for complete Apache setup instructions including SSL/HTTPS configuration.

**Option 2: Use .htaccess**

If you prefer `.htaccess`:

```apache
# Enable rewrite engine
RewriteEngine On

# Explicitly exclude static file directories from SPA fallback
# These should serve actual files, not index.html
RewriteRule ^assets/ - [L]
RewriteRule ^uploads/ - [L]
RewriteRule ^data/ - [L]

# Don't rewrite if the file or directory exists
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d

# Serve index.html for all other routes (SPA fallback)
# This handles routes like /albums, /album/some-slug, etc.
RewriteRule ^ /index.html [L]

# Cache control
<FilesMatch "\.(js|css|jpg|jpeg|png|gif|svg|woff|woff2)$">
    Header set Cache-Control "max-age=31536000, public, immutable"
</FilesMatch>

<FilesMatch "\.(json)$">
    Header set Cache-Control "no-cache"
</FilesMatch>
```

#### Netlify

Create a `netlify.toml` in project root:

```toml
[build]
  command = "cd frontend && npm run build"
  publish = "frontend/build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/uploads/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/data/*"
  [headers.values]
    Cache-Control = "no-cache"
```

#### Vercel

Create a `vercel.json` in project root:

```json
{
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/build",
  "routes": [
    {
      "src": "/assets/(.*)",
      "headers": { "Cache-Control": "public, max-age=31536000, immutable" }
    },
    {
      "src": "/uploads/(.*)",
      "headers": { "Cache-Control": "public, max-age=31536000, immutable" }
    },
    {
      "src": "/data/(.*)",
      "headers": { "Cache-Control": "no-cache" }
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

## Testing the Build Locally

Test the production build locally before deploying:

```bash
cd frontend/build
python3 -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

**Important**: Simple Python HTTP server does NOT support SPA fallback. While client-side navigation works fine, you'll see 404 errors when:

- Directly visiting routes like `http://localhost:8080/albums`
- Refreshing the page on any route other than the homepage

This happens because the server tries to find a physical file at `/albums` instead of serving `index.html`. Your SPA routing works correctly - it just needs the server to return `index.html` for all routes so the JavaScript can initialize and handle the routing.

To test with proper SPA fallback locally:

- Use `vite preview` from the frontend directory (after building)
- Install a simple SPA server: `npx serve -s build`
- Use nginx or Apache locally with SPA fallback configured

## Important Notes

### Admin Backend NOT Included

This deployment guide covers **ONLY the public-facing frontend**. The admin interface and Go backend are not included in this build and should be deployed separately if needed.

### Data Updates

- The `data/` directory contains JSON files that define site configuration and albums
- These files are static in the build
- To update content, you'll need to either:
  1. Deploy the admin backend to modify these files remotely, or
  2. Rebuild and redeploy the frontend with updated JSON files

### Image Management

- Images in `static/uploads/` are copied as-is from your development environment
- Ensure you have all required images before building
- Large image directories will increase build time and deployment size

### Production Checklist

- [ ] Run `./scripts/build.sh` to create production build
- [ ] Verify `frontend/build/` directory contains all expected files
- [ ] Test locally with a simple HTTP server
- [ ] Deploy to web server root (not a subdirectory)
- [ ] Verify site loads correctly at your domain
- [ ] Check browser console for any 404 errors
- [ ] Verify images load correctly
- [ ] Test navigation between pages
- [ ] Test on mobile devices

## Continuous Deployment

For automated deployments, add this to your CI/CD pipeline:

```bash
#!/bin/bash
set -e

# Install dependencies
cd frontend
npm ci

# Run tests (optional)
npm run test:ci

# Build
./scripts/build.sh

# Deploy (adjust for your hosting provider)
# Example: rsync, aws s3 sync, git push, etc.
```

## Troubleshooting

### Images Not Loading

- Verify `uploads/` directory was copied to build
- Check image paths in `albums.json` start with `/uploads/`
- Check web server has read permissions for `uploads/` directory

### Data Not Loading

- Verify `data/` directory was copied to build
- Check browser console for 404 errors on `/data/*.json`
- Verify JSON files are valid

### JavaScript Not Loading

- Verify `assets/` directory exists in build
- Check that `index.html` references correct asset paths
- Check web server serves JS with correct MIME type

### 404 on Page Refresh

- Configure your web server to serve `index.html` for all routes (SPA fallback)
- See server configuration examples above
