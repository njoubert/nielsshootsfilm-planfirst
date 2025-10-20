#!/bin/bash
# Stop the backend admin server with robust cleanup

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PID_FILE="$BACKEND_DIR/.server.pid"
PORT=8080

echo "Stopping backend server..."

# Step 1: Try to stop using PID file
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")

    if ps -p "$PID" > /dev/null 2>&1; then
        echo "  Found go run process with PID: $PID"

        # Find child processes (the actual Go binary)
        CHILD_PIDS=$(pgrep -P "$PID" 2>/dev/null || true)
        if [ -n "$CHILD_PIDS" ]; then
            echo "  Found child process(es): $CHILD_PIDS"
        fi

        # Kill the parent process (go run)
        kill "$PID" 2>/dev/null || true

        # Wait for process to stop (max 5 seconds)
        echo "  Waiting for process to stop..."
        for _ in {1..10}; do
            if ! ps -p "$PID" > /dev/null 2>&1; then
                echo "  Parent process stopped gracefully"
                break
            fi
            sleep 0.5
        done

        # Force kill parent if still running
        if ps -p "$PID" > /dev/null 2>&1; then
            echo "  Force killing parent process (PID: $PID)..."
            kill -9 "$PID" 2>/dev/null || true
            sleep 0.5
        fi

        # Also kill any child processes that might be orphaned
        if [ -n "$CHILD_PIDS" ]; then
            for CHILD_PID in $CHILD_PIDS; do
                if ps -p "$CHILD_PID" > /dev/null 2>&1; then
                    echo "  Killing orphaned child process (PID: $CHILD_PID)..."
                    kill -9 "$CHILD_PID" 2>/dev/null || true
                fi
            done
        fi
    else
        echo "  PID $PID is not running"
    fi

    rm -f "$PID_FILE"
else
    echo "  No PID file found"
fi

# Step 2: Check if port is still in use and clean up
echo "  Checking port $PORT..."
PORT_PID=$(lsof -ti:$PORT 2>/dev/null || true)

if [ -n "$PORT_PID" ]; then
    echo "  Port $PORT is still in use by PID(s): $PORT_PID"
    echo "  Killing processes using port $PORT..."
    lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
    sleep 1

    # Verify port is now free
    PORT_PID=$(lsof -ti:$PORT 2>/dev/null || true)
    if [ -n "$PORT_PID" ]; then
        echo "  Warning: Port $PORT is still in use by PID(s): $PORT_PID"
        echo "  You may need to manually kill these processes"
        exit 1
    else
        echo "  Port $PORT is now free"
    fi
else
    echo "  Port $PORT is free"
fi

echo "Backend server stopped successfully"
