# Photography Portfolio & Gallery Website

A modern photography portfolio with a unique hybrid static/dynamic architecture, designed for speed, simplicity, and ease of content management.

## The Unique Approach

**Hybrid Static/Dynamic Architecture:**

- **Public-facing site**: Pure static files (HTML, CSS, JS, JSON) served blazingly fast by any web server
- **Admin interface**: Dynamic Go backend for easy content management
- **No traditional database**: JSON files (`albums.json`, `site_config.json`) act as the data store
- **Result**: Fast visitor experience + simple content management + minimal hosting requirements

**Why This Works:**

- Visitors get instant page loads from static files
- Admin gets a user-friendly interface for managing albums and photos
- No database setup or maintenance needed
- Easy to back up (just copy JSON files)
- Can be hosted anywhere (GitHub Pages, Netlify, any web server)

## Tech Stack

- **Frontend**: TypeScript + Lit web components (~5KB), Vite for dev server
- **Backend**: Go admin server for JSON file manipulation
- **Build**: Bazel orchestrates npm and go build tools
- **Data**: JSON files as database
- **Testing**: Pre-commit hooks + manual E2E checklist (MVP)

## Development Philosophy

**Single Developer + Agentic AI:**
This project is developed by a solo developer working with AI agents (GitHub Copilot). The approach prioritizes:

- **Minimum necessary work** for each task
- **Simple over complex** - ship working code fast, iterate later
- **Concise documentation** - no verbose docs
- **MVP first** - defer advanced features to post-launch

**Quality Standards:**

- Automated code quality checks via pre-commit hooks
- Type-safe TypeScript and Go
- Conventional commit messages
- No over-engineering

## Project Status

**✅ Phase 1**: Project Setup & Infrastructure - Complete
**✅ Phase 1.5**: Developer Experience & Code Quality - Complete
**⏳ Phase 2**: Data Model & JSON Schema - Next

See [`docs/PLAN_MVP.md`](docs/PLAN_MVP.md) for the full roadmap.

## Quick Start

### Prerequisites

```bash
# macOS (using Homebrew)
brew install pre-commit go node bazel golangci-lint
```

### Setup

```bash
# Clone repository
git clone <repo-url>
cd nielsshootsfilm-planfirst

# Install pre-commit hooks
pre-commit install

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend && go mod download

# Copy environment template
cp .env.example .env
```

### Development

```bash
# Terminal 1 - Frontend dev server
cd frontend && npm run dev

# Terminal 2 - Backend admin server (when ready)
cd backend && go run cmd/admin/main.go
```

**Access:**

- Frontend: <http://localhost:5173>
- Backend API: <http://localhost:8080>

## Architecture Overview

```text
┌─────────────────────────────────────┐
│   Public Website (Static Files)     │
│   - Portfolio page                   │
│   - Album galleries                  │
│   - Password-protected albums        │
└─────────────────────────────────────┘
              ▲
              │ Served by any web server
              │
┌─────────────────────────────────────┐
│   Admin Backend (Go Server)          │
│   - Album management (CRUD)          │
│   - Photo upload & processing        │
│   - JSON file manipulation           │
└─────────────────────────────────────┘
              ▲
              │ Reads/Writes
              ▼
┌─────────────────────────────────────┐
│   Data Layer (JSON Files)            │
│   - albums.json                      │
│   - site_config.json                 │
└─────────────────────────────────────┘
```

## Key Features (Planned)

**MVP (Must Have):**

- Portfolio landing page with main album
- Public album galleries
- Password-protected client galleries
- Photo upload and processing (originals + optimized versions)
- Admin interface for album management
- Responsive design

**Post-MVP:**

- Dark/light theme toggle
- Blog functionality
- Download albums as ZIP
- Analytics dashboard
- Multiple image sizes for different screens

## Documentation

- [`docs/PLAN_MVP.md`](docs/PLAN_MVP.md) - Complete implementation plan and architecture
- [`docs/DEVELOPER_WORKFLOW.md`](docs/DEVELOPER_WORKFLOW.md) - Daily development workflow
- [`docs/DEVELOPMENT_SETUP.md`](docs/DEVELOPMENT_SETUP.md) - Detailed tool configurations

## Contributing

This is a personal project, but suggestions are welcome! Open an issue to discuss ideas.

## License

MIT License - See [LICENSE](LICENSE) file for details.
