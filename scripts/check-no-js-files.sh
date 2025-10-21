#!/usr/bin/env bash
# Check for JavaScript files in frontend/src directory
# TypeScript files only - no compiled .js files should be committed

set -e

if find frontend/src -name "*.js" -type f | grep -q .; then
    echo ""
    echo "ERROR: JavaScript files found in frontend/src/"
    echo "Only TypeScript files (.ts) are allowed in the frontend source directory."
    echo ""
    echo "Found the following .js files:"
    find frontend/src -name "*.js" -type f
    echo ""
    echo "These are likely TypeScript compilation artifacts that break HMR."
    echo "To fix this, run:"
    echo "  find frontend/src -name \"*.js\" -type f -delete"
    echo ""
    exit 1
fi

exit 0
