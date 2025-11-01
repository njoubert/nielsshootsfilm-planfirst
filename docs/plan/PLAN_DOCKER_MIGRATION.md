# Plan: Dockerize Backend API

**Created**: 2025-10-28
**Status**: Planning
**Size**: Small
**Priority**: Current

## Goal

Package the Go admin API (`/api`) in a Docker container. Frontend remains static files served by nginx. nginx proxies `/api/*` requests to the container.

## Architecture

```text
~/webserver/sites/nielsshootsfilm.com/
  ├── public/                    # nginx serves from here
  │   ├── assets/
  │   ├── data/                  # mounted into container
  │   ├── uploads/               # mounted into container
  │   └── index.html
  └── api/                       # new directory
      ├── docker-compose.yml
      └── Dockerfile

nginx (native)
  ├─ / → ~/webserver/sites/nielsshootsfilm.com/public/
  └─ /api/* → proxy_pass http://localhost:6180
               ↓
         Docker container (in api/ dir)
           - mounts ../public/data:/app/data
           - mounts ../public/uploads:/app/uploads
```

## Tasks

1. **Create backend/Dockerfile**

   - Multi-stage build (golang:alpine → alpine runtime)
   - Include libvips runtime dependencies
   - Copy compiled binary
   - Expose port 6180
   - CMD to run admin server

2. **Create api/ directory on server**

   - `~/webserver/sites/nielsshootsfilm.com/api/`
   - Contains: `Dockerfile`, `docker-compose.yml`, `.env`
   - Volume mounts point to `../public/data` and `../public/uploads`

3. **Update deployment scripts**

   - Copy backend source to server
   - Build Docker image in `api/` directory
   - Start container with docker compose

4. **Test locally**
   - Set up same directory structure locally
   - `cd api && docker compose up --build`
   - Verify API responds at `http://localhost:6180/api/albums`
   - Verify uploads/data persist across restarts

## Dockerfile Strategy

**Target Platform**: Intel Mac Mini (x86_64/amd64)

```dockerfile
# Build stage
FROM golang:1.23-alpine AS build
RUN apk add --no-cache vips-dev gcc musl-dev
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
# Build for amd64 (Intel Mac)
RUN GOARCH=amd64 go build -o admin ./cmd/admin

# Runtime stage
FROM alpine:3.19
RUN apk add --no-cache vips ca-certificates
COPY --from=build /app/admin /app/admin
WORKDIR /app
EXPOSE 6180
CMD ["/app/admin"]
```

**Note**: Since the target is Intel Mac (amd64), building locally on Apple Silicon requires `--platform linux/amd64` or cross-compilation.

## docker-compose.yml

Place in `~/webserver/sites/nielsshootsfilm.com/api/docker-compose.yml`:

```yaml
services:
  admin-api:
    build: .
    ports:
      - '6180:6180'
    volumes:
      - ../public/data:/app/data
      - ../public/uploads:/app/uploads
    environment:
      - DATA_DIR=/app/data
      - UPLOAD_DIR=/app/uploads
      - PORT=6180
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'wget', '-q', '-O-', 'http://localhost:6180/api/health']
      interval: 30s
      timeout: 3s
      retries: 3
```

## Deployment Workflow

```bash
# Local: prepare backend source
cd backend
tar -czf backend.tar.gz .

# Copy to server (Intel Mac Mini)
scp backend.tar.gz server:~/webserver/sites/nielsshootsfilm.com/api/

# Server: extract, build, and start
ssh server << 'EOF'
  cd ~/webserver/sites/nielsshootsfilm.com/api
  tar -xzf backend.tar.gz
  docker compose down
  docker compose up --build -d
  docker compose logs -f
EOF
```

**Cross-compile**: If building locally on Apple Silicon, use platform flag:

```bash
docker buildx build --platform linux/amd64 -t admin-api .
docker save admin-api | ssh server docker load
```

## Benefits

- ✅ No more libvips installation on host
- ✅ Consistent environment (dev = prod)
- ✅ Easy rollback (tag images)
- ✅ Isolated dependencies
- ✅ Health checks + auto-restart

## Risks

- libvips build in Alpine might need extra packages
- Volume mount permissions (container user vs host user)
- Port conflict if 6180 already in use
- **Platform mismatch**: Building on Apple Silicon for Intel Mac requires cross-compilation (simpler to build on server)

## Platform Considerations (Intel Mac Mini)

My dev machine is an apple silicon, so be sure to properly build:

- Option 2: Use `--platform linux/amd64` when building locally
- Option 3: Use `docker buildx` for cross-platform builds

## Timeline

**2-3 hours**: Dockerfile + compose + local testing
**1 hour**: Deployment script updates
**1 hour**: Server deployment + verification

**Total**: Half day of work
