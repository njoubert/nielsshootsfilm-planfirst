# Agents

This file defines agent roles and capabilities for the photography portfolio project.

## Architecture Context

This is a **hybrid static/dynamic photography portfolio**:
- **Public site**: Pure static files (HTML/CSS/JS/JSON) for blazing speed
- **Admin backend**: Go server that modifies JSON data files
- **No database**: `albums.json` and `site_config.json` are the data store
- **Bazel**: Orchestrates npm (frontend) and go build (backend) tools

## Agent Definitions

### Implementation Agent
- **Role**: Executes implementation plan phases, writes code
- **Capabilities**:
  - Create/edit TypeScript (frontend) and Go (backend) code
  - Set up Bazel BUILD files and workspace configuration
  - Implement JSON schemas and data models
  - Follow IMPLEMENTATION_PLAN.md phases sequentially
  - Run pre-commit hooks and validate changes
- **Constraints**:
  - Must prioritize MVP (Phases 1-5, 7) over Phase 8 advanced features
  - Must maintain static/dynamic separation (no SSR for public pages)
  - Must ensure JSON file atomic writes in backend

### Review Agent
- **Role**: Reviews code for architecture compliance, identifies redundancies
- **Capabilities**:
  - Analyze code against core philosophy (static public, dynamic admin)
  - Check for violations of MVP scope (blog, analytics, ZIP downloads)
  - Identify redundant testing, configuration, or documentation
  - Suggest simplifications and consolidations
  - Validate conventional commit messages
- **Constraints**:
  - Must preserve advanced features in Phase 8 (not delete them)
  - Must check docs/DEVELOPMENT_SETUP.md for detailed configs before flagging missing info

### Testing Agent
- **Role**: Ensures code quality through local checks
- **Capabilities**:
  - Configure and run pre-commit hooks (prettier, ESLint, gofmt, golangci-lint)
  - Execute manual E2E testing checklist (MVP approach)
  - Validate JSON schema compliance
  - Check for broken links and missing assets
  - Test password protection and album visibility rules
- **Constraints**:
  - Focus on pre-commit hooks + manual E2E for MVP
  - Defer comprehensive automated test suite to Phase 8
  - No cloud CI/CD (GitHub Actions) - all checks run locally

### Documentation Agent
- **Role**: Maintains clear, up-to-date documentation
- **Capabilities**:
  - Update IMPLEMENTATION_PLAN.md with progress
  - Keep Quick Start guide accurate and minimal
  - Document architecture decisions and trade-offs
  - Update agents.md and plan.md as project evolves
  - Create migration guides for breaking changes
- **Constraints**:
  - Must keep documentation focused on MVP path
  - Must clearly mark Phase 8 advanced features
  - Must extract detailed configs to docs/ appendix (not in main plan)

### Deployment Agent
- **Role**: Handles building, packaging, and deployment
- **Capabilities**:
  - Run release build scripts (Bazel build)
  - Create tarball releases with version numbers
  - Deploy static files to web server (nginx/Apache)
  - Set up systemd service for Go admin backend
  - Configure nginx reverse proxy for admin backend
  - Handle zero-downtime deployments
- **Constraints**:
  - Must ensure static files are completely decoupled from backend
  - Must validate JSON files before deploying
  - Must follow deployment checklist in Phase 7

## Interaction Patterns

**Sequential Implementation**:
1. Implementation Agent builds feature following IMPLEMENTATION_PLAN.md
2. Testing Agent validates with pre-commit hooks and manual E2E
3. Review Agent checks for architecture compliance
4. Documentation Agent updates relevant docs
5. Deployment Agent packages and deploys (Phase 7)

**Feedback Loops**:
- Review Agent can pause Implementation Agent if scope creeps to Phase 8
- Testing Agent can request Implementation Agent fixes
- Documentation Agent prompts updates after major changes

## Key Principles for All Agents

1. **MVP Focus**: Phases 1-5 and 7 first; Phase 8 is advanced features
2. **Static/Dynamic Separation**: Public pages = static, admin = dynamic Go server
3. **JSON as Database**: Atomic writes, schema validation, no SQL
4. **Local-First Testing**: Pre-commit hooks + manual E2E (no cloud CI for MVP)
5. **Bazel Orchestrates**: Wraps npm/vite and go build (doesn't replace them)
6. **Quick Start Guide**: Always check top of IMPLEMENTATION_PLAN.md for priorities

## Current Focus (as of October 2025)

All simplification work completed:
- ✅ Implementation plan reduced 33% (5,862 → 3,917 lines)
- ✅ Tool configs moved to docs/DEVELOPMENT_SETUP.md
- ✅ Testing simplified to pre-commit + manual E2E
- ✅ Blog, analytics, downloads marked as Phase 8
- ✅ Quick Start guide added showing critical MVP path

**Next Steps**: Begin Phase 1 implementation (project setup, Bazel workspace, repository structure)
