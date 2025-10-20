#!/usr/bin/env bash
# Manage both frontend and backend dev servers
#
# Usage:
#   ./dev.sh         - Stop then start both servers
#   ./dev.sh start   - Start both servers
#   ./dev.sh stop    - Stop both servers

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

stop_servers() {
    echo "=================================================="
    echo "Stopping Development Servers"
    echo "=================================================="
    echo ""

    "$SCRIPT_DIR/backend/scripts/stop-backend.sh"
    echo ""
    "$SCRIPT_DIR/frontend/scripts/stop-frontend.sh"
    echo ""
}

start_servers() {
    echo "=================================================="
    echo "Starting Development Servers"
    echo "=================================================="
    echo ""

    # Trap Ctrl+C and cleanup both servers
    cleanup() {
        echo ""
        echo "Shutting down servers..."
        "$SCRIPT_DIR/backend/scripts/stop-backend.sh"
        "$SCRIPT_DIR/frontend/scripts/stop-frontend.sh"
        exit 0
    }

    trap cleanup INT TERM

    # Start backend server
    "$SCRIPT_DIR/backend/scripts/start-backend.sh"
    echo ""

    # Start frontend server
    "$SCRIPT_DIR/frontend/scripts/start-frontend.sh"
    echo ""

    echo "=================================================="
    echo "Development Servers Running"
    echo "=================================================="
    echo "Frontend: http://localhost:5173"
    echo "Backend:  http://localhost:8080"
    echo "Admin:    http://localhost:5173/admin/login"
    echo ""
    echo "Press Ctrl+C to stop both servers"
    echo "View logs:"
    echo "  Frontend: tail -f frontend/.server.log"
    echo "  Backend:  tail -f backend/.server.log"
    echo "=================================================="

    # Keep script running and wait for Ctrl+C
    wait
}

# Parse command
COMMAND="${1:-restart}"

case "$COMMAND" in
    start)
        start_servers
        ;;
    stop)
        stop_servers
        ;;
    restart|"")
        stop_servers
        start_servers
        ;;
    *)
        echo "Error: Unknown command '$COMMAND'"
        echo ""
        echo "Usage:"
        echo "  ./dev.sh         - Stop then start both servers"
        echo "  ./dev.sh start   - Start both servers"
        echo "  ./dev.sh stop    - Stop both servers"
        exit 1
        ;;
esac
