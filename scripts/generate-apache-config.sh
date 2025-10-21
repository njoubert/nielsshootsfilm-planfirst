#!/usr/bin/env bash
# Generate Apache configuration from template
# Usage: ./generate-apache-config.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
    # shellcheck disable=SC2046
    export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
else
    echo "Warning: .env file not found. Using default values."
    echo "Copy .env.example to .env and configure SITE_URL"
fi

# Check if SITE_URL is set
if [ -z "$SITE_URL" ]; then
    echo "Error: SITE_URL not set in .env file"
    echo "Please set SITE_URL in your .env file (e.g., SITE_URL=nielsshootsfilm.com)"
    exit 1
fi

# Template and output files
TEMPLATE_FILE="$PROJECT_ROOT/deployment/apache-site.conf"
OUTPUT_FILE="$PROJECT_ROOT/deployment/apache-site-${SITE_URL}.conf"

echo "Generating Apache configuration for $SITE_URL..."

# Replace ${SITE_URL} placeholder with actual value
sed "s/\${SITE_URL}/$SITE_URL/g" "$TEMPLATE_FILE" > "$OUTPUT_FILE"

echo ""
echo "✅ Configuration generated: $OUTPUT_FILE"
echo ""
echo "Next steps:"
echo "1. Review the generated configuration"
echo "2. Update DocumentRoot path if needed"
echo "3. Copy to Apache sites-available:"
echo "   sudo cp $OUTPUT_FILE /etc/apache2/sites-available/${SITE_URL}.conf"
echo "4. Enable required modules:"
echo "   sudo a2enmod rewrite headers expires ssl"
echo "5. Enable the site:"
echo "   sudo a2ensite ${SITE_URL}"
echo "6. Test configuration:"
echo "   sudo apache2ctl configtest"
echo "7. Reload Apache:"
echo "   sudo systemctl reload apache2"
echo ""
