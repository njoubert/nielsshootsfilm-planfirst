#!/usr/bin/env bash
# Lint Go code with golangci-lint

set -e

cd "$(dirname "$0")"

# Check if golangci-lint is installed
if ! command -v golangci-lint &> /dev/null; then
    echo "golangci-lint not found. Install with: brew install golangci-lint"
    echo "Skipping lint checks..."
    exit 0
fi

golangci-lint run ./...
