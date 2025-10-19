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



## Coding Principles
1. Keep static files pure (no server-side rendering for public pages)
2. Admin backend modifies JSON files atomically
3. MVP first - defer advanced features to Phase 8
4. Follow Quick Start guide at top of IMPLEMENTATION_PLAN.md
5. Use conventional commits (feat:, fix:, docs:, refactor:, test:)

## When Making Changes
- Always check the docs/MVP_PLAN.md for MVP priorities
- Reference docs/DEVELOPMENT_SETUP.md for tool configuration details