# Backend Scripts

Organized scripts for backend development tasks.

## Available Scripts

### Development

- **`start-backend.sh`** - Start admin server in background

  ```bash
  ./backend/scripts/start-backend.sh
  ```

  Starts the server on port 8080, logs to `backend/.server.log`, and saves PID to `backend/.server.pid`.

- **`stop-backend.sh`** - Stop running admin server

  ```bash
  ./backend/scripts/stop-backend.sh
  ```

  Gracefully stops the server and cleans up any orphaned processes.

### Building

- **`build.sh`** - Build the admin server binary

  ```bash
  ./backend/scripts/build.sh
  ```

  Creates binary at `backend/bin/admin`

### Testing

- **`test.sh`** - Run all Go unit tests

  ```bash
  ./backend/scripts/test.sh
  ```

- **`test-coverage.sh`** - Run tests with coverage report

  ```bash
  ./backend/scripts/test-coverage.sh
  ```

  Generates `coverage.html` for viewing results.

### Code Quality

- **`fmt.sh`** - Format Go code with gofmt

  ```bash
  ./backend/scripts/fmt.sh
  ```

- **`lint.sh`** - Lint Go code with golangci-lint

  ```bash
  ./backend/scripts/lint.sh
  ```

  Requires golangci-lint: `brew install golangci-lint`

- **`tidy.sh`** - Tidy go.mod dependencies

  ```bash
  ./backend/scripts/tidy.sh
  ```

## Direct Go Commands

Scripts are thin wrappers around standard Go commands. You can also run them directly:

```bash
cd backend
go run ./cmd/admin           # Run server
go build -o bin/admin ./cmd/admin  # Build binary
go test ./...                # Run tests
go test -cover ./...         # Run with coverage
gofmt -w .                   # Format code
go mod tidy                  # Tidy dependencies
```
