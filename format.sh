#!/usr/bin/env bash
# Format all code (frontend with Prettier, backend with gofmt)

set -e

echo "Formatting frontend code..."
cd frontend
npm run format

echo ""
echo "Formatting backend code..."
cd ../backend
gofmt -w -s .

echo ""
echo "✓ All code formatted"
