# Bazel Quick Reference

## Most Common Commands

```bash
# 🚀 Development
bazel run //frontend:dev          # Frontend dev server (http://localhost:5173)
bazel run //backend:dev           # Backend dev server (http://localhost:8080)

# 🧪 Testing
bazel test //:test-all            # Run all tests
bazel test //frontend:test        # Frontend tests only
bazel test //backend:test         # Backend tests only
bazel run //frontend:test-watch   # Watch mode

# 🏗️  Building
bazel build //:build-all          # Build everything
bazel build //backend:server      # Backend binary only
bazel run //frontend:build        # Frontend production build

# ✨ Code Quality
bazel test //:lint                # Run all linters
bazel test //:typecheck           # TypeScript type-check
bazel run //:format               # Format all code

# 🛠️  Utilities
bazel run //:bootstrap            # Initialize project
bazel run //:test-api             # API integration tests
bazel query //...                 # List all targets
```

## Target Patterns

| Pattern          | Description                         |
| ---------------- | ----------------------------------- |
| `//frontend:dev` | Specific target in frontend package |
| `//backend:test` | Specific target in backend package  |
| `//:test-all`    | Target in root package              |
| `//...`          | All targets in workspace            |
| `//frontend:*`   | All targets in frontend package     |

## Build Modes

```bash
--config=dev      # Fast development builds
--config=prod     # Optimized production builds
--config=ci       # CI/CD builds (strict, reproducible)
--config=debug    # Debug builds with symbols
```

## Without Bazel (Direct Commands)

All Bazel commands have equivalent direct commands:

```bash
# Frontend
cd frontend
npm run dev
npm run test
npm run build

# Backend
cd backend
go run cmd/admin/main.go
go test ./...
go build -o server cmd/admin/main.go
```

## Getting Help

```bash
bazel help                    # General help
bazel help run                # Help for specific command
bazel query --help            # Query command help
```

## See Also

- Full guide: [docs/BAZEL_SETUP.md](./BAZEL_SETUP.md)
- Development setup: [docs/DEVELOPMENT_SETUP.md](./DEVELOPMENT_SETUP.md)
- MVP Plan: [docs/plan/PLAN_MVP.md](./plan/PLAN_MVP.md)
