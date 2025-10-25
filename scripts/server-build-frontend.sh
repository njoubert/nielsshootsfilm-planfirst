#!/usr/bin/env bash
# Build and install frontend on the server
# This script should be run ON THE SERVER after deploying source

set -e

echo "🏗️  Building frontend on server..."
echo ""

# Get the directory where this script is located (should be the frontend source)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Verify we're in a frontend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Are you in the frontend directory?"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --no-audit

# Build the frontend
echo "🏗️  Building frontend for production..."
npm run build

echo ""
echo "✅ Build complete!"
echo ""
echo "Built files location: $SCRIPT_DIR/dist"
echo ""

# Ask if user wants to install
read -p "Install to /var/www/nielsshootsfilm.com/? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📥 Installing frontend..."

    # Copy built files (excluding uploads and data which are managed separately)
    sudo rsync -avz --delete \
      --exclude='uploads/' \
      --exclude='data/' \
      dist/ \
      /var/www/nielsshootsfilm.com/

    # Ensure proper permissions
    sudo chown -R www-data:www-data /var/www/nielsshootsfilm.com/
    sudo chmod -R 755 /var/www/nielsshootsfilm.com/

    # Restore uploads and data ownership
    sudo chown -R www-data:www-data /var/www/nielsshootsfilm.com/uploads/ 2>/dev/null || true
    sudo chown -R www-data:www-data /var/www/nielsshootsfilm.com/data/ 2>/dev/null || true
    sudo chmod -R 775 /var/www/nielsshootsfilm.com/data/ 2>/dev/null || true

    echo ""
    echo "✅ Frontend installed!"
    echo ""
    echo "Visit your site to verify the deployment."
else
    echo ""
    echo "To manually install the frontend:"
    echo "  sudo rsync -avz --delete --exclude='uploads/' --exclude='data/' dist/ /var/www/nielsshootsfilm.com/"
    echo "  sudo chown -R www-data:www-data /var/www/nielsshootsfilm.com/"
fi

echo ""
