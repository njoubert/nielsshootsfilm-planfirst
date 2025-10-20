#!/bin/bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${GREEN}=== Photography Portfolio Bootstrap ===${NC}\n"

# Create directories
echo "Creating required directories..."
mkdir -p "$PROJECT_ROOT/data"
mkdir -p "$PROJECT_ROOT/static/uploads/originals"
mkdir -p "$PROJECT_ROOT/static/uploads/display"
mkdir -p "$PROJECT_ROOT/static/uploads/thumbnails"
echo -e "${GREEN}✓ Directories created${NC}\n"

# Initialize albums.json if it doesn't exist
if [ ! -f "$PROJECT_ROOT/data/albums.json" ]; then
    echo "Initializing albums.json..."
    cat > "$PROJECT_ROOT/data/albums.json" <<'EOF'
{
  "version": "1.0",
  "last_updated": "2024-01-01T00:00:00Z",
  "albums": []
}
EOF
    echo -e "${GREEN}✓ albums.json created${NC}\n"
else
    echo -e "${YELLOW}⚠ albums.json already exists, skipping${NC}\n"
fi

# Initialize site_config.json if it doesn't exist
if [ ! -f "$PROJECT_ROOT/data/site_config.json" ]; then
    echo "Initializing site_config.json..."
    cat > "$PROJECT_ROOT/data/site_config.json" <<'EOF'
{
  "version": "1.0",
  "last_updated": "2024-01-01T00:00:00Z",
  "site": {
    "title": "My Photography Portfolio",
    "language": "en",
    "timezone": "UTC"
  },
  "owner": {},
  "social": {},
  "branding": {
    "primary_color": "#1a1a1a",
    "secondary_color": "#ffffff",
    "accent_color": "#4a90e2",
    "theme": {
      "mode": "system",
      "light": {
        "background": "#ffffff",
        "surface": "#f5f5f5",
        "text_primary": "#1a1a1a",
        "text_secondary": "#666666",
        "border": "#e0e0e0"
      },
      "dark": {
        "background": "#121212",
        "surface": "#1e1e1e",
        "text_primary": "#ffffff",
        "text_secondary": "#b0b0b0",
        "border": "#333333"
      }
    }
  },
  "portfolio": {
    "show_exif_data": true,
    "enable_lightbox": true
  },
  "navigation": {
    "show_home": true,
    "show_albums": true,
    "show_about": false,
    "show_contact": false
  },
  "features": {}
}
EOF
    echo -e "${GREEN}✓ site_config.json created${NC}\n"
else
    echo -e "${YELLOW}⚠ site_config.json already exists, skipping${NC}\n"
fi

# Initialize admin_config.json if it doesn't exist
if [ ! -f "$PROJECT_ROOT/data/admin_config.json" ]; then
    echo -e "${YELLOW}Admin credentials not configured.${NC}"
    echo "You will be prompted to set an admin password."
    echo ""

    # Prompt for admin password
    read -r -s -p "Enter admin password: " ADMIN_PASSWORD
    echo ""
    read -r -s -p "Confirm admin password: " ADMIN_PASSWORD_CONFIRM
    echo -e "\n"

    if [ "$ADMIN_PASSWORD" != "$ADMIN_PASSWORD_CONFIRM" ]; then
        echo -e "${RED}✗ Passwords do not match${NC}"
        exit 1
    fi

    if [ -z "$ADMIN_PASSWORD" ]; then
        echo -e "${RED}✗ Password cannot be empty${NC}"
        exit 1
    fi

    # Generate bcrypt hash using Go
    echo "Generating password hash..."
    HASH=$(go run "$PROJECT_ROOT/scripts/hash_password.go" "$ADMIN_PASSWORD")

    # Create admin_config.json
    cat > "$PROJECT_ROOT/data/admin_config.json" <<EOF
{
  "version": "1.0",
  "admin": {
    "username": "admin",
    "password_hash": "$HASH"
  },
  "session": {
    "timeout_minutes": 60
  }
}
EOF
    echo -e "${GREEN}✓ admin_config.json created${NC}\n"
else
    echo -e "${YELLOW}⚠ admin_config.json already exists, skipping${NC}\n"
fi

echo -e "${GREEN}=== Bootstrap Complete ===${NC}"
echo ""
echo "Next steps:"
echo "1. Update site_config.json with your site details"
echo "2. Run 'bazel run //frontend:dev' to start the dev server"
echo "3. Run 'bazel run //backend/cmd/admin:admin' to start the admin server"
echo ""
