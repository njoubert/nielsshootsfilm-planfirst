#!/usr/bin/env bash
# Run both frontend and backend dev servers
# Note: Runs sequentially. For parallel execution, use separate terminals:
#   Terminal 1: ./frontend/scripts/dev.sh
#   Terminal 2: ./backend/scripts/dev.sh

set -e

echo "=================================================="
echo "Starting Development Servers"
echo "=================================================="
echo ""
echo "This script runs servers sequentially."
echo "For parallel execution (recommended), use:"
echo "  Terminal 1: ./frontend/scripts/dev.sh"
echo "  Terminal 2: ./backend/scripts/dev.sh"
echo ""
echo "=================================================="
echo ""

# Trap Ctrl+C and cleanup
trap 'echo "Shutting down..."; exit 0' INT TERM

echo "Starting backend server..."
echo "Backend will be available at: http://localhost:8080"
echo "Admin interface will be at: http://localhost:8080/admin"
echo ""

exec ./backend/scripts/dev.sh
