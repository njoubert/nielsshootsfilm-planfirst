# API Test Results

**Date**: October 20, 2025
**Status**: ✅ All tests passing (13/13)

## Test Infrastructure

### Server Management Scripts

1. **`scripts/start-backend.sh`** - Start the backend server in the background

   - Validates environment configuration
   - Starts server with proper process management (PID tracking)
   - Logs to `backend/.server.log`
   - Verifies successful startup

2. **`scripts/stop-backend.sh`** - Stop the backend server gracefully

   - Uses PID file for process management
   - Graceful shutdown with fallback to force-kill
   - Cleanup of PID file

3. **`scripts/test-api.sh`** - Comprehensive API test suite
   - 13 automated tests covering all major endpoints
   - Cookie-based session management
   - Color-coded output (green/red/yellow)
   - Pass/fail tracking with summary

## API Endpoints Tested

### Public Endpoints (No Authentication Required)

| Endpoint          | Method | Status  | Description                            |
| ----------------- | ------ | ------- | -------------------------------------- |
| `/healthz`        | GET    | ✅ PASS | Health check returns `{"status":"ok"}` |
| `/api/albums`     | GET    | ✅ PASS | Returns list of albums                 |
| `/api/config`     | GET    | ✅ PASS | Returns site configuration             |
| `/api/albums/:id` | GET    | ✅ PASS | Returns single album by ID             |

### Admin Endpoints (Authentication Required)

| Endpoint                | Method | Status  | Description                                   |
| ----------------------- | ------ | ------- | --------------------------------------------- |
| `/api/admin/login`      | POST   | ✅ PASS | Authenticates admin user, sets session cookie |
| `/api/admin/logout`     | POST   | ✅ PASS | Invalidates session, clears cookie            |
| `/api/admin/albums`     | POST   | ✅ PASS | Creates new album (requires auth)             |
| `/api/admin/albums/:id` | PUT    | ✅ PASS | Updates existing album (requires auth)        |
| `/api/admin/albums/:id` | DELETE | ✅ PASS | Deletes album (requires auth)                 |

### Authentication & Authorization Tests

| Test                 | Status  | Description                                                |
| -------------------- | ------- | ---------------------------------------------------------- |
| Unauthorized access  | ✅ PASS | Returns 401 when accessing protected endpoint without auth |
| Session invalidation | ✅ PASS | Session cookie invalidated after logout                    |

## Test Execution

### Prerequisites

1. Backend server must have valid `.env` file with:

   ```bash
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD_HASH='$2a$10$VPqUwu5tQ8xAsqdRFgzibeVQVewjXsBkKuhJClOVqpeGflWYwLZKm'
   DATA_DIR=../data
   UPLOAD_DIR=../static/uploads
   PORT=8080
   ```

   **Note**: The password hash must be single-quoted to prevent shell variable expansion.

2. Test credentials:
   - Username: `admin`
   - Password: `test123` <!-- pragma: allowlist secret -->

### Running the Tests

```bash
# Start the backend server
./scripts/start-backend.sh

# Run the test suite
./scripts/test-api.sh

# Stop the backend server
./scripts/stop-backend.sh
```

### Current Test Coverage

**All 13 tests passing:**

1. ✅ Server availability check
2. ✅ Health endpoint (`/healthz`)
3. ✅ Public albums list (`GET /api/albums`)
4. ✅ Public site config (`GET /api/config`)
5. ✅ Unauthorized access handling (401 without auth)
6. ✅ Admin login (`POST /api/admin/login`)
7. ✅ Verify album list after login
8. ✅ Create album (`POST /api/admin/albums`)
9. ✅ Get album by ID (`GET /api/albums/:id`)
10. ✅ Update album (`PUT /api/admin/albums/:id`)
11. ✅ Delete album (`DELETE /api/admin/albums/:id`)
12. ✅ Admin logout (`POST /api/admin/logout`)
13. ✅ Session invalidation verification

## Issues Discovered & Fixed

### 1. Password Hash Shell Variable Expansion

**Problem**: The bcrypt hash `$2a$10$...` was being interpreted as shell variables, truncating to just "a".

**Solution**: Added single quotes around the hash in `.env`:

```bash
ADMIN_PASSWORD_HASH='$2a$10$VPqUwu5tQ8xAsqdRFgzibeVQVewjXsBkKuhJClOVqpeGflWYwLZKm'
```

### 2. HTTP Status Code Extraction

**Problem**: Using `curl -w "\n%{http_code}"` produced malformed codes like "405000".

**Solution**: Changed to `curl -w "%{http_code}" -o /dev/null` for proper extraction.

### 3. Album Update Validation

**Problem**: Partial updates failed validation because required fields (slug, photos) were missing.

**Solution**: Modified test to fetch current album data, update specific fields, then send complete album object.

### 4. Non-existent Admin GET Endpoints

**Problem**: Tests tried to access `GET /api/admin/albums` which doesn't exist (405 Method Not Allowed).

**Solution**: Updated tests to use public endpoints (`GET /api/albums`) which work for both authenticated and unauthenticated users.

## API Design Notes

### Album CRUD Pattern

The API uses a split design:

- **Read operations**: Public endpoints `/api/albums` and `/api/albums/:id` (no auth required for public albums)
- **Write operations**: Admin endpoints `/api/admin/albums` (auth required)

This allows:

- Frontend to use public endpoints for displaying albums
- Admin panel to use authenticated endpoints for modifications
- Simpler permission model (read=public, write=admin)

### Session Management

- Sessions use HTTP-only cookies named `photoadmin_session`
- 24-hour session TTL (configurable)
- Sessions extended on each validated request
- Automatic cleanup of expired sessions (hourly)

### Update Semantics

Album updates require the complete album object (not partial updates):

- Preserves `id`, `created_at` timestamps
- Updates `updated_at` automatically
- Validates all required fields (title, slug, visibility)
- Maintains photo array and other nested data

## Next Steps (Phase 8)

Features not yet tested (deferred to Phase 8):

1. **Photo upload endpoints**

   - `POST /api/admin/albums/:id/photos/upload`
   - `DELETE /api/admin/albums/:id/photos/:photoId`

2. **Album password protection**

   - `POST /api/admin/albums/:id/set-password`
   - `DELETE /api/admin/albums/:id/password`

3. **Cover photo management**

   - `POST /api/admin/albums/:id/set-cover`

4. **Site configuration updates**

   - `PUT /api/admin/config`
   - `PUT /api/admin/config/main-portfolio-album`

5. **Password change**
   - `POST /api/admin/change-password`

## Testing Tools Used

- **curl 8.7.1** - HTTP client for API requests
- **jq 1.7.1-apple** - JSON parsing and manipulation
- **bash** - Test automation scripting

## Test Suite Maintenance

The test suite is designed to be:

- **Idempotent**: Can be run multiple times safely
- **Self-contained**: Creates and cleans up test data
- **Informative**: Clear pass/fail indicators with detailed error messages
- **Fast**: Completes in under 5 seconds

To update tests:

1. Edit `scripts/test-api.sh`
2. Add new test functions following existing pattern
3. Add test call to main execution block
4. Update this documentation
