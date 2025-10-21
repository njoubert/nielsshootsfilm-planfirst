# Deployment Configuration

This directory contains server configuration files for deploying the photography portfolio website.

## Files

- `apache-site.conf` - Apache VirtualHost configuration template
- `apache-site-{domain}.conf` - Generated configuration (created by `scripts/generate-apache-config.sh`)

## Quick Start

### 1. Configure Environment

Copy `.env.example` to `.env` in the project root and set your domain:

```bash
cp .env.example .env
# Edit .env and set: SITE_URL=nielsshootsfilm.com
```

### 2. Generate Apache Configuration

```bash
./scripts/generate-apache-config.sh
```

This creates `apache-site-{yourdomain}.conf` based on your existing Apache setup.

### 3. Merge with Your Existing Apache Configuration

The generated configuration is designed to **merge** with your existing Apache config, not replace it.

**If you already have a working Apache configuration:**

1. Open your existing config: `/etc/apache2/sites-available/nielsshootsfilm.com.conf`
2. Review the generated config: `deployment/apache-site-nielsshootsfilm.com.conf`
3. Add the marked sections (SPA routing, cache control, security headers) to your existing config
4. The template preserves your existing:
   - SSL configuration
   - Subdomain redirects
   - VirtualDocumentRoot setup
   - Logging configuration

**If starting from scratch:**

```bash
# Copy the generated configuration
sudo cp deployment/apache-site-nielsshootsfilm.com.conf /etc/apache2/sites-available/nielsshootsfilm.com.conf

# Enable required Apache modules
sudo a2enmod rewrite headers expires deflate ssl

# Enable the site
sudo a2ensite nielsshootsfilm.com

# Test configuration
sudo apache2ctl configtest

# Reload Apache
sudo systemctl reload apache2
```

### 4. Deploy Website Files

```bash
# Build the frontend
cd ../frontend
./scripts/build.sh

# Copy to web server (adjust domain to match your SITE_URL)
sudo mkdir -p /var/www/nielsshootsfilm.com
sudo cp -r build/* /var/www/nielsshootsfilm.com/

# Set proper permissions
sudo chown -R www-data:www-data /var/www/nielsshootsfilm.com
sudo chmod -R 755 /var/www/nielsshootsfilm.com
```

## Apache Configuration Features

### SPA Routing Support

The configuration includes proper SPA fallback - all non-file requests are served `index.html` so your client-side router can handle the navigation.

### Cache Control

- **Assets** (`/assets/*`): 1 year cache with immutable flag
- **Images** (`/uploads/*`): 1 year cache with immutable flag
- **Data** (`/data/*`): No caching (may be updated by admin backend)

### Compression

Automatic compression enabled for:

- CSS and JavaScript files
- WebP images

### Security Headers

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

### SSL/HTTPS Support

The configuration includes commented-out HTTPS/SSL sections. Uncomment after obtaining an SSL certificate (e.g., via Let's Encrypt).

## SSL Certificate with Let's Encrypt

```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-apache

# Obtain certificate (interactive)
sudo certbot --apache -d nielsshootsfilm.com -d www.nielsshootsfilm.com

# Or non-interactive
sudo certbot --apache -d nielsshootsfilm.com -d www.nielsshootsfilm.com --non-interactive --agree-tos --email your@email.com

# Certbot will automatically configure HTTPS and set up auto-renewal
```

After obtaining the certificate, you can uncomment the HTTPS VirtualHost section in the Apache config and reload Apache.

## Directory Structure on Server

```text
/var/www/nielsshootsfilm.com/
├── index.html
├── assets/
│   ├── main-[hash].js
│   └── main-[hash].css
├── data/
│   ├── site_config.json
│   ├── albums.json
│   └── blog_posts.json
└── uploads/
    ├── originals/
    ├── display/
    └── thumbnails/
```

## Updating Content

### Option 1: Rebuild and Redeploy

```bash
# On your development machine
cd frontend
./scripts/build.sh

# Deploy to server (adjust domain to match your SITE_URL)
rsync -avz --delete build/ user@server:/var/www/nielsshootsfilm.com/
```

### Option 2: Deploy Admin Backend

Deploy the Go admin backend separately to allow remote content updates through the admin interface. (See backend deployment documentation - future work)

## Troubleshooting

### Permission Denied Errors

```bash
sudo chown -R www-data:www-data /var/www/nielsshootsfilm.com
sudo chmod -R 755 /var/www/nielsshootsfilm.com
```

### Apache Won't Start

```bash
# Check configuration
sudo apache2ctl configtest

# Check Apache logs
sudo tail -f /var/log/apache2/error.log
```

### SPA Routes Return 404

Ensure `mod_rewrite` is enabled:

```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

### Images Not Loading

Check permissions and verify the path in your Apache config matches your actual deployment directory.

## Alternative: .htaccess Configuration

If you prefer using `.htaccess` instead of VirtualHost configuration, create this file in `/var/www/nielsshootsfilm.com/.htaccess`:

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
<FilesMatch "\.(js|css|jpg|jpeg|png|gif|svg|woff|woff2|webp)$">
    Header set Cache-Control "max-age=31536000, public, immutable"
</FilesMatch>

<FilesMatch "\.(json)$">
    Header set Cache-Control "no-cache"
</FilesMatch>

# Security headers
Header always set X-Content-Type-Options "nosniff"
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
```

And set `AllowOverride All` in your Apache VirtualHost configuration.
