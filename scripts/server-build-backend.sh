#!/usr/bin/env bash
# Build and install backend on the server
# This script should be run ON THE SERVER after deploying source

set -e

echo "🏗️  Building backend on server..."
echo ""

# Get the directory where this script is located (should be the backend source)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Verify we're in a backend directory
if [ ! -f "go.mod" ]; then
    echo "❌ Error: go.mod not found. Are you in the backend directory?"
    exit 1
fi

# Build the binary
echo "📦 Building admin binary..."
go build -o admin ./cmd/admin

echo ""
echo "✅ Build complete!"
echo ""
echo "Binary location: $SCRIPT_DIR/admin"
echo ""

# Ask if user wants to install
read -p "Install to /var/www/admin-backend/? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📥 Installing backend..."

    # Create directory if it doesn't exist
    sudo mkdir -p /var/www/admin-backend

    # Stop the service if running
    if sudo systemctl is-active --quiet photo-admin; then
        echo "⏸️  Stopping photo-admin service..."
        sudo systemctl stop photo-admin
    fi

    # Copy the binary
    sudo cp admin /var/www/admin-backend/admin
    sudo chown www-data:www-data /var/www/admin-backend/admin
    sudo chmod 755 /var/www/admin-backend/admin

    # Restart the service
    echo "▶️  Starting photo-admin service..."
    sudo systemctl start photo-admin

    echo ""
    echo "✅ Backend installed and service restarted!"
    echo ""
    echo "Check status:"
    echo "  sudo systemctl status photo-admin"
    echo ""
    echo "View logs:"
    echo "  sudo journalctl -u photo-admin -f"
else
    echo ""
    echo "To manually install the binary:"
    echo "  sudo cp admin /var/www/admin-backend/admin"
    echo "  sudo chown www-data:www-data /var/www/admin-backend/admin"
    echo "  sudo systemctl restart photo-admin"
fi

echo ""
