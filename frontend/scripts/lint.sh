#!/usr/bin/env bash
# Lint TypeScript/JavaScript files

set -e

cd "$(dirname "$0")/.."
exec npm run lint
