#!/usr/bin/env bash
# Build frontend for production and prepare for static hosting

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_ROOT="$(cd "$FRONTEND_DIR/.." && pwd)"
BUILD_DIR="$FRONTEND_DIR/build"

# Clean up TypeScript compilation artifacts before building
echo "Cleaning TypeScript artifacts..."
find "$FRONTEND_DIR/src" -name "*.js" -type f -delete

echo "Building frontend..."
cd "$FRONTEND_DIR"
npm run build

echo "Copying data directory..."
cp -r "$PROJECT_ROOT/data" "$BUILD_DIR/data"

echo "Copying uploads directory..."
cp -r "$PROJECT_ROOT/static/uploads" "$BUILD_DIR/uploads"

echo ""
echo "✅ Build complete!"
echo "Production files are in: $BUILD_DIR"
echo ""
echo "📦 Deployment:"
echo "  1. Copy build/ contents to your web server:"
echo "     rsync -avz --delete build/ user@server:/var/www/nielsshootsfilm.com/"
echo ""
echo "  2. Generate Apache configuration (if needed):"
echo "     cd $PROJECT_ROOT"
echo "     ./scripts/generate-apache-config.sh"
echo ""
echo "  3. See full deployment guide:"
echo "     $PROJECT_ROOT/deployment/README.md"
echo "     $PROJECT_ROOT/docs/DEPLOYMENT.md"
echo ""
echo "The site expects to be served from the domain root (e.g., nielsshootsfilm.com/)"
