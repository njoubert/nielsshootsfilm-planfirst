# Multi-stage build for minimal image size
FROM golang:1.24-alpine AS builder

# Install build dependencies including libvips
RUN apk add --no-cache \
    git \
    gcc \
    musl-dev \
    vips-dev

WORKDIR /build

# Copy go mod files first (better caching)
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the binary with CGO enabled (required for vips)
RUN CGO_ENABLED=1 GOOS=linux go build -o admin ./cmd/admin

# Final stage - minimal runtime image
FROM alpine:latest

# Install runtime dependencies (libvips and ca-certificates)
RUN apk --no-cache add ca-certificates vips

# Create non-root user
RUN addgroup -g 1000 appuser && \
    adduser -D -u 1000 -G appuser appuser

WORKDIR /app

# Copy binary from builder
COPY --from=builder /build/admin .

# Create mount points (actual dirs come from host)
RUN mkdir -p /data /uploads && \
    chown appuser:appuser /data /uploads

# Switch to non-root user
USER appuser

# Expose admin server port
EXPOSE 6180

# Default environment variables (can be overridden)
ENV DATA_DIR=/data
ENV UPLOAD_DIR=/uploads
ENV PORT=6180

# Run the admin server
CMD ["./admin"]
