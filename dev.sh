#!/usr/bin/env bash
# Run both frontend and backend dev servers in parallel

set -e

echo "=================================================="
echo "Starting Development Servers"
echo "=================================================="
echo ""

# Trap Ctrl+C and cleanup both servers
cleanup() {
    echo ""
    echo "Shutting down servers..."
    ./backend/scripts/stop-backend.sh
    ./frontend/scripts/stop-frontend.sh
    exit 0
}

trap cleanup INT TERM

# Start backend server
./backend/scripts/start-backend.sh
echo ""

# Start frontend server
./frontend/scripts/start-frontend.sh
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
