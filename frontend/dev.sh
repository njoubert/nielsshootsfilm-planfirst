#!/usr/bin/env bash
# Run Vite development server with hot module replacement

set -e

cd "$(dirname "$0")"
exec npm run dev
