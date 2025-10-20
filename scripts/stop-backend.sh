#!/bin/bash
# Stop the backend admin server

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
PID_FILE="$BACKEND_DIR/.server.pid"

if [ ! -f "$PID_FILE" ]; then
    echo "Backend server is not running (no PID file found)"
    exit 0
fi

PID=$(cat "$PID_FILE")

if ps -p "$PID" > /dev/null 2>&1; then
    echo "Stopping backend server (PID: $PID)..."
    kill "$PID"

    # Wait for process to stop (max 5 seconds)
    for _ in {1..10}; do
        if ! ps -p "$PID" > /dev/null 2>&1; then
            break
        fi
        sleep 0.5
    done

    # Force kill if still running
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "Force killing server..."
        kill -9 "$PID"
    fi

    echo "Backend server stopped"
else
    echo "Backend server process not found (PID: $PID was not running)"
fi

rm -f "$PID_FILE"
