# Go Backend Deployment Guide

Quick reference for deploying the Go admin backend behind Apache reverse proxy.

## Prerequisites

- Apache 2.4+ with `mod_proxy` and `mod_proxy_http`
- Root or sudo access on the server
- Go backend built and tested locally

## Quick Deployment Steps

### 1. Build the Backend Locally

```bash
cd backend
./scripts/build.sh
# Creates backend/bin/admin
```

### 2. Generate Password Hash

```bash
cd scripts
./hash-password.sh your_secure_password
# Save the output hash for step 4
```

### 3. Create Server Directory Structure

```bash
# On the server
sudo mkdir -p /var/www/admin-backend
sudo mkdir -p /var/www/nielsshootsfilm.com/data
sudo mkdir -p /var/www/nielsshootsfilm.com/uploads/{originals,display,thumbnails}
```

### 4. Deploy Backend Binary and Config

```bash
# From your local machine
scp backend/bin/admin user@server:/tmp/admin

# On the server
sudo mv /tmp/admin /var/www/admin-backend/admin
sudo chmod +x /var/www/admin-backend/admin
```

Create `/var/www/admin-backend/.env`:

```bash
DATA_DIR=/var/www/nielsshootsfilm.com/data
STATIC_DIR=/var/www/nielsshootsfilm.com/uploads
PORT=8080
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=<paste_hash_from_step_2>
```

### 5. Deploy Data Files (First Time Only)

```bash
# From your local machine
scp -r data/*.json user@server:/tmp/

# On the server
sudo mv /tmp/*.json /var/www/nielsshootsfilm.com/data/
sudo chown -R www-data:www-data /var/www/nielsshootsfilm.com
```

### 6. Create Systemd Service

Create `/etc/systemd/system/photo-admin.service` from the photo-admin.service file in this folder.

### 7. Configure Apache Reverse Proxy

Enable required modules:

```bash
sudo a2enmod proxy proxy_http
sudo systemctl restart apache2
```

Add to your Apache VirtualHost config (or merge from `apache-site-nielsshootsfilm.com.conf`):

```apache
# Reverse proxy for Go admin backend
ProxyPreserveHost On
ProxyPass /api http://localhost:8080/api
ProxyPassReverse /api http://localhost:8080/api
ProxyTimeout 300
```

Test and reload:

```bash
sudo apache2ctl configtest
sudo systemctl reload apache2
```

### 8. Start the Backend Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable photo-admin
sudo systemctl start photo-admin
sudo systemctl status photo-admin
```

### 9. Test the Deployment

```bash
# Test health endpoint
curl http://localhost:8080/api/health

# Test through Apache proxy
curl https://nielsshootsfilm.com/api/health

# Should return: {"status":"ok"}
```

## Updating the Backend

```bash
# Build new version locally
cd backend
./scripts/build.sh

# Deploy to server
scp backend/bin/admin user@server:/tmp/admin

# On the server
sudo systemctl stop photo-admin
sudo mv /tmp/admin /var/www/admin-backend/admin
sudo chmod +x /var/www/admin-backend/admin
sudo systemctl start photo-admin
sudo systemctl status photo-admin
```

## Monitoring

### View Logs

```bash
# Real-time logs
sudo journalctl -u photo-admin -f

# Last 100 lines
sudo journalctl -u photo-admin -n 100

# Logs from today
sudo journalctl -u photo-admin --since today
```

### Check Service Status

```bash
sudo systemctl status photo-admin
```

### Check Apache Proxy

```bash
# Apache error log
sudo tail -f /var/log/apache2/error.log

# Apache access log
sudo tail -f /var/log/apache2/access.log | grep "/api"
```

## Troubleshooting

### Backend Won't Start

```bash
# Check service status
sudo systemctl status photo-admin

# Check logs
sudo journalctl -u photo-admin -n 50

# Common issues:
# - .env file missing or incorrect
# - Data directory doesn't exist
# - Permissions issue (should run as www-data)
# - Port 8080 already in use
```

### Apache Can't Proxy

```bash
# Check if backend is running
curl http://localhost:8080/api/health

# Check Apache modules
apache2ctl -M | grep proxy

# Check Apache config
sudo apache2ctl configtest

# Check firewall
sudo ufw status
```

### Permission Errors

```bash
# Fix ownership
sudo chown -R www-data:www-data /var/www/nielsshootsfilm.com
sudo chown -R www-data:www-data /var/www/admin-backend

# Fix permissions
sudo chmod -R 755 /var/www/nielsshootsfilm.com
sudo chmod +x /var/www/admin-backend/admin
sudo chmod 600 /var/www/admin-backend/.env
```

## Security Considerations

1. **Never commit `.env` files** - they contain credentials
2. **Use strong passwords** - minimum 16 characters
3. **Restrict file permissions** - `.env` should be 600, owned by www-data
4. **Enable HTTPS** - all admin API calls should be over HTTPS
5. **Keep backend internal** - only expose through Apache proxy
6. **Regular updates** - keep Go, Apache, and OS updated
7. **Monitor logs** - watch for suspicious activity

## Directory Structure on Server

```text
/var/www/
├── admin-backend/
│   ├── admin                 # Go binary
│   └── .env                  # Configuration (chmod 600)
└── nielsshootsfilm.com/
    ├── index.html           # Frontend
    ├── assets/              # JS/CSS
    ├── data/                # JSON data files
    │   ├── albums.json
    │   ├── blog_posts.json
    │   └── site_config.json
    └── uploads/             # User-uploaded images
        ├── originals/
        ├── display/
        └── thumbnails/
```

## Environment Variables

| Variable              | Example                                | Description                         |
| --------------------- | -------------------------------------- | ----------------------------------- |
| `DATA_DIR`            | `/var/www/nielsshootsfilm.com/data`    | Where JSON files are stored         |
| `STATIC_DIR`          | `/var/www/nielsshootsfilm.com/uploads` | Where uploaded images go            |
| `PORT`                | `8080`                                 | Backend server port (internal only) |
| `ADMIN_USERNAME`      | `admin`                                | Admin login username                |
| `ADMIN_PASSWORD_HASH` | `$2a$10$...`                           | Bcrypt hash of admin password       |

## Next Steps

- Set up automated backups of `/var/www/nielsshootsfilm.com/data`
- Configure logrotate for backend logs
- Set up monitoring/alerting for service health
- Consider adding rate limiting for API endpoints
