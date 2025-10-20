#!/usr/bin/env bash
# Run both frontend and backend dev servers
# Note: Runs sequentially. For parallel execution, use separate terminals:
#   Terminal 1: bazel run //frontend:dev
#   Terminal 2: bazel run //backend:dev

set -e

echo "=================================================="
echo "Starting Development Servers"
echo "=================================================="
echo ""
echo "This script runs servers sequentially."
echo "For parallel execution (recommended), use:"
echo "  Terminal 1: bazel run //frontend:dev"
echo "  Terminal 2: bazel run //backend:dev"
echo ""
echo "=================================================="
echo ""

# Trap Ctrl+C and cleanup
trap 'echo "Shutting down..."; exit 0' INT TERM

echo "Starting backend server..."
echo "Backend will be available at: http://localhost:8080"
echo "Admin interface will be at: http://localhost:8080/admin"
echo ""

cd backend
exec ./dev.sh
