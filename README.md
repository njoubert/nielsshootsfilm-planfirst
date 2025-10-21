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
- **Build**: Simple shell scripts (frontend/scripts/, backend/scripts/)
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

**MVP:**

- **✅ Phase 1**: Project Setup & Infrastructure - Complete
- **✅ Phase 1.5**: Developer Experience & Code Quality - Complete
- **✅ Phase 2**: Data Model & JSON Schema - Complete
- **✅ Phase 3**: Frontend - Public Site - Complete
- **✅ Phase 4**: Backend - Admin Server - Complete
- **✅ Phase 5.5**: Manual Browser Testing - Complete

See [`docs/plan/PLAN_MVP.md`](docs/plan/PLAN_MVP.md) for the full roadmap.

## Quick Start

### First-Time Setup (Automated)

Run the provisioning script to install all dependencies:

```bash
# Clone repository
git clone <repo-url>
cd nielsshootsfilm-planfirst

# Run provisioning script (installs everything)
./provision.sh
```

The script installs:

- ✅ Node.js 20.x (frontend)
- ✅ Go 1.22+ (backend)
- ✅ Frontend npm packages
- ✅ Backend Go modules
- ✅ Pre-commit hooks
- ✅ Optional dev tools (golangci-lint, jq)

### Manual Setup (Alternative)

If you prefer manual installation:

```bash
# Install system dependencies (macOS)
brew install node@20 go@1.22 pre-commit golangci-lint

# Install project dependencies
cd frontend && npm install
cd ../backend && go mod download

# Install pre-commit hooks
pre-commit install

# Bootstrap project (create data files, set admin password)
./scripts/bootstrap.sh
```

### Development

Run the development servers in two separate terminals:

```bash
# Terminal 1 - Frontend dev server with hot reload
./frontend/scripts/dev.sh

# Terminal 2 - Backend admin server with auto-reload
./backend/scripts/dev.sh
```

**Or use the convenience script (runs sequentially):**

```bash
./dev.sh
```

**Access:**

- Frontend: <http://localhost:5173>
- Backend API: <http://localhost:8080>
- Admin Interface: <http://localhost:5173/admin>

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

- [`provision.sh`](provision.sh) - **First-time setup script** (run this first!)
- [`docs/plan/PLAN_MVP.md`](docs/plan/PLAN_MVP.md) - Complete implementation plan
- [`docs/DEVELOPMENT_SETUP.md`](docs/DEVELOPMENT_SETUP.md) - Tool configurations
- [`scripts/README.md`](scripts/README.md) - Available utility scripts
- [`frontend/scripts/`](frontend/scripts/) - Frontend development scripts
- [`backend/scripts/`](backend/scripts/) - Backend development scripts

## Contributing

This is a personal project, but suggestions are welcome! Open an issue to discuss ideas.

## License

MIT License - See [LICENSE](LICENSE) file for details.
