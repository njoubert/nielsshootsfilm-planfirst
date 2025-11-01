# Backend Docker Deployment Plan

## Verdict

This is an experiment I performed to deploy the backend as a docker container.
My main interest is having all the dependencies nicely isolated from my host system.
It worked decently well on my mac mini, with a few caveats:

- Docker containers run inside a virtualized linux kernel.
- The virtual containers have fairly poor and slow access to the root machine's file system on Mac.
- Poor host file system access is a problem for my setup with the static page served from nginx and the admin dynamic site running in a docker container.
- Image processing was als quite slow (may be a mac mini hardware issue).

Therefore I am abandoning this approach for now.

## Overview

Deploy the Go admin backend as a Docker container that can be easily deployed to production servers. The container will run the admin server while accessing host directories for data and uploads.

## Docker Basics (For First-Time Users)

**Basic Workflow**:

1. Write a `Dockerfile` (recipe for building the image)
2. Run `docker build` to create the image on your dev machine
3. Run `docker save` to export the image as a `.tar` file
4. Copy the `.tar` file to your server (via scp, rsync, etc.)
5. Run `docker load` on the server to import the image
6. Run `docker run` to start a container from the image

**Key Concepts**:

- **Image**: Frozen snapshot of your app (like a ZIP file)
- **Container**: Running instance of an image (like an unzipped, running program)
- **Volume**: Way to connect host directories to container directories
- **Port mapping**: Connect container's port 6180 to host's port 6180

## Architecture

```text
┌─────────────────────────────────┐
│         Host Server             │
│                                 │
│  /Users/njoubert/webserver/sites/nielsshootsfilm.com/public/data/    │ ← Mounted into container
│  /Users/njoubert/webserver/sites/nielsshootsfilm.com/public/uploads/ │ ← Mounted into container
│                                 │
│  ┌──────────────────────────┐  │
│  │   Docker Container       │  │
│  │                          │  │
│  │  /app/admin (binary)     │  │
│  │  /data → host volume     │  │
│  │  /uploads → host volume  │  │
│  │                          │  │
│  │  Port 6180               │  │
│  └──────────────────────────┘  │
│            ↓                    │
│    Port 6180 (exposed)          │
└─────────────────────────────────┘
```

## Implementation Plan

### 1. Dockerfile

**File**: `backend/Dockerfile`

**Why multi-stage build?**

- First stage: Uses full Go toolchain to compile
- Second stage: Copies only the compiled binary
- Result: ~15MB image instead of ~500MB

### .dockerignore

**File**: `backend/.dockerignore`

## Deployment Workflow

### Initial Setup (One-time)

1. **On Development Machine**:

```bash
cd backend
./scripts/build-docker.sh
./scripts/docker-save.sh ~/Desktop/
```

1. **Copy to Server**:

```bash
scp ~/Desktop/nielsshootsfilm-admin-latest.tar user@server:/tmp/
```

1. **On Server**:

```bash
# Load the image
docker load -i /tmp/nielsshootsfilm-admin-latest.tar

# Create .env file
sudo mkdir -p /var/www/admin-backend
sudo nano /var/www/admin-backend/.env
# Add: ADMIN_PASSWORD_HASH=...
```

## File Structure

```text
backend/
├── Dockerfile                    # NEW - Docker build recipe
├── .dockerignore                 # NEW - Files to exclude from image
└── scripts/
    ├── build-docker.sh           # NEW - Build Docker image
    ├── docker-save.sh            # NEW - Export image for deployment
    └── docker-run.sh             # NEW - Run container locally

docs/deployment/
├── backend_docker.md             # THIS FILE - Planning doc
└── DOCKER_DEPLOYMENT.md          # NEW - Step-by-step deploy guide
```
