<!-- Workspace Copilot Instructions -->

# Project: Photography Portfolio & Gallery Website

## Core Architecture Philosophy

- **Hybrid Static/Dynamic**: Static files for visitor speed, dynamic Go backend for admin ease
- **No Traditional Database**: JSON files (`albums.json`, `site_config.json`) are the data store
- **Custom scripts as Orchestrator**: Wraps npm/vite and go build tools (not a replacement)
- **Pre-commit Hooks**: Local quality checks (linting, formatting, type-checking) - no cloud CI

## Tech Stack

- **Frontend**: TypeScript + Lit (~5KB web components), Vite for HMR
- **Backend**: Go (admin server that modifies JSON files)
- **Build**: Custom scripts orchestrates npm and go build tools
- **Data**: JSON files in `data/` directory
- **Static Files**: Kept in the `static/` directory, served directly to visitors
- **Testing**: Pre-commit hooks + manual E2E checklist (MVP).

## Project Scripts - USE THESE

**Always prefer these root-level scripts over running npm, vite, npx, or go commands directly.**

- **`./dev.sh`** - Start/stop development servers

  - `./dev.sh` - Restart both frontend and backend
  - `./dev.sh start` - Start both servers
  - `./dev.sh stop` - Stop both servers
  - `./dev.sh status` - Check status of both servers
  - `./dev.sh frontend start` - Start only frontend
  - `./dev.sh frontend stop` - Stop only frontend
  - `./dev.sh frontend status` - Check frontend status
  - `./dev.sh backend start` - Start only backend
  - `./dev.sh backend stop` - Stop only backend
  - `./dev.sh backend status` - Check backend status

  **Status checks**: The status commands check if processes are running AND if they're responding to HTTP requests. Returns clear indicators: ✓ (running), ⚠ (running but not responding), or ✗ (not running).

- **`./test.sh`** - Run tests (intelligently dispatches to npm or go)

  - `./test.sh` - Run all unit tests (backend and frontend)
  - `./test.sh backend` - Run all backend unit tests only
  - `./test.sh frontend` - Run all frontend unit tests only
  - `./test.sh api` - Run API integration tests and schema validation
  - `./test.sh -- backend/...` - Run all backend tests
  - `./test.sh -- backend/internal/handlers` - Run specific backend package tests
  - `./test.sh -- storage-stats.test.ts` - Run specific frontend test file
  - `./test.sh -- frontend/src/components/storage-stats.test.ts` - Run frontend test with full path
  - The `--` separator is optional: `./test.sh backend/...` works too
  - Use this instead of `npm test` or `go test`
  - Automatically detects test type from file path (backend vs frontend)
  - Exits automatically after tests complete (no manual intervention needed)
  - Provides colored output for easy scanning

- **`./format.sh`** - Format all code (runs prettier, gofmt, etc.)

  - Use this instead of `npm run format` or `go fmt`

- **`./build.sh`** - Compile code for distribution

  - Use this instead of `npm run build` or `go build`

- **`./bootstrap.sh`** - Create environmental files for the app

  - Sets up data files and admin credentials for first-time setup

- **`./provision.sh`** - Provision developer workstation
  - Installs all dependencies (Node.js, Go, libvips, shellcheck, etc.)
  - Run this on a new machine or after cloning the repository

**Why use these scripts?**

- They handle both frontend and backend consistently
- They ensure proper working directories and error handling
- They follow project conventions and best practices
- They're tested and maintained as part of the project
- The test script intelligently detects test type from file path (no need to specify backend vs frontend)

## Coding Principles

1. Keep static files pure (no server-side rendering for public pages)
2. Admin backend modifies JSON files atomically
3. Use conventional commits (feat:, fix:, docs:, refactor:, test:)

## UIUX Design Principles

1. Always use subtle colors, transitions, styles, and spacing for a gentle, professional feel.
2. The images are the primary content, everything else should be muted in the background.
3. Avoid rounded corners; prefer sharp edges for a modern aesthetic.
4. Have buttons and interactions be hidden until hover or focus states, to reduce visual clutter.

## Working Style - Single Developer Project

- **Minimum work**: Do only what's needed for the task at hand
- **No over-engineering**: Keep solutions simple and direct
- **Concise documentation**: Write only essential docs, avoid verbosity
- **Respect developer time**: This is a solo project - be efficient
- **Simple > Complete**: Ship working code fast, iterate later
- **Skip unnecessary boilerplate**: Don't create files/code that won't be used immediately

## Planning Work

- You should prefer to make a plan before tackling any major work.
- Write the plan inside /docs/plan/\*.md files.
- Plans should be concise and to the point.
- Make sure to list the risks of a plan.
- Make sure to highlight the complex parts.
- Make sure to highlight unknowns and ask for user input.
- List dependencies on other work.
- Do a rough T-shirt size estimate of the work (Small, Medium, Large).
- Flag if this would need a major architectural change.

## Where to find plans and where to save reports

This project uses specific documentation files to outline plans.

- Plans live in /docs/plan/\*.md
- You must read and do your best to follow these plans.
- The entry-point planning doc for the MVP of this product is /docs/MVP_PLAN.md.

This repository requires writing reports if you make major changes to the codebase. To write reports, please follow these guidelines:

- Reports should use the current timezone for date and time messages.
- Reports live in /docs/reports/\*.md
- Report filenames should start with the date and local timezone hour: YYYY-MM-DD-HH_short_description.md
- Reports should be short and concise, ideally fit into 500 words or less.

## When Making Changes

- Always check the docs/MVP_PLAN.md for MVP priorities
- Reference docs/DEVELOPMENT_SETUP.md for tool configuration details
- Always run pre-commit hooks before committing code, by using `pre-commit run`.
- Check the documentation that is close to the files you changed and make updates as needed.

## Common Gotchas

### Vite Proxy Configuration

**Problem**: API requests from frontend return HTML instead of JSON, causing "Unexpected token" parse errors.

**Cause**: Vite dev server needs explicit proxy configuration to forward `/api/*` requests to the backend server.

**Solution**: Ensure `frontend/vite.config.ts` includes:

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
    },
  },
}
```

**When to check**: If you see errors about parsing HTML as JSON, or if API endpoints return 404 with HTML content during development.

**Important**: After modifying `vite.config.ts`, you MUST restart the frontend dev server for changes to take effect:

```bash
./dev.sh frontend stop
./dev.sh frontend start
```

## You MAY NOT

- You may not turn off tests without explicit permission
- You may not remove checks from the pre-commit hooks.
- Never use MCP servers for git interactions, always use raw git commands on the command line to commit, push, pull, branch, merge, rebase, etc.
