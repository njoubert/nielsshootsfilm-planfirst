# Backend Scripts

Organized scripts for backend development tasks.

## Available Scripts

### Development

- **`dev.sh`** - Run admin server with auto-reload on file changes

  ```bash
  ./backend/scripts/dev.sh
  ```

  Uses the `scripts/start-backend.sh` wrapper for automatic reloading.

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
