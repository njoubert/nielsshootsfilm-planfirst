#!/usr/bin/env bash
# Format all code (frontend with Prettier, backend with gofmt)

set -e

echo "Formatting frontend code..."
./frontend/scripts/format.sh

echo ""
echo "Formatting backend code..."
./backend/scripts/fmt.sh

echo ""
echo "✓ All code formatted"
