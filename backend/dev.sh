#!/usr/bin/env bash
# Run the admin server using the start-backend.sh script

set -e

cd "$(dirname "$0")/.."
exec ./scripts/start-backend.sh
