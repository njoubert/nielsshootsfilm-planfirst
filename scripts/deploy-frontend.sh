#!/usr/bin/env bash
# Deploy frontend source code to server for building
# This copies the frontend directory to the server

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load deployment configuration from .env if available
if [ -f "$PROJECT_ROOT/.env" ]; then
  # shellcheck disable=SC2046
  export $(grep -E "^DEPLOY_(USER|HOST)=" "$PROJECT_ROOT/.env" | xargs)
fi

DEPLOY_USER="${DEPLOY_USER:-njoubert}"
DEPLOY_HOST="${DEPLOY_HOST:-njoubert.com}"
DEPLOY_PATH="nielsshootsfilm-frontend-build"

echo "📦 Deploying frontend source to $DEPLOY_USER@$DEPLOY_HOST:~/$DEPLOY_PATH"
echo ""

# Create deployment directory on server
ssh "$DEPLOY_USER@$DEPLOY_HOST" 'mkdir -p '"$DEPLOY_PATH"

# Copy frontend source files
echo "📤 Copying frontend source files..."
rsync -avz --delete \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='coverage' \
  --exclude='.vite' \
  "$PROJECT_ROOT/frontend/" \
  "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/"

# Copy the build script
echo "📤 Copying build script..."
rsync -avz \
  "$SCRIPT_DIR/server-build-frontend.sh" \
  "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/"

echo ""
echo "✅ Frontend source deployed!"
echo ""
echo "Next steps:"
echo "  1. SSH into the server:"
echo "     ssh $DEPLOY_USER@$DEPLOY_HOST"
echo ""
echo "  2. Build and install the frontend:"
echo "     cd ~/$DEPLOY_PATH"
echo "     ./server-build-frontend.sh"
echo ""
