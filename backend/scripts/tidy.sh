#!/usr/bin/env bash
# Tidy go.mod dependencies

set -e

cd "$(dirname "$0")/.."
exec go mod tidy
