#!/bin/bash
# Pre-commit hook to ensure shell scripts are only in designated directories
# Allowed locations:
#   - backend/scripts/
#   - frontend/scripts/
#   - scripts/
#   - Root convenience scripts: dev.sh, format.sh, provision.sh, build.sh, bootstrap.sh

set -e

EXIT_CODE=0

for file in "$@"; do
    case "$file" in
        backend/scripts/*|frontend/scripts/*|scripts/*|dev.sh|format.sh|provision.sh|build.sh|bootstrap.sh)
            # Allowed location
            ;;
        *)
            echo "❌ Error: Script '$file' is not in an allowed directory"
            echo "   Allowed locations:"
            echo "     • backend/scripts/"
            echo "     • frontend/scripts/"
            echo "     • scripts/"
            echo "     • Root convenience scripts: dev.sh, format.sh, provision.sh, build.sh, bootstrap.sh"
            EXIT_CODE=1
            ;;
    esac
done

exit $EXIT_CODE
