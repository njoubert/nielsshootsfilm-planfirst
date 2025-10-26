#!/usr/bin/env bash
# Build frontend locally and deploy to server staging directory
# This builds the frontend and copies to a temp location for installation

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BUILD_DIR="$PROJECT_ROOT/build-bin/frontend"

# Load deployment configuration from .env if available
if [ -f "$PROJECT_ROOT/.env" ]; then
  # shellcheck disable=SC2046
  export $(grep -E "^DEPLOY_(USER|HOST)=" "$PROJECT_ROOT/.env" | xargs)
fi

DEPLOY_USER="${DEPLOY_USER:-njoubert}"
DEPLOY_HOST="${DEPLOY_HOST:-njoubert.com}"
STAGING_PATH="nielsshootsfilm-frontend-deploy"

echo "🏗️  Building frontend locally..."
echo ""

# Build the frontend
cd "$PROJECT_ROOT"
./build.sh

echo ""
echo "📦 Deploying frontend to $DEPLOY_USER@$DEPLOY_HOST:~/$STAGING_PATH"
echo ""

# Create staging directory on server
ssh "$DEPLOY_USER@$DEPLOY_HOST" 'mkdir -p '"$STAGING_PATH"

# Deploy built files to staging directory
echo "📤 Copying built files to staging..."
rsync -avz --delete \
  --exclude='uploads/' \
  --exclude='data/' \
  "$BUILD_DIR/" \
  "$DEPLOY_USER@$DEPLOY_HOST:$STAGING_PATH/"

# Copy the installation script
echo "📤 Copying installation script..."
rsync -avz \
  "$SCRIPT_DIR/server-install-frontend.sh" \
  "$DEPLOY_USER@$DEPLOY_HOST:$STAGING_PATH/"

echo ""
echo "✅ Frontend deployed to staging directory!"
echo ""
echo "Next steps:"
echo "  1. SSH into the server:"
echo "     ssh $DEPLOY_USER@$DEPLOY_HOST"
echo ""
echo "  2. Install the frontend to production:"
echo "     cd ~/$STAGING_PATH"
echo "     ./server-install-frontend.sh"
echo ""
