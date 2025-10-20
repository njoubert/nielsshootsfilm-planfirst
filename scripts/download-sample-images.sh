#!/usr/bin/env bash
# Wrapper for download-sample-images.js

set -e

cd "$(dirname "$0")"

if [ ! -f "download-sample-images.js" ]; then
    echo "Error: download-sample-images.js not found"
    exit 1
fi

node download-sample-images.js "$@"
