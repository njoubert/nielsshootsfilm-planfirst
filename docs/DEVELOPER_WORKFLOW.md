# Developer Workflow Quick Reference

## First-Time Setup

### 1. Install Prerequisites

```bash
# macOS (using Homebrew)
brew install pre-commit python go node bazel

# Or install individually:
# - Python 3.11+ (for pre-commit)
# - Go 1.21+ (for backend)
# - Node.js 18+ (for frontend)
# - Bazel (for build orchestration)
```

### 2. Clone Repository

```bash
git clone <repo-url>
cd nielsshootsfilm-planfirst
```

### 3. Install Pre-commit Hooks

```bash
pre-commit install
```

### 4. Install Dependencies

```bash
# Frontend dependencies
cd frontend
npm install

# Backend dependencies
cd ../backend
go mod download

cd ..
```

### 5. Setup Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values
# At minimum, change ADMIN_PASSWORD
```

### 6. Initialize Data Files (TODO: Phase 2)

```bash
# This will create data/ directory structure and initial JSON files
# Script to be created in Phase 2
./scripts/bootstrap.sh
```

---

## Daily Development

### Start Development Servers

**Option 1: Separate terminals**

```bash
# Terminal 1 - Frontend dev server (with HMR)
cd frontend && npm run dev

# Terminal 2 - Backend admin server
cd backend && go run cmd/admin/main.go
```

**Option 2: VS Code Launch Configuration**

1. Open Command Palette (Cmd/Ctrl+Shift+P)
2. Select "Debug: Select and Start Debugging"
3. Choose "Full Stack" compound configuration
4. This starts both frontend and backend servers with debugging enabled

### Access

- **Frontend**: <http://localhost:5173>
- **Backend API**: <http://localhost:8080>

---

## Code Quality Checks

### Before Committing (Automated)

Pre-commit hooks run automatically on `git commit`:

- ✅ Format code (Prettier, gofmt)
- ✅ Lint code (ESLint, golangci-lint)
- ✅ Type check TypeScript
- ✅ Check for secrets
- ✅ Validate JSON/YAML files
- ✅ Fix trailing whitespace, end-of-file issues

### Manual Checks

```bash
# Frontend
cd frontend
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint issues
npm run format        # Format with Prettier
npm run format:check  # Check formatting
npm run typecheck     # TypeScript type checking
npm run test          # Run tests in watch mode
npm run test:ci       # Run tests once

# Backend
cd backend
golangci-lint run     # Run all Go linters
golangci-lint run --fix  # Fix auto-fixable issues
go fmt ./...          # Format Go code
go vet ./...          # Run go vet
go test ./...         # Run all tests
```

## Testing

### Frontend Tests

```bash
cd frontend

# Run in watch mode (during development)
npm run test

# Run once (for CI/pre-commit)
npm run test:ci

# Run with UI
npm run test:ui

# Run specific test file
npm run test src/components/photo-grid.test.ts
```

### Backend Tests

```bash
cd backend

# Run all tests
go test ./...

# Run with coverage
go test -cover ./...

# Run specific package
go test ./internal/services

# Run short tests only (skip integration tests)
go test -short ./...

# Verbose output
go test -v ./...
```

---

## Building

### Frontend Production Build

```bash
cd frontend
npm run build

# Output in: frontend/dist/
```

### Backend Production Build

```bash
cd backend
go build -o bin/admin cmd/admin/main.go

# Output: backend/bin/admin
```

### Full Project Build with Bazel (TODO)

```bash
bazel build //...
```

---

## VS Code Integration

### Recommended Extensions

Install recommended extensions when prompted, or manually:

1. Open Extensions view (Cmd/Ctrl+Shift+X)
2. Type `@recommended`
3. Install all workspace recommendations

### Keyboard Shortcuts

- **Format Document**: Shift+Alt+F
- **Fix ESLint Issues**: Cmd/Ctrl+.
- **Run Task**: Cmd/Ctrl+Shift+B
- **Debug**: F5

### Settings Sync

VS Code settings are committed to `.vscode/settings.json`. Changes you make to workspace settings will be shared with the team.

---
