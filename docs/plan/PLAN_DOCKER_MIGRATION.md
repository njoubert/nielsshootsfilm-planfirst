# Plan: Docker + Traefik Migration for Mac Mini Web Server

**Created**: 2025-10-25  
**Status**: Planning  
**Size**: Large  
**Priority**: Future Enhancement

## Overview

Migrate from native Ubuntu server deployment (Apache + systemd) to a containerized architecture on Mac Mini using Docker Compose + Traefik for multi-site hosting.

## Goals

1. **Isolation**: Each app in its own container, no dependency conflicts
2. **Scalability**: Easy to add new sites (myjams.com, etc.) without affecting existing ones
3. **Maintainability**: Consistent deployment patterns, automated TLS, health checks
4. **Simplicity**: Single `docker compose up` to start everything
5. **Portability**: Same setup works on any Docker host

## Architecture

```
Internet
    ↓
Traefik Container (ports 80/443)
  - TLS termination (Let's Encrypt)
  - HTTP → HTTPS redirect
  - Routing by domain labels
    ↓
Docker Network (bridge: "web")
    ├─ nielsshootsfilm-admin (Go API, port 8080)
    ├─ nielsshootsfilm-frontend (nginx, port 80)
    ├─ myjams-api (Go API, port 8080)
    └─ myjams-frontend (nginx, port 80)

Host Volumes:
  /srv/mini/
    ├─ nielsshootsfilm/data/          → mounted into admin container
    ├─ nielsshootsfilm/uploads/       → mounted into admin + frontend
    ├─ myjams/data/                   → mounted into myjams containers
    └─ traefik/acme/                  → Let's Encrypt certs
```

## Key Benefits

### Over Current Setup
- ✅ No libvips installation headaches (included in Docker image)
- ✅ No Node.js version conflicts
- ✅ Automatic TLS certificate management
- ✅ Zero-downtime deploys via blue/green
- ✅ Consistent environments (dev = prod)
- ✅ Easy rollback (tag images, redeploy)

### For Multi-Site Future
- ✅ Add new site = add service to docker-compose.yml
- ✅ Isolated data directories per app
- ✅ Independent scaling/updates per service
- ✅ Shared reverse proxy (Traefik) for all sites

## Implementation Plan

### Phase 1: Docker Setup (Small)
**Tasks**:
- Create `Dockerfile` for backend (multi-stage Go build with libvips)
- Create `Dockerfile` for frontend (nginx with built static files)
- Test local builds: `docker build -t nielsshootsfilm-admin ./backend`
- Verify backend runs in container with volume mounts

**Risks**:
- libvips dependencies in Alpine vs Debian base images
- File permissions for volume mounts (www-data vs nonroot user)

**Deliverables**:
- `backend/Dockerfile`
- `frontend/Dockerfile`
- Documentation in `docs/DOCKER_BUILD.md`

### Phase 2: Docker Compose Configuration (Small)
**Tasks**:
- Create `docker-compose.yml` with Traefik + nielsshootsfilm services
- Create `.env.production` with domain/email configuration
- Create `traefik/dynamic/headers.yml` for security headers
- Configure volume mounts for data/uploads directories
- Add health checks to all services

**Risks**:
- Traefik routing labels can be tricky to debug
- Volume mount paths must exist on host before starting

**Deliverables**:
- `docker-compose.yml`
- `.env.production`
- `traefik/` configuration directory
- Updated `.gitignore` for secrets

### Phase 3: Mac Mini Setup (Medium)
**Tasks**:
- Install Docker Desktop on Mac Mini
- Create `/srv/mini/` directory structure
- Configure macOS to never sleep
- Create launchd plist for auto-start at boot
- Configure router port forwarding (80/443)
- Set up DNS records

**Risks**:
- Docker Desktop performance on Mac Mini (especially M1/M2)
- macOS firewall configuration
- launchd auto-start reliability

**Deliverables**:
- `/srv/mini/` directory structure on Mac Mini
- `com.srv.mini.plist` launchd configuration
- Updated `docs/DEPLOYMENT.md`

### Phase 4: Migration & Deployment (Medium)
**Tasks**:
- Build and push images to registry OR build on Mac Mini
- Copy data/uploads from Ubuntu server to Mac Mini
- Start services: `docker compose up -d`
- Verify health checks pass
- Update DNS to point to Mac Mini
- Monitor for issues

**Risks**:
- Downtime during DNS propagation
- Data sync issues (need final sync after services start)
- TLS certificate generation delays (Let's Encrypt rate limits)

**Deliverables**:
- Running containerized services on Mac Mini
- Migration runbook in `docs/reports/`
- Updated deployment scripts

### Phase 5: Multi-Site Expansion (Small)
**Tasks**:
- Add myjams.com services to docker-compose.yml
- Create separate data/uploads volumes
- Add Traefik labels for new domain
- Test routing and isolation

**Deliverables**:
- Working second site
- Template for adding future sites

## Technical Details

### Backend Dockerfile Strategy
```dockerfile
# Multi-stage build
FROM golang:1.23-alpine AS build
# Install libvips build dependencies
RUN apk add --no-cache vips-dev build-base
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o admin ./cmd/admin

# Runtime image
FROM alpine:3.19
RUN apk add --no-cache vips
COPY --from=build /app/admin /app/admin
EXPOSE 8080
CMD ["/app/admin"]
```

### Frontend Dockerfile Strategy
```dockerfile
# Build happens locally, Dockerfile just serves
FROM nginx:1.27-alpine
COPY build-bin/frontend/ /usr/share/nginx/html/
COPY deployment/nginx.conf /etc/nginx/conf.d/default.conf
```

### Data Volume Strategy
- Use bind mounts (not named volumes) for easier inspection
- Mount as read-write for backend, read-only for frontend where possible
- Backup strategy: rsync `/srv/mini/` to backup location

### Deployment Workflow
```bash
# Local machine
./build.sh                           # Build frontend
docker build -t nielsshootsfilm-admin ./backend
docker save nielsshootsfilm-admin | ssh mac-mini docker load

# Or: build on Mac Mini
scp -r . mac-mini:/srv/mini/nielsshootsfilm/
ssh mac-mini 'cd /srv/mini && docker compose build'

# Deploy
ssh mac-mini 'cd /srv/mini && docker compose up -d'
```

## Unknowns & Questions

1. **Docker Desktop vs Docker CE on macOS**: Which performs better? Docker Desktop is easier but heavier.
2. **Image registry**: Push to Docker Hub, GitHub Container Registry, or build on-server?
3. **Log management**: Keep in Docker logs or set up Loki/Grafana?
4. **Backup automation**: Time Machine sufficient or need custom scripts?
5. **Blue/green deploys**: Worth implementing now or wait until needed?
6. **Resource limits**: Set memory/CPU limits per container on Mac Mini?

## Dependencies

- Requires Mac Mini hardware
- Requires domain DNS control
- Requires router configuration (port forwarding)
- No dependencies on other plans

## Risks

### Major Architectural Change
- ⚠️ **High**: Complete rewrite of deployment infrastructure
- ⚠️ **Medium**: Learning curve for Traefik/Docker if unfamiliar
- ⚠️ **Medium**: Potential downtime during migration

### Mitigation
- Keep Ubuntu server running until Mac Mini is proven stable
- Test everything locally first with different ports
- Create detailed rollback plan
- Consider parallel running both servers during transition

## Alternatives Considered

### 1. Keep Native Deployment on Ubuntu
- **Pro**: Already working, no migration effort
- **Con**: Hard to scale to multiple sites, dependency management painful

### 2. Use Caddy Instead of Traefik
- **Pro**: Simpler config, automatic HTTPS built-in
- **Con**: Less flexible for complex routing, fewer plugins

### 3. Use nginx-proxy + letsencrypt-companion
- **Pro**: Simpler than Traefik for basic use cases
- **Con**: Less automatic, more manual configuration

### 4. Use Kubernetes (k3s)
- **Pro**: Industry standard, ultimate scalability
- **Con**: Massive overkill for 2-5 sites, steep learning curve

**Decision**: Traefik + Docker Compose is the sweet spot for this use case.

## Success Criteria

- [ ] nielsshootsfilm.com loads from containerized setup
- [ ] Admin API works with proper authentication
- [ ] Uploads persist across container restarts
- [ ] HTTPS working with valid certificates
- [ ] Auto-restarts on Mac Mini reboot
- [ ] Can add second site (myjams.com) in < 30 minutes
- [ ] Deployment takes < 5 minutes
- [ ] Zero manual certificate management

## Timeline Estimate

- **Phase 1**: 4-6 hours (Dockerfiles + local testing)
- **Phase 2**: 3-4 hours (docker-compose.yml + Traefik config)
- **Phase 3**: 2-3 hours (Mac Mini setup + launchd)
- **Phase 4**: 3-5 hours (Migration + monitoring)
- **Phase 5**: 1-2 hours (Second site template)

**Total**: ~2-3 days of focused work

## Next Steps

1. **Decision Point**: Proceed with Docker migration or defer?
2. If proceeding: Start with Phase 1 (Dockerfiles) in development
3. Test locally with `docker-compose.yml` using localhost domains
4. Document any issues discovered during testing
5. Create migration runbook before touching production

## References

- [Traefik Docker Provider Docs](https://doc.traefik.io/traefik/providers/docker/)
- [Docker Compose Best Practices](https://docs.docker.com/compose/production/)
- [govips Docker Example](https://github.com/davidbyttow/govips#docker)
- [nginx Docker Official Image](https://hub.docker.com/_/nginx)

---

**Author's Note**: This is a significant architectural change but will pay dividends when scaling to multiple sites. The current Ubuntu/Apache setup works fine for one site, but containerization is the right move for a multi-site Mac Mini server.
