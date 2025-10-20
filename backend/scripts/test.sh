#!/usr/bin/env bash
# Run all Go unit tests

set -e

cd "$(dirname "$0")/.."
exec go test ./...
