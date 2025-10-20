#!/usr/bin/env bash
# Build frontend for production using Vite

set -e

cd "$(dirname "$0")"
npm run build
