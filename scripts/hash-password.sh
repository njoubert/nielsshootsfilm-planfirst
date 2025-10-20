#!/usr/bin/env bash
# Wrapper for scripts/hash_password.go

set -e

cd "$(dirname "$0")"

if [ ! -f "scripts/hash_password.go" ]; then
    echo "Error: scripts/hash_password.go not found"
    exit 1
fi

echo "Password Hasher Utility"
echo "======================="
echo ""

# Run the Go program
go run scripts/hash_password.go "$@"
