#!/usr/bin/env bash
# Lint Go code with golangci-lint

set -e

cd "$(dirname "$0")/.."

if ! command -v golangci-lint &> /dev/null; then
    echo "golangci-lint not found. Install with: brew install golangci-lint"
    exit 1
fi

exec golangci-lint run ./...
