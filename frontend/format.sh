#!/usr/bin/env bash
# Format code with Prettier

set -e

cd "$(dirname "$0")"
npm run format
