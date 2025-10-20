#!/usr/bin/env bash
# Tidy go.mod dependencies

set -e

cd "$(dirname "$0")"
go mod tidy
echo "go.mod tidied"
