#!/usr/bin/env bash
set -euo pipefail

# Frontend deployment script
# Runs tests, builds, and deploys to remote server

# Change to repository root (parent of scripts/)
cd "$(dirname "$0")/.."

#echo "🧪 Running frontend tests..."
#./test.sh frontend

echo ""
echo "🏗️  Building frontend..."
./build.sh

echo ""
echo "📦 Deploying frontend to server..."
scp build-bin/frontend/assets/index-* macminiserver:/Users/njoubert/webserver/sites/nielsshootsfilm.com/public/assets/
scp build-bin/frontend/index.html macminiserver:/Users/njoubert/webserver/sites/nielsshootsfilm.com/public

echo ""
echo "✅ Frontend deployment complete!"
