#!/usr/bin/env bash
# Run frontend tests in watch mode

set -e

cd "$(dirname "$0")"
exec npm run test
