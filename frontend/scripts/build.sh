#!/usr/bin/env bash
# Build frontend for production

set -e

cd "$(dirname "$0")/.."
exec npm run build
