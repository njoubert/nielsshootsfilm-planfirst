#!/bin/bash
# Server provisioning script for Photography Portfolio Admin Backend
# Ubuntu 20.04 LTS (Focal)
#
# This script installs and configures the necessary dependencies for running
# the Go admin backend on the production server.
#
# Usage:
#   sudo ./server-provision.sh

set -e  # Exit on error

echo "=========================================="
echo "Server Provisioning for Photo Admin Backend"
echo "Ubuntu 20.04 LTS"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "ERROR: This script must be run as root (use sudo)"
    exit 1
fi

# Update package list
echo "Updating package list..."
apt-get update

# Install basic dependencies
echo "Installing basic dependencies..."
apt-get install -y \
    curl \
    wget \
    ca-certificates \
    gnupg \
    lsb-release

# Install Go 1.22 (latest stable)
echo ""
echo "Installing Go..."
GO_VERSION="1.22.8"
GO_ARCH="linux-amd64"
GO_TARBALL="go${GO_VERSION}.${GO_ARCH}.tar.gz"

# Remove old Go installation if exists
if [ -d "/usr/local/go" ]; then
    echo "Removing old Go installation..."
    rm -rf /usr/local/go
fi

# Download and install Go
cd /tmp
wget -q "https://go.dev/dl/${GO_TARBALL}"
tar -C /usr/local -xzf "${GO_TARBALL}"
rm "${GO_TARBALL}"

# Set up Go environment for all users
cat > /etc/profile.d/go.sh <<'EOF'
export PATH=$PATH:/usr/local/go/bin
export GOPATH=$HOME/go
export PATH=$PATH:$GOPATH/bin
EOF

chmod +x /etc/profile.d/go.sh

# Source for current session
export PATH=$PATH:/usr/local/go/bin

# Verify Go installation
GO_INSTALLED_VERSION=$(/usr/local/go/bin/go version | awk '{print $3}')
echo "Go installed: ${GO_INSTALLED_VERSION}"

# Install libvips for image processing
echo ""
echo "Installing libvips for image processing..."
echo "Using prebuilt binary to avoid package conflicts with PHP/WordPress..."

# Download prebuilt libvips binary (avoids all package conflicts)
cd /tmp
VIPS_VERSION="8.12.2"
VIPS_TARBALL="vips-${VIPS_VERSION}-linux-x64.tar.gz"

echo "Attempting to download prebuilt libvips..."
if wget -q "https://github.com/libvips/libvips/releases/download/v${VIPS_VERSION}/${VIPS_TARBALL}" 2>/dev/null; then
    # Prebuilt binary exists
    tar xzf "${VIPS_TARBALL}"
    cd "vips-${VIPS_VERSION}" || exit 1
    cp -r ./* /usr/local/
    ldconfig
    cd /tmp || exit 1
    rm -rf "${VIPS_TARBALL}" "vips-${VIPS_VERSION}"

    if command -v vips &> /dev/null; then
        VIPS_VERSION_INSTALLED=$(vips --version | head -n1)
        echo "✓ libvips installed from prebuilt binary: ${VIPS_VERSION_INSTALLED}"
    else
        echo "Prebuilt binary failed, trying build from source..."
        BUILD_FROM_SOURCE=1
    fi
else
    echo "No prebuilt binary available, building from source..."
    BUILD_FROM_SOURCE=1
fi

# If prebuilt didn't work, build from source with minimal dependencies
if [ "${BUILD_FROM_SOURCE}" = "1" ]; then
    echo "Building libvips from source with minimal dependencies..."

    # Install only the build tools (not dev libraries that conflict)
    apt-get install -y \
        build-essential \
        pkg-config \
        automake \
        libtool \
        libffi-dev \
        gettext \
        libmount-dev \
        libexpat1-dev

    # Install only image libraries that don't conflict
    apt-get install -y \
        libjpeg-dev \
        libpng-dev \
        libwebp-dev || true

    # Install glib in a custom prefix to avoid conflicts with system
    echo "Installing glib in custom prefix /opt/libvips-deps..."
    mkdir -p /opt/libvips-deps

    cd /tmp
    GLIB_VERSION="2.56.4"
    wget -q "https://download.gnome.org/sources/glib/2.56/glib-${GLIB_VERSION}.tar.xz"
    tar xf "glib-${GLIB_VERSION}.tar.xz"
    cd "glib-${GLIB_VERSION}"

    # Configure with CFLAGS to disable treating warnings as errors
    CFLAGS="-Wno-error" ./configure --prefix=/opt/libvips-deps --with-pcre=internal
    make -j"$(nproc)"
    make install

    cd /tmp
    rm -rf "glib-${GLIB_VERSION}" "glib-${GLIB_VERSION}.tar.xz"

    # Download and build libvips using our custom glib
    cd /tmp
    wget -q "https://github.com/libvips/libvips/releases/download/v8.10.6/vips-8.10.6.tar.gz"
    tar xzf "vips-8.10.6.tar.gz"
    cd "vips-8.10.6"

    # Configure with custom glib and minimal dependencies
    echo "Configuring libvips with custom glib..."
    PKG_CONFIG_PATH="/opt/libvips-deps/lib/pkgconfig:$PKG_CONFIG_PATH" \
    CFLAGS="-I/opt/libvips-deps/include" \
    LDFLAGS="-L/opt/libvips-deps/lib" \
    ./configure --prefix=/usr/local \
        --disable-dependency-tracking \
        --without-python \
        --without-magick \
        --without-orc \
        --without-pango \
        --without-fftw \
        --without-giflib \
        --without-librsvg \
        --without-libexif \
        --without-lcms \
        --without-OpenEXR \
        --without-nifti \
        --without-heif \
        --without-poppler \
        --without-matio

    echo "Building libvips (this may take a few minutes)..."
    make -j"$(nproc)"

    echo "Installing libvips..."
    make install

    # Add custom glib lib path to ldconfig
    echo "/opt/libvips-deps/lib" > /etc/ld.so.conf.d/libvips-deps.conf
    ldconfig

    cd /tmp
    rm -rf "vips-8.10.6" "vips-8.10.6.tar.gz"

    if command -v vips &> /dev/null; then
        VIPS_VERSION_INSTALLED=$(vips --version | head -n1)
        echo "✓ libvips installed from source: ${VIPS_VERSION_INSTALLED}"
    else
        echo "⚠ WARNING: libvips installation incomplete"
        echo "  The backend may have limited image processing capabilities"
    fi
fi

# Install Apache if not already installed
if ! command -v apache2 &> /dev/null; then
    echo ""
    echo "Installing Apache web server..."
    apt-get install -y apache2
else
    echo ""
    echo "Apache already installed"
fi

# Enable required Apache modules
echo ""
echo "Enabling required Apache modules..."
a2enmod rewrite headers expires deflate ssl proxy proxy_http

# Create directory structure
echo ""
echo "Creating directory structure..."
mkdir -p /var/www/admin-backend
mkdir -p /var/www/nielsshootsfilm.com/data
mkdir -p /var/www/nielsshootsfilm.com/uploads/originals
mkdir -p /var/www/nielsshootsfilm.com/uploads/display
mkdir -p /var/www/nielsshootsfilm.com/uploads/thumbnails

# Set proper ownership
echo "Setting directory ownership..."
chown -R www-data:www-data /var/www/admin-backend
chown -R www-data:www-data /var/www/nielsshootsfilm.com

# Set proper permissions
echo "Setting directory permissions..."
chmod -R 755 /var/www/nielsshootsfilm.com

# Configure firewall if UFW is active
if command -v ufw &> /dev/null && ufw status | grep -q "Status: active"; then
    echo ""
    echo "Configuring firewall..."
    ufw allow 'Apache Full'
    ufw allow 'OpenSSH'
    echo "Firewall configured"
else
    echo ""
    echo "UFW not active, skipping firewall configuration"
fi

echo ""
echo "=========================================="
echo "Provisioning Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Deploy the Go binary to /var/www/admin-backend/admin"
echo "2. Create /var/www/admin-backend/.env with configuration"
echo "3. Copy deployment/photo-admin.service to /etc/systemd/system/"
echo "4. Update Apache configuration with reverse proxy settings"
echo "5. Generate SSL certificate: sudo certbot --apache -d nielsshootsfilm.com"
echo "6. Start the backend service: sudo systemctl start photo-admin"
echo ""
echo "Verify installations:"
echo "  Go version: $(/usr/local/go/bin/go version)"
echo "  libvips version: $(vips --version | head -n1)"
echo "  Apache version: $(apache2 -v | head -n1)"
echo ""
echo "Log out and back in for Go PATH changes to take effect."
echo ""
