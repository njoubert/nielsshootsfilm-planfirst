#!/usr/bin/env bash
# Run the admin server with auto-reload on file changes

set -e

cd "$(dirname "$0")/../.."
exec ./scripts/start-backend.sh
