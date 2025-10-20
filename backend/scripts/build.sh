#!/usr/bin/env bash
# Build the admin server binary

set -e

cd "$(dirname "$0")/.."
exec go build -o bin/admin ./cmd/admin
