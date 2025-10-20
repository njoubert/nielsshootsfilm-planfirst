#!/usr/bin/env bash
# Run all frontend unit tests (Vitest) in CI mode

set -e

cd "$(dirname "$0")/.."
exec npm run test:ci
