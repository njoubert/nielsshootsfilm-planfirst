#!/usr/bin/env bash
# Manage both frontend and backend dev servers
#
# Usage:
#   ./dev.sh                    - Stop then start both servers
#   ./dev.sh start              - Start both servers
#   ./dev.sh stop               - Stop both servers
#   ./dev.sh status             - Check status of both servers
#   ./dev.sh frontend start     - Start only frontend
#   ./dev.sh frontend stop      - Stop only frontend
#   ./dev.sh frontend status    - Check frontend status
#   ./dev.sh backend start      - Start only backend
#   ./dev.sh backend stop       - Stop only backend
#   ./dev.sh backend status     - Check backend status

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

stop_backend() {
    echo "=================================================="
    echo "Stopping Backend Server"
    echo "=================================================="
    echo ""
    "$SCRIPT_DIR/backend/scripts/stop-backend.sh"
    echo ""
}

stop_frontend() {
    echo "=================================================="
    echo "Stopping Frontend Server"
    echo "=================================================="
    echo ""
    "$SCRIPT_DIR/frontend/scripts/stop-frontend.sh"
    echo ""
}

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

# Helper function to check backend status
# Returns: 0 if running and responding, 1 if running but not responding, 2 if not running
check_backend_status() {
    if pgrep -f "go run.*cmd/admin" > /dev/null; then
        # Process is running, check if responding
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:6180/api/health 2>/dev/null | grep -q "200\|404"; then
            return 0  # Running and responding
        else
            return 1  # Running but not responding
        fi
    else
        return 2  # Not running
    fi
}

# Helper function to check frontend status
# Returns: 0 if running and responding, 1 if running but not responding, 2 if not running
check_frontend_status() {
    if pgrep -f "node_modules/.bin/vite" > /dev/null; then
        # Process is running, check if responding
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 2>/dev/null | grep -q "200"; then
            return 0  # Running and responding
        else
            return 1  # Running but not responding
        fi
    else
        return 2  # Not running
    fi
}

status_backend() {
    echo "=================================================="
    echo "Backend Server Status"
    echo "=================================================="
    echo ""

    check_backend_status
    local status=$?

    case $status in
        0)
            echo "✓ Backend server is RUNNING"
            echo "  Process: $(pgrep -f 'go run.*cmd/admin')"
            echo "  URL: http://localhost:6180"
            echo "  Status: Responding to requests"
            ;;
        1)
            echo "⚠ Backend server is RUNNING"
            echo "  Process: $(pgrep -f 'go run.*cmd/admin')"
            echo "  URL: http://localhost:6180"
            echo "  Warning: Process running but not responding"
            ;;
        2)
            echo "✗ Backend server is NOT running"
            ;;
    esac
    echo ""
}

status_frontend() {
    echo "=================================================="
    echo "Frontend Server Status"
    echo "=================================================="
    echo ""

    check_frontend_status
    local status=$?

    case $status in
        0)
            echo "✓ Frontend server is RUNNING"
            echo "  Process: $(pgrep -f 'node_modules/.bin/vite')"
            echo "  URL: http://localhost:5173"
            echo "  Status: Responding to requests"
            ;;
        1)
            echo "⚠ Frontend server is RUNNING"
            echo "  Process: $(pgrep -f 'node_modules/.bin/vite')"
            echo "  URL: http://localhost:5173"
            echo "  Warning: Process running but not responding"
            ;;
        2)
            echo "✗ Frontend server is NOT running"
            ;;
    esac
    echo ""
}

status_servers() {
    echo "=================================================="
    echo "Development Servers Status"
    echo "=================================================="
    echo ""

    # Check backend
    check_backend_status
    local backend_status=$?

    case $backend_status in
        0)
            echo "✓ Backend:  RUNNING (http://localhost:6180)"
            echo "            Responding to requests"
            ;;
        1)
            echo "⚠ Backend:  RUNNING (http://localhost:6180)"
            echo "            Warning: Not responding"
            ;;
        2)
            echo "✗ Backend:  NOT running"
            ;;
    esac

    echo ""

    # Check frontend
    check_frontend_status
    local frontend_status=$?

    case $frontend_status in
        0)
            echo "✓ Frontend: RUNNING (http://localhost:5173)"
            echo "            Responding to requests"
            ;;
        1)
            echo "⚠ Frontend: RUNNING (http://localhost:5173)"
            echo "            Warning: Not responding"
            ;;
        2)
            echo "✗ Frontend: NOT running"
            ;;
    esac

    echo ""
    echo "=================================================="
}

start_backend() {
    echo "=================================================="
    echo "Starting Backend Server"
    echo "=================================================="
    echo ""

    # Trap Ctrl+C and cleanup
    cleanup() {
        echo ""
        echo "Shutting down backend server..."
        "$SCRIPT_DIR/backend/scripts/stop-backend.sh"
        exit 0
    }

    trap cleanup INT TERM

    "$SCRIPT_DIR/backend/scripts/start-backend.sh"
    echo ""

    echo "=================================================="
    echo "Backend Server Running"
    echo "=================================================="
    echo "Backend: http://localhost:6180"
    echo "Admin:   http://localhost:5173/admin/login"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo "View logs: tail -f backend/.server.log"
    echo "=================================================="

    # Keep script running and wait for Ctrl+C
    wait
}

start_frontend() {
    echo "=================================================="
    echo "Starting Frontend Server"
    echo "=================================================="
    echo ""

    # Trap Ctrl+C and cleanup
    cleanup() {
        echo ""
        echo "Shutting down frontend server..."
        "$SCRIPT_DIR/frontend/scripts/stop-frontend.sh"
        exit 0
    }

    trap cleanup INT TERM

    "$SCRIPT_DIR/frontend/scripts/start-frontend.sh"
    echo ""

    echo "=================================================="
    echo "Frontend Server Running"
    echo "=================================================="
    echo "Frontend: http://localhost:5173"
    echo "Admin:    http://localhost:5173/admin/login"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo "View logs: tail -f frontend/.server.log"
    echo "=================================================="

    # Keep script running and wait for Ctrl+C
    wait
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
    echo "Backend:  http://localhost:6180"
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

show_usage() {
    echo "Usage:"
    echo "  ./dev.sh                    - Stop then start both servers"
    echo "  ./dev.sh start              - Start both servers"
    echo "  ./dev.sh stop               - Stop both servers"
    echo "  ./dev.sh status             - Check status of both servers"
    echo "  ./dev.sh frontend start     - Start only frontend"
    echo "  ./dev.sh frontend stop      - Stop only frontend"
    echo "  ./dev.sh frontend status    - Check frontend status"
    echo "  ./dev.sh backend start      - Start only backend"
    echo "  ./dev.sh backend stop       - Stop only backend"
    echo "  ./dev.sh backend status     - Check backend status"
}

# Parse commands
if [ $# -eq 0 ]; then
    # No arguments: restart both
    stop_servers
    start_servers
elif [ $# -eq 1 ]; then
    # One argument: start/stop both
    COMMAND="$1"
    case "$COMMAND" in
        start)
            start_servers
            ;;
        stop)
            stop_servers
            ;;
        status)
            status_servers
            ;;
        *)
            echo "Error: Unknown command '$COMMAND'"
            echo ""
            show_usage
            exit 1
            ;;
    esac
elif [ $# -eq 2 ]; then
    # Two arguments: service + command
    SERVICE="$1"
    COMMAND="$2"

    case "$SERVICE" in
        frontend)
            case "$COMMAND" in
                start)
                    start_frontend
                    ;;
                stop)
                    stop_frontend
                    ;;
                status)
                    status_frontend
                    ;;
                *)
                    echo "Error: Unknown command '$COMMAND' for frontend"
                    echo ""
                    show_usage
                    exit 1
                    ;;
            esac
            ;;
        backend)
            case "$COMMAND" in
                start)
                    start_backend
                    ;;
                stop)
                    stop_backend
                    ;;
                status)
                    status_backend
                    ;;
                *)
                    echo "Error: Unknown command '$COMMAND' for backend"
                    echo ""
                    show_usage
                    exit 1
                    ;;
            esac
            ;;
        *)
            echo "Error: Unknown service '$SERVICE'"
            echo ""
            show_usage
            exit 1
            ;;
    esac
else
    echo "Error: Too many arguments"
    echo ""
    show_usage
    exit 1
fi
