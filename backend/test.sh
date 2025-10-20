#!/usr/bin/env bash
# Run all Go unit tests

set -e

cd "$(dirname "$0")"
go test ./... -v -short
