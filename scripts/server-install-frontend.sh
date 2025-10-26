#!/usr/bin/env bash
# Install frontend from staging directory to production
# This must be run ON THE SERVER after deploy-frontend.sh
# Requires sudo to set proper ownership

set -e

STAGING_DIR="$HOME/nielsshootsfilm-frontend-deploy"
PRODUCTION_DIR="/var/www/nielsshootsfilm.com"
WEB_USER="www-data"

# Check we're in the right directory
if [ ! -d "$STAGING_DIR" ]; then
  echo "❌ Error: Staging directory not found: $STAGING_DIR"
  echo "   Run deploy-frontend.sh from your local machine first"
  exit 1
fi

# Get confirmation
echo "🚀 Frontend Installation"
echo ""
echo "This will install the frontend from staging to production:"
echo "  From: $STAGING_DIR"
echo "  To:   $PRODUCTION_DIR"
echo ""
echo "The following will be preserved:"
echo "  - $PRODUCTION_DIR/uploads/"
echo "  - $PRODUCTION_DIR/data/"
echo ""
read -p "Continue? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
  echo "Installation cancelled"
  exit 0
fi

echo "📦 Installing frontend..."

# Create temporary directory for safe operations
TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

# Copy staging to temp directory
echo "  → Copying files to temporary location..."
cp -r "$STAGING_DIR/." "$TEMP_DIR/"

# If production directory exists, preserve uploads and data
if [ -d "$PRODUCTION_DIR" ]; then
  echo "  → Preserving uploads/ and data/ directories..."

  if [ -d "$PRODUCTION_DIR/uploads" ]; then
    cp -r "$PRODUCTION_DIR/uploads" "$TEMP_DIR/"
  fi

  if [ -d "$PRODUCTION_DIR/data" ]; then
    cp -r "$PRODUCTION_DIR/data" "$TEMP_DIR/"
  fi
fi

# Ensure required directories exist
echo "  → Ensuring required directories exist..."
mkdir -p "$TEMP_DIR/uploads"
mkdir -p "$TEMP_DIR/data"

# Use sudo to install with proper permissions
echo "  → Installing to production (requires sudo)..."
sudo rm -rf "$PRODUCTION_DIR"
sudo mv "$TEMP_DIR" "$PRODUCTION_DIR"

# Set ownership and permissions
echo "  → Setting ownership to $WEB_USER..."
sudo chown -R "$WEB_USER:$WEB_USER" "$PRODUCTION_DIR"

echo "  → Setting permissions..."
sudo find "$PRODUCTION_DIR" -type f -exec chmod 644 {} \;
sudo find "$PRODUCTION_DIR" -type d -exec chmod 755 {} \;

# Ensure data directories are writable
sudo chmod 775 "$PRODUCTION_DIR/uploads"
sudo chmod 775 "$PRODUCTION_DIR/data"

echo ""
echo "✅ Frontend installed successfully!"
echo ""
echo "The frontend is now live at https://nielsshootsfilm.com"
echo ""
