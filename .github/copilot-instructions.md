<!-- Workspace Copilot Instructions -->

# Project: Photography Portfolio & Gallery Website

## Core Architecture Philosophy
- **Hybrid Static/Dynamic**: Static files for visitor speed, dynamic Go backend for admin ease
- **No Traditional Database**: JSON files (`albums.json`, `site_config.json`) are the data store
- **Bazel as Orchestrator**: Wraps npm/vite and go build tools (not a replacement)
- **Pre-commit Hooks**: Local quality checks (linting, formatting, type-checking) - no cloud CI

## Tech Stack
- **Frontend**: TypeScript + Lit (~5KB web components), Vite for HMR
- **Backend**: Go (admin server that modifies JSON files)
- **Build**: Bazel orchestrates npm and go build tools
- **Data**: JSON files in `public/data/` directory
- **Testing**: Pre-commit hooks + manual E2E checklist (MVP), comprehensive suite in Phase 8

## MVP Critical Path (Phases 1-5, 7)
Focus on getting albums working with admin interface first. Skip:
- Blog (Phase 8)
- Analytics dashboard (Phase 8)
- Download-as-ZIP (Phase 8)
- Multiple admin users
- Client-side bcrypt password verification

## Key Files
- `IMPLEMENTATION_PLAN.md`: Complete implementation guide (3,917 lines, simplified for MVP focus)
- `docs/DEVELOPMENT_SETUP.md`: Detailed tool configurations (pre-commit, ESLint, golangci-lint)
- `docs/SIMPLIFICATION_COMPLETE.md`: Record of 33% reduction (5,862 → 3,917 lines)
- `agents.md`: Agent roles and capabilities for experiments
- `plan.md`: Iterative planning document

## Development Commands
```bash
# Setup (one-time)
brew install pre-commit bazel
pre-commit install
./scripts/bootstrap.sh

# Daily development
cd frontend && npm run dev              # localhost:5173
cd backend && go run cmd/admin/main.go  # localhost:8080

# Pre-commit hooks run automatically on commit
git add . && git commit -m "feat: change"
```

## Coding Principles
1. Keep static files pure (no server-side rendering for public pages)
2. Admin backend modifies JSON files atomically
3. MVP first - defer advanced features to Phase 8
4. Follow Quick Start guide at top of IMPLEMENTATION_PLAN.md
5. Use conventional commits (feat:, fix:, docs:, refactor:, test:)

## When Making Changes
- Always check Quick Start section in IMPLEMENTATION_PLAN.md for MVP priorities
- Reference docs/DEVELOPMENT_SETUP.md for tool configuration details
- Keep advanced features (blog, analytics, downloads) in Phase 8
- Update agents.md if adding new agent capabilities or roles
