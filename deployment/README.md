# Deployment Guide

This guide covers deploying the nielsshootsfilm photography portfolio to production.

## Quick Start

**From your local machine:**

1. **Deploy Frontend:**

   ```bash
   ./scripts/deploy-frontend.sh
   ssh njoubert.com
   cd ~/nielsshootsfilm-frontend-build
   ./server-build-frontend.sh
   ```

2. **Deploy Backend:**

   ```bash
   ./scripts/deploy-backend.sh
   ssh njoubert.com
   cd ~/nielsshootsfilm-backend-build
   ./server-build-backend.sh
   ```

## Architecture

- **Frontend**: Single-page Lit application built with Vite, served as static files
- **Backend**: Go admin server running as systemd service on `localhost:8080`
- **Web Server**: Apache with reverse proxy forwarding `/api/*` to backend
- **Data**: JSON files in `/var/www/nielsshootsfilm.com/data/`
- **Uploads**: Photos in `/var/www/nielsshootsfilm.com/uploads/`

## Server Structure

```text
/var/www/nielsshootsfilm.com/
├── index.html                 # Frontend SPA entry point
├── assets/                    # JS/CSS bundles
├── data/                      # JSON data files (albums, config)
│   └── .backups/              # Automatic backups
└── uploads/                   # Photo storage
    ├── originals/
    ├── display/
    └── thumbnails/

/var/www/admin-backend/
├── admin                      # Backend binary
└── .env                       # Environment variables
```

## First-Time Server Setup

1. **Provision the server:**

   ```bash
   # Run once on a fresh Ubuntu 20.04 server
   cd deployment
   ./server-provision.sh
   ```

   This installs: Go, Apache, libvips, and configures the environment.

2. **Configure Apache:**

   - Copy `apache-site-nielsshootsfilm.com.conf` to `/etc/apache2/sites-available/`
   - Enable required modules: `sudo a2enmod proxy proxy_http ssl`
   - Enable the site and reload Apache

3. **Set up systemd service:**

   - Copy `photo-admin.service` to `/etc/systemd/system/`
   - Create `/var/www/admin-backend/.env` with credentials
   - Enable and start: `sudo systemctl enable --now photo-admin`

4. **Configure data directories:**

   ```bash
   sudo mkdir -p /var/www/nielsshootsfilm.com/data/.backups
   sudo mkdir -p /var/www/nielsshootsfilm.com/uploads/{originals,display,thumbnails}
   sudo chown -R www-data:www-data /var/www/nielsshootsfilm.com/data
   sudo chown -R www-data:www-data /var/www/nielsshootsfilm.com/uploads
   sudo chmod -R 775 /var/www/nielsshootsfilm.com/data
   ```

## Environment Variables

Create `/var/www/admin-backend/.env`:

```bash
DATA_DIR=/var/www/nielsshootsfilm.com/data
UPLOAD_DIR=/var/www/nielsshootsfilm.com/uploads
PORT=8080
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=<use ./scripts/hash-password.sh to generate>
```

## Deployment Scripts

**Local scripts** (run from your machine):

- `./scripts/deploy-frontend.sh` - Copy frontend source to server
- `./scripts/deploy-backend.sh` - Copy backend source to server

**Server scripts** (run on the server):

- `./server-build-frontend.sh` - Build and install frontend
- `./server-build-backend.sh` - Build and install backend

## Monitoring

**Check service status:**

```bash
sudo systemctl status photo-admin
```

**View logs:**

```bash
sudo journalctl -u photo-admin -f
```

**Test backend directly:**

```bash
curl http://localhost:8080/healthz
```

**Test through Apache:**

```bash
curl https://nielsshootsfilm.com/api/config
```

## Troubleshooting

**Backend won't start:**

- Check logs: `sudo journalctl -u photo-admin -n 50`
- Verify environment variables in `.env`
- Ensure data directories exist and have correct permissions

**Permission errors:**

```bash
sudo chown -R www-data:www-data /var/www/nielsshootsfilm.com/data
sudo chown -R www-data:www-data /var/www/nielsshootsfilm.com/uploads
sudo chmod -R 775 /var/www/nielsshootsfilm.com/data
```

**Frontend not loading:**

- Check Apache error logs: `sudo tail -f /var/log/apache2/error.log`
- Verify files exist in `/var/www/nielsshootsfilm.com/`
- Check Apache configuration: `sudo apache2ctl configtest`

**API calls failing:**

- Ensure Apache proxy modules are enabled
- Verify backend is running on localhost:8080
- Check Apache access logs: `sudo tail -f /var/log/apache2/access.log`

## Configuration Files

- `apache-site-nielsshootsfilm.com.conf` - Apache reverse proxy configuration
- `photo-admin.service` - systemd service definition
- `server-provision.sh` - Server provisioning script for Ubuntu 20.04

## Notes

- The backend must be built on the server (not cross-compiled) due to libvips dependencies
- Frontend uses environment variables: `.env` for dev, `.env.production` for production builds
- Data files are automatically backed up to `.backups/` directory on each change
