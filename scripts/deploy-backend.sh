#!/usr/bin/env bash
# Deploy backend source code to server for building
# This copies the backend directory to the server

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
DEPLOY_PATH="nielsshootsfilm-backend-build"

echo "📦 Deploying backend source to $DEPLOY_USER@$DEPLOY_HOST:~/$DEPLOY_PATH"
echo ""

# Create deployment directory on server
ssh "$DEPLOY_USER@$DEPLOY_HOST" 'mkdir -p '"$DEPLOY_PATH"

# Copy backend source files
echo "📤 Copying backend source files..."
rsync -avz --delete \
  --exclude='*.test' \
  --exclude='coverage.*' \
  "$PROJECT_ROOT/backend/" \
  "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/"

# Copy the build script
echo "📤 Copying build script..."
rsync -avz \
  "$SCRIPT_DIR/server-build-backend.sh" \
  "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/"

echo ""
echo "✅ Backend source deployed!"
echo ""
echo "Next steps:"
echo "  1. SSH into the server:"
echo "     ssh $DEPLOY_USER@$DEPLOY_HOST"
echo ""
echo "  2. Build and install the backend:"
echo "     cd ~/$DEPLOY_PATH"
echo "     ./server-build-backend.sh"
echo ""
