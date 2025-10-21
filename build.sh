#!/usr/bin/env bash
# Master build script for nielsshootsfilm project
# Builds both frontend and backend components

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

# Parse command line arguments
COMMAND="${1:-build}"

case "$COMMAND" in
  clean)
    echo "🧹 Cleaning all build artifacts..."
    rm -rf "$PROJECT_ROOT/build"
    rm -rf "$PROJECT_ROOT/build-bin"
    echo "✅ Clean complete!"
    echo ""
    exit 0
    ;;
  build)
    echo "🏗️  Building nielsshootsfilm project..."
    echo ""

    # Build backend
    echo "═══════════════════════════════════════════════════════"
    echo "Building Backend..."
    echo "═══════════════════════════════════════════════════════"
    "$PROJECT_ROOT/backend/scripts/build.sh"
    echo ""

    # Build frontend
    echo "═══════════════════════════════════════════════════════"
    echo "Building Frontend..."
    echo "═══════════════════════════════════════════════════════"
    "$PROJECT_ROOT/frontend/scripts/build.sh"
    echo ""

    echo "═══════════════════════════════════════════════════════"
    echo "✅ All builds complete!"
    echo "═══════════════════════════════════════════════════════"
    echo ""
    echo "📦 Build artifacts:"
    echo "  Backend:  $PROJECT_ROOT/build-bin/backend/admin"
    echo "  Frontend: $PROJECT_ROOT/build-bin/frontend/"
    echo ""
    exit 0
    ;;
  *)
    echo "Usage: $0 [build|clean]"
    echo ""
    echo "Commands:"
    echo "  build (default)  Build both frontend and backend"
    echo "  clean           Remove all build artifacts"
    echo ""
    exit 1
    ;;
esac
