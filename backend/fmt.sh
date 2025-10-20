#!/usr/bin/env bash
# Format Go code with gofmt

set -e

cd "$(dirname "$0")"
gofmt -w -s .
echo "Go code formatted"
