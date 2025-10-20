#!/usr/bin/env bash
# Lint TypeScript/JavaScript files with ESLint

set -e

cd "$(dirname "$0")"
npm run lint
