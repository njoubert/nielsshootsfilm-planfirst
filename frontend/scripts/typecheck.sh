#!/usr/bin/env bash
# Type-check TypeScript without emitting files

set -e

cd "$(dirname "$0")/.."
exec npm run typecheck
