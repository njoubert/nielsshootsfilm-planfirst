#!/bin/bash
# Start the backend admin server in the background

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_ROOT="$(cd "$BACKEND_DIR/.." && pwd)"
PID_FILE="$BACKEND_DIR/.server.pid"
LOG_FILE="$BACKEND_DIR/.server.log"

# Check if server is already running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "Backend server is already running (PID: $PID)"
        echo "Use ./backend/scripts/stop-backend.sh to stop it first"
        exit 1
    else
        echo "Removing stale PID file"
        rm -f "$PID_FILE"
    fi
fi

# Check if .env file exists and source it (optional now that we have admin_config.json)
if [ -f "$BACKEND_DIR/.env" ]; then
    echo "Loading environment variables from .env..."
    set -a
    # shellcheck source=/dev/null
    source "$BACKEND_DIR/.env"
    set +a
fi

# Set defaults if not provided
export DATA_DIR="${DATA_DIR:-$PROJECT_ROOT/data}"
export UPLOAD_DIR="${UPLOAD_DIR:-$PROJECT_ROOT/static/uploads}"
export PORT="${PORT:-8080}"

echo "Starting backend server..."
echo "  Port: $PORT"
echo "  Data directory: $DATA_DIR"
echo "  Upload directory: $UPLOAD_DIR"
echo "  Log file: $LOG_FILE"

# Start the server in the background
cd "$BACKEND_DIR"
nohup go run ./cmd/admin/main.go > "$LOG_FILE" 2>&1 &
SERVER_PID=$!

# Save the PID
echo "$SERVER_PID" > "$PID_FILE"

# Wait a moment and check if the server started successfully
sleep 2
if ps -p "$SERVER_PID" > /dev/null 2>&1; then
    echo "Backend server started successfully (PID: $SERVER_PID)"
    echo "View logs: tail -f $LOG_FILE"
    echo "Stop server: ./backend/scripts/stop-backend.sh"
else
    echo "Error: Server failed to start. Check logs:"
    cat "$LOG_FILE"
    rm -f "$PID_FILE"
    exit 1
fi
