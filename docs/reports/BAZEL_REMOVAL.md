# Bazel Removal & Script-Based Workflow Migration

**Date:** October 20, 2025
**Status:** Complete ✅

## Summary

Successfully removed Bazel build system and migrated to a simple script-based workflow. This aligns with the project's philosophy of "minimum necessary work" and "simple over complex" for a single-developer project.

## Changes Made

### 1. Removed Bazel Configuration

Deleted all Bazel-related files:

- `WORKSPACE` - Bazel workspace configuration
- `.bazelrc` - Bazel build settings
- All `BUILD.bazel` files (12 files total)
  - Root, frontend, backend, data, static, testdata, e2e
  - Backend internal packages (handlers, models, services)

### 2. Removed Bazel Documentation

Deleted comprehensive Bazel documentation:

- `docs/BAZEL_SETUP.md` (full guide)
- `docs/BAZEL_CHEATSHEET.md` (quick reference)
- `docs/reports/PHASE_5_BAZEL_COMPLETE.md` (implementation report)
- `docs/reports/PROVISION_SCRIPT_COMPLETE.md` (provision script docs)

**Total removed:** ~1,900+ lines of Bazel configuration and documentation

### 3. Created Organized Script Directories

**Frontend scripts** (`frontend/scripts/`):

- `dev.sh` - Vite development server
- `build.sh` - Production build
- `test.sh` - Run tests (CI mode)
- `test-watch.sh` - Run tests (watch mode)
- `typecheck.sh` - TypeScript type checking
- `lint.sh` - ESLint
- `format.sh` - Prettier formatting
- `README.md` - Documentation

**Backend scripts** (`backend/scripts/`):

- `dev.sh` - Admin server with auto-reload
- `build.sh` - Build binary
- `test.sh` - Run Go tests
- `test-coverage.sh` - Tests with coverage
- `fmt.sh` - gofmt formatting
- `lint.sh` - golangci-lint
- `tidy.sh` - go mod tidy
- `README.md` - Documentation

All scripts are executable and include clear error handling.

### 4. Updated Root-Level Scripts

- `dev.sh` - Now calls `./backend/scripts/dev.sh` directly
- `format.sh` - Calls frontend and backend format scripts

### 5. Updated Documentation

**README.md:**

- Removed all Bazel references
- Updated "Tech Stack" section
- Removed "Phase 5: Bazel Build System Integration"
- Updated Quick Start with script-based workflow
- Updated all command examples
- Added links to new script directories

**provision.sh:**

- Removed `install_bazel()` function
- Removed Bazel from dependency list
- Removed Bazel from verification checks
- Updated "Next Steps" to use scripts instead of Bazel commands

## Rationale

Bazel was **overkill** for this project because:

1. **Single developer** - No need for hermetic builds or distributed build caching
2. **Simple stack** - npm for frontend, go for backend - both have excellent tooling
3. **Unnecessary complexity** - Bazel added 1,900+ lines of configuration for minimal benefit
4. **Cognitive overhead** - Learning Bazel syntax, debugging Bazel issues
5. **Against project philosophy** - "Minimum necessary work", "Simple over complex"

## Benefits of Script-Based Approach

✅ **Transparent** - Shell scripts are easy to read and understand
✅ **Simple** - Wraps existing npm/go commands directly
✅ **Organized** - Scripts grouped by area (frontend/backend)
✅ **Familiar** - Uses standard tools (npm, go) everyone knows
✅ **Fast iteration** - No build system in the way
✅ **Easy to maintain** - Scripts are self-documenting

## Migration Path

Scripts maintain the same interface as Bazel targets:

| Bazel Command                 | Script Command                |
| ----------------------------- | ----------------------------- |
| `bazel run //frontend:dev`    | `./frontend/scripts/dev.sh`   |
| `bazel run //backend:dev`     | `./backend/scripts/dev.sh`    |
| `bazel test //frontend:test`  | `./frontend/scripts/test.sh`  |
| `bazel test //backend:test`   | `./backend/scripts/test.sh`   |
| `bazel run //:format`         | `./format.sh`                 |
| `bazel build //frontend:dist` | `./frontend/scripts/build.sh` |
| `bazel run //backend:server`  | `./backend/scripts/build.sh`  |

## Verification

All scripts tested and working:

- ✅ Frontend dev server starts correctly
- ✅ Backend dev server starts correctly
- ✅ Tests run (frontend and backend)
- ✅ Formatting works
- ✅ Linting works
- ✅ Builds complete successfully
- ✅ Pre-commit hooks still function

## Next Steps

1. ~~Remove Bazel from CI/CD pipelines~~ (N/A - no CI/CD yet)
2. ~~Update any external documentation~~ (None exists)
3. Continue with Phase 5.5: Manual Browser Testing

## Commits

- `c0ccc38` - refactor: Remove Bazel, replace with simple script-based workflow
- `fbf76fa` - docs: Add README files for frontend and backend scripts directories

## Conclusion

The project is now simpler, more maintainable, and better aligned with its core philosophy. Bazel was an interesting experiment but ultimately added unnecessary complexity for a single-developer project.

**Lines of code saved:** ~1,900+
**Complexity reduced:** Significant
**Developer experience:** Improved (more straightforward)
