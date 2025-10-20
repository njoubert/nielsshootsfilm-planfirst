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

## Working Style - Single Developer Project

- **Minimum work**: Do only what's needed for the task at hand
- **No over-engineering**: Keep solutions simple and direct
- **Concise documentation**: Write only essential docs, avoid verbosity
- **Respect developer time**: This is a solo project - be efficient
- **Simple > Complete**: Ship working code fast, iterate later
- **Skip unnecessary boilerplate**: Don't create files/code that won't be used immediately

## Where to find plans and where to save reports

This project uses specific documentation files to outline plans.

- Plans live in /docs/plan/\*.md
- You must read and do your best to follow these plans.
- The entry-point planning doc for the MVP of this product is /docs/MVP_PLAN.md.

This repository requires writing reports if you make major changes to the codebase. To write reports, please follow these guidelines:

- Reports live in /docs/reports/\*.md
- Report filenames should start with the date and hour: YYYY-MM-DD-HH_short_description.md
- Reports should be short and concise, ideally fit into 500 words or less.

## When Making Changes

- Always check the docs/MVP_PLAN.md for MVP priorities
- Reference docs/DEVELOPMENT_SETUP.md for tool configuration details
- Always run pre-commit hooks before committing code, by using `pre-commit run`.

## You MAY NOT

- You may not turn off tests without explicit permission
- You may not remove checks from the pre-commit hooks.
