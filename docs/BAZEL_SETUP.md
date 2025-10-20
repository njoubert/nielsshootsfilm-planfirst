# Bazel Setup Guide

## What is Bazel?

Bazel is a build orchestration system that provides a **unified interface** for all build, test, and run commands across our polyglot codebase (Go + TypeScript). It doesn't replace tools like npm or go - instead, it wraps and coordinates them.

### Benefits

- **Single command interface**: `bazel run`, `bazel build`, `bazel test` work for both frontend and backend
- **Reproducible builds**: Hermetic builds with explicit dependencies
- **Incremental compilation**: Only rebuilds what changed
- **Parallel execution**: Automatically parallelizes independent tasks
- **Caching**: Local and remote caching for faster builds

## Installation

### macOS

```bash
# Using Homebrew (recommended)
brew install bazel

# Or using Bazelisk (version manager for Bazel)
brew install bazelisk

# Verify installation
bazel version
```

### Linux

```bash
# Using Bazelisk (recommended - manages Bazel versions)
npm install -g @bazel/bazelisk

# Or download binary directly
wget https://github.com/bazelbuild/bazel/releases/download/6.4.0/bazel-6.4.0-linux-x86_64
chmod +x bazel-6.4.0-linux-x86_64
sudo mv bazel-6.4.0-linux-x86_64 /usr/local/bin/bazel

# Verify installation
bazel version
```

### Alternative: Use without installing Bazel

If you don't want to install Bazel globally, you can still use all the underlying commands directly:

**Frontend**:

```bash
cd frontend
npm run dev        # Instead of: bazel run //frontend:dev
npm run test       # Instead of: bazel test //frontend:test
npm run build      # Instead of: bazel build //frontend:build
```

**Backend**:

```bash
cd backend
go run cmd/admin/main.go  # Instead of: bazel run //backend:server
go test ./...             # Instead of: bazel test //backend:test
```

## Bazel Command Reference

### Development Servers

```bash
# Run frontend dev server (Vite with HMR)
bazel run //frontend:dev
# Equivalent: cd frontend && npm run dev

# Run backend dev server (with hot-reload)
bazel run //backend:dev
# Equivalent: ./scripts/start-backend.sh

# Run both (sequentially - use separate terminals for parallel)
bazel run //:dev

# Aliases for convenience
bazel run //:dev-frontend
bazel run //:dev-backend
```

### Testing

```bash
# Run all tests (frontend + backend)
bazel test //:test-all

# Run frontend tests only
bazel test //frontend:test
# Equivalent: cd frontend && npm run test -- --run

# Run backend tests only
bazel test //backend:test
# Equivalent: cd backend && go test ./...

# Run tests in watch mode (development)
bazel run //frontend:test-watch
# Equivalent: cd frontend && npm run test

# Run with coverage
bazel run //backend:test-coverage
```

### Building

```bash
# Build everything for production
bazel build //:build-all

# Build backend server binary
bazel build //backend:server
# Output: bazel-bin/backend/server_/server

# Build frontend for production
bazel run //frontend:build
# Equivalent: cd frontend && npm run build
```

### Code Quality

```bash
# Run all linters
bazel test //:lint

# Lint frontend only
bazel test //frontend:lint
# Equivalent: cd frontend && npm run lint

# Lint backend only
bazel test //backend:lint
# Equivalent: cd backend && golangci-lint run

# Type-check TypeScript
bazel test //:typecheck
# Equivalent: cd frontend && npm run typecheck

# Format all code
bazel run //:format
# Runs prettier (frontend) and gofmt (backend)

# Format frontend only
bazel run //frontend:format

# Format backend only
bazel run //backend:fmt
```

### Utilities

```bash
# Bootstrap project (initialize data files, set admin password)
bazel run //:bootstrap
# Equivalent: ./scripts/bootstrap.sh

# Hash a password
bazel run //:hash-password
# Equivalent: go run scripts/hash_password.go

# Run API integration tests
bazel run //:test-api
# Equivalent: ./scripts/test-api.sh

# Download sample test images
bazel run //:download-sample-images
```

### CI/CD

```bash
# Run all CI checks (tests + lints + typecheck)
bazel test //:ci

# Run pre-commit checks (faster subset)
bazel test //:pre-commit
```

### Query and Info

```bash
# List all available targets
bazel query //...

# List all test targets
bazel query 'tests(//...)'

# Show dependency graph for a target
bazel query --output=graph //backend:server

# Show build configuration
bazel info

# Clean build artifacts
bazel clean
```

## Configuration

### .bazelrc

Configuration options for Bazel builds. We have several build modes:

```bash
# Development mode (fast, unoptimized)
bazel build --config=dev //backend:server

# Production mode (optimized)
bazel build --config=prod //backend:server

# CI mode (reproducible, strict)
bazel test --config=ci //:test-all

# Debug mode (with debug symbols)
bazel build --config=debug //backend:server
```

### User-specific Configuration

Create `.bazelrc.user` (gitignored) for personal settings:

```bash
# Example .bazelrc.user
build --disk_cache=~/.cache/bazel
build --jobs=8
```

## Typical Workflows

### Daily Development

```bash
# Terminal 1: Frontend dev server
bazel run //frontend:dev

# Terminal 2: Backend dev server
bazel run //backend:dev

# Terminal 3: Run tests on changes
bazel run //frontend:test-watch
```

### Before Committing

```bash
# Run linters and type-check
bazel test //:pre-commit

# Or let pre-commit hooks handle it automatically
git commit -m "feat: add new feature"
```

### Creating a Release Build

```bash
# Build everything
bazel build --config=prod //:build-all

# Run all tests
bazel test --config=ci //:test-all

# Backend binary location
./bazel-bin/backend/server_/server

# Frontend build output
./frontend/dist/
```

## Troubleshooting

### "bazel: command not found"

Install Bazel following the instructions above, or use the direct commands (npm/go).

### Build fails with "No such file or directory"

```bash
# Clean and rebuild
bazel clean
bazel build //:build-all
```

### Tests fail in Bazel but pass with npm/go

Bazel uses a sandbox for hermetic builds. Ensure all dependencies are declared in BUILD.bazel files.

### Slow builds

```bash
# Enable disk cache
echo "build --disk_cache=~/.cache/bazel" >> .bazelrc.user

# Limit parallel jobs if machine is slow
echo "build --jobs=4" >> .bazelrc.user
```

### Want to see verbose output

```bash
# Use verbose config
bazel build --config=verbose //backend:server

# Or show all command output
bazel build --subcommands //backend:server
```

## Migration from Direct Commands

If you're used to running commands directly, here's the mapping:

| Old Command                                | New Bazel Command              | Status   |
| ------------------------------------------ | ------------------------------ | -------- |
| `cd frontend && npm run dev`               | `bazel run //frontend:dev`     | ✅ Ready |
| `cd frontend && npm run test`              | `bazel test //frontend:test`   | ✅ Ready |
| `cd frontend && npm run build`             | `bazel run //frontend:build`   | ✅ Ready |
| `./scripts/start-backend.sh`               | `bazel run //backend:dev`      | ✅ Ready |
| `cd backend && go test ./...`              | `bazel test //backend:test`    | ✅ Ready |
| `cd backend && go build cmd/admin/main.go` | `bazel build //backend:server` | ✅ Ready |
| `./scripts/test-api.sh`                    | `bazel run //:test-api`        | ✅ Ready |
| `./scripts/bootstrap.sh`                   | `bazel run //:bootstrap`       | ✅ Ready |

**You can still use the old commands!** Bazel just provides a unified interface.

## Further Reading

- [Bazel Documentation](https://bazel.build/)
- [rules_go Documentation](https://github.com/bazelbuild/rules_go)
- [rules_nodejs Documentation](https://github.com/bazelbuild/rules_nodejs)
- [Bazel Best Practices](https://bazel.build/concepts/build-files)

## Summary

**Bazel installed**: Use `bazel run`, `bazel test`, `bazel build` commands
**Bazel not installed**: Use the direct npm/go commands (everything still works!)
**Recommendation**: Install Bazel for a better developer experience, but it's optional.
