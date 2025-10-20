# Scripts Directory

Utility scripts for the nielsshootsfilm project.

## Running Scripts

All scripts can be run directly from the command line:

```bash
./scripts/bootstrap.sh                      # Initialize project
go run scripts/hash_password.go             # Hash a password
./scripts/test-api.sh                       # Run API tests
node scripts/download-sample-images.js      # Download test images
./backend/scripts/start-backend.sh          # Start backend server
./backend/scripts/stop-backend.sh           # Stop backend server
./frontend/scripts/start-frontend.sh        # Start frontend server
./frontend/scripts/stop-frontend.sh         # Stop frontend server
```

## Available Scripts

### bootstrap.sh

Initializes the project for first-time setup.

**Usage:**

```bash
./scripts/bootstrap.sh
```

**What it does:**

1. Creates directory structure (`data/`, `static/uploads/` with subdirectories)
2. Creates empty data files (`albums.json`, `site_config.json`) if they don't exist
3. Prompts for admin username and password
4. Generates bcrypt hash for password
5. Creates `admin_config.json` with credentials

**When to use:** First time setting up the project, or to reset to a clean state.

---

### hash_password.go

Generates bcrypt hashes for passwords.

**Usage:**

```bash
go run scripts/hash_password.go
```

**What it does:**

- Prompts for a password
- Generates a bcrypt hash
- Displays the hash for use in configuration

**When to use:** Creating admin passwords, updating authentication credentials.

---

### test-api.sh

Runs comprehensive API integration tests against the backend server.

**Usage:**

```bash
./scripts/test-api.sh
```

**What it does:**

1. Starts the backend server (if not running)
2. Runs 13+ API endpoint tests:
   - Authentication (login, logout, protected endpoints)
   - Album CRUD operations
   - Photo management
   - Site configuration
3. Displays detailed test results
4. Stops the server (if it was started by the script)

**When to use:** After backend changes, before committing, during manual testing.

**Results:** See [docs/reports/API_TEST_RESULTS.md](../docs/reports/API_TEST_RESULTS.md) for latest test documentation.

---

### start-backend.sh

Starts the Go backend server in the background.

**Location:** `backend/scripts/start-backend.sh`

**Usage:**

```bash
./backend/scripts/start-backend.sh
```

**What it does:**

- Loads environment variables from `backend/.env`
- Starts the Go admin server on port 8080
- Runs in background with nohup
- Creates PID file at `backend/.server.pid`
- Logs output to `backend/.server.log`

**Server endpoints:**

- Admin API: `http://localhost:8080/api/admin/*`
- Public API: `http://localhost:8080/api/*`

---

### stop-backend.sh

Stops the running backend server with robust cleanup.

**Location:** `backend/scripts/stop-backend.sh`

**Usage:**

```bash
./backend/scripts/stop-backend.sh
```

**What it does:**

1. Kills the `go run` parent process
2. Kills any orphaned child processes (the actual Go binary)
3. Checks if port 8080 is still in use
4. Force kills any zombie processes using the port
5. Cleans up PID file

**Why the robust cleanup:** `go run` creates two processes (parent wrapper + compiled binary), and sometimes the child survives when the parent dies, requiring explicit cleanup.

---

### start-frontend.sh

Starts the Vite frontend dev server in the background.

**Location:** `frontend/scripts/start-frontend.sh`

**Usage:**

```bash
./frontend/scripts/start-frontend.sh
```

**What it does:**

- Starts the Vite dev server on port 5173
- Runs in background with nohup
- Creates PID file at `frontend/.server.pid`
- Logs output to `frontend/.server.log`
- Provides hot-reload for frontend changes

**Frontend URL:** `http://localhost:5173`

---

### stop-frontend.sh

Stops the running frontend server with robust cleanup.

**Location:** `frontend/scripts/stop-frontend.sh`

**Usage:**

```bash
./frontend/scripts/stop-frontend.sh
```

**What it does:**

1. Kills the `npm` parent process
2. Kills any orphaned child processes (the actual Vite server)
3. Checks if port 5173 is still in use
4. Force kills any zombie processes using the port
5. Cleans up PID file

**Why the robust cleanup:** Similar to backend, `npm run` creates multiple processes that need explicit cleanup.

---

### download-sample-images.js

Downloads sample images from picsum.photos and saves them locally.

**Usage:**

```bash
node scripts/download-sample-images.js
```

**What it does:**

1. Reads `data/albums.json` to find photos with picsum.photos URLs
2. Downloads each image in three sizes:
   - Original (1920x1080)
   - Display (1200x800)
   - Thumbnail (400x300)
3. Saves images to `static/uploads/{originals,display,thumbnails}/`
4. Updates `albums.json` to point to local `/uploads/` paths
5. Updates file sizes to reflect actual downloaded sizes

**Why:**
Picsum.photos returns random images on each request. By downloading and caching them locally, we ensure:

- Consistent images across all developers
- No external dependencies during development
- Faster page loads (no external HTTP requests)
- Ability to work offline

**When to use:** Initial setup, or when you want to refresh sample images.

---

## Development Workflow

### First-Time Setup

```bash
# 1. Install dependencies
cd frontend && npm install
cd ../backend && go mod download

# 2. Initialize project
./scripts/bootstrap.sh

# 3. Download sample images (optional)
node scripts/download-sample-images.js

# 4. Start development servers
# Terminal 1:
./frontend/scripts/dev.sh

# Terminal 2:
./backend/scripts/dev.sh
```

### Daily Development

```bash
# Option 1: Start both servers together
./dev.sh

# Option 2: Start servers separately (in separate terminals)
./backend/scripts/start-backend.sh
./frontend/scripts/start-frontend.sh

# Stop servers
./backend/scripts/stop-backend.sh
./frontend/scripts/stop-frontend.sh

# Run tests
./frontend/scripts/test.sh
./backend/scripts/test.sh

# Before committing
./frontend/scripts/lint.sh
./frontend/scripts/typecheck.sh
./backend/scripts/lint.sh
```

### Testing Backend Changes

```bash
# Run API integration tests
./scripts/test-api.sh

# Or manually test with curl (use actual password) <!-- pragma: allowlist secret -->
curl -X POST http://localhost:8080/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}'  # pragma: allowlist secret
```

## See Also

- [Frontend Scripts](../frontend/scripts/README.md) - Frontend development scripts
- [Backend Scripts](../backend/scripts/README.md) - Backend development scripts
- [Development Setup](../docs/DEVELOPMENT_SETUP.md) - Complete dev environment guide
- [API Test Results](../docs/reports/API_TEST_RESULTS.md) - Latest API test documentation
