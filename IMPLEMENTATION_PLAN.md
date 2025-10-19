# Implementation Plan: Photography Portfolio & Gallery Website

## Executive Summary

This document outlines the implementation plan for a hybrid static/dynamic photography website that combines the speed and simplicity of static site generation with the ease of content management through a dynamic admin interface.

### Core Philosophy
- **Visitor-facing pages**: Pure static files (HTML, CSS, JS, JSON) served by simple web server
- **Admin interface**: Dynamic Go backend that modifies static JSON files
- **No traditional database**: JSON files act as the data store
- **Benefits**: Blazing fast load times, easy hosting, minimal server requirements for public site

---

## Quick Start: Critical Path to MVP

**Goal**: Get a working photography portfolio with admin interface deployed as quickly as possible.

### Phase Priority

**Must Have (MVP)**:
1. ✅ **Phase 1**: Setup (Bazel, repo structure, pre-commit hooks)
2. ✅ **Phase 2**: Data Model (albums.json, site_config.json schemas)
3. ✅ **Phase 3**: Frontend (portfolio page, album viewing, password protection)
4. ✅ **Phase 4**: Backend (album CRUD, photo upload, admin auth)
5. ✅ **Phase 5**: Testing (pre-commit hooks, manual E2E checklist)
6. ⏩ **Phase 7**: Deployment (get it live!)

**Nice to Have (Phase 8 - Advanced Features)**:
- Blog functionality
- Download albums as ZIP
- Analytics dashboard
- Album typography and layout customization
- Comprehensive automated test suite
- Client-side bcrypt password verification
- Multiple image sizes for different screens

**Developer Experience (Phase 9)**:
- CLI tools
- Migration scripts
- Enhanced monitoring

### Simplified Workflow

```bash
# 1. Setup (one-time)
git clone repo && cd repo
brew install pre-commit && pre-commit install
cd frontend && npm install
cd ../backend && go mod download
./scripts/bootstrap.sh  # Creates data files, sets admin password

# 2. Daily development
cd frontend && npm run dev          # Terminal 1: Frontend (localhost:5173)
cd backend && go run cmd/admin/main.go  # Terminal 2: Backend (localhost:8080)

# 3. Before committing (pre-commit hooks run automatically)
git add . && git commit -m "feat: your change"

# 4. Deploy
./scripts/build-release.sh v1.0.0
scp release/*.tar.gz user@server:/tmp/
ssh user@server './deploy.sh'
```

### What to Skip Initially

- Don't implement blog until albums work perfectly
- Don't implement analytics until you have traffic to analyze
- Don't implement download-as-ZIP until someone asks for it
- Don't implement multiple admin users

**Focus**: Get one person's photography portfolio online with working admin interface. Everything else is enhancement.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Public Website                        │
│  (Static HTML/CSS/JS + JSON data files)                 │
│  - Landing/Portfolio Page                                │
│  - Public Albums                                         │
│  - Password-Protected Albums                             │
│  - Unlisted Albums                                       │
└─────────────────────────────────────────────────────────┘
                           │
                           │ Static files served by
                           │ any web server (nginx, Apache)
                           │
┌─────────────────────────────────────────────────────────┐
│                    Admin Backend                         │
│  (Go server with authentication - optional for viewing)  │
│  - Album Management                                      │
│  - Photo Upload & Processing                            │
│  - Site Configuration                                    │
│  - JSON File Manipulation                               │
│  - Analytics API (optional)                             │
└─────────────────────────────────────────────────────────┘
                           │
                           │ Reads/Writes
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Data Layer (JSON Files)                     │
│  - albums.json         (all albums, public & private)    │
│  - site_config.json    (site-wide settings)             │
│  - analytics.db        (optional SQLite database)       │
└─────────────────────────────────────────────────────────┘
```

**Note**: The public website works entirely without the backend. The backend is only needed for content management (admin functions). Visitors can view albums using just static file hosting.

---

## Technology Stack

### Build System
- **Bazel**: Monorepo build orchestrator
  - Coordinates TypeScript (via npm/vite) and Go builds
  - Hermetic builds with reproducible outputs
  - Incremental compilation for fast rebuilds
  - **Note**: Bazel wraps existing tools (npm, go build, vite) rather than replacing them

### Frontend (Public Site)
- **TypeScript**: Type-safe JavaScript
- **Lit**: Lightweight web components library (~5KB)
  - Native web components
  - Reactive properties and templates
  - First-class TypeScript support
  - Scoped styles with Shadow DOM
- **HTML5/CSS3**: Modern web standards
- **Vite**: Fast build tool and dev server with HMR
- **Development server**: Vite dev server with hot module replacement

### Backend (Admin)
- **Go**: Backend server language
  - `net/http`: Web server
  - `encoding/json`: JSON manipulation
  - `html/template`: Admin UI templating
  - `github.com/disintegration/imaging`: Image resizing and processing
  - `github.com/rwcarlsen/goexif`: EXIF extraction
  - `golang.org/x/crypto/bcrypt`: Password hashing
  - `github.com/google/uuid`: UUID generation
  - `github.com/stretchr/testify`: Testing assertions and mocks
  - Authentication middleware

### Assets & Storage
- **Image formats**: JPEG, WebP (for web optimization)
- **File storage**: Local filesystem
- **JSON**: Data persistence format

---

## Phase 1: Project Setup & Infrastructure (Week 1-2)

### 1.1 Bazel Workspace Setup
- [ ] Initialize Bazel workspace (`WORKSPACE` file)
- [ ] Configure `rules_typescript` for frontend
- [ ] Configure `rules_go` for backend
- [ ] Set up `rules_nodejs` for npm dependencies
- [ ] Create `.bazelrc` with common configurations
- [ ] Set up `.bazelignore` for excluded directories

### 1.1.1 Frontend Dependencies (npm)
Add to `frontend/package.json`:

**Production Dependencies**:
- [ ] `lit` - Web components library (~5KB)
- [ ] `bcryptjs` - Client-side password verification
- [ ] `@types/bcryptjs` - TypeScript types for bcryptjs

**Development Dependencies**:
- [ ] `vite` - Build tool and dev server
- [ ] `typescript` - TypeScript compiler
- [ ] `@types/node` - Node.js type definitions
- [ ] `vitest` - Fast Vite-native test runner
- [ ] `@vitest/ui` - UI for Vitest tests
- [ ] `@web/test-runner` - Real browser testing for web components
- [ ] `@open-wc/testing` - Testing helpers for web components
- [ ] `@testing-library/dom` - DOM testing utilities
- [ ] `sinon` - Mocking and spying
- [ ] `@playwright/test` - E2E testing framework
- [ ] `eslint` - Linting for TypeScript/JavaScript
- [ ] `@typescript-eslint/parser` - TypeScript parser for ESLint
- [ ] `@typescript-eslint/eslint-plugin` - TypeScript linting rules
- [ ] `eslint-plugin-lit` - Lit-specific linting rules
- [ ] `eslint-config-prettier` - Disable conflicting ESLint rules
- [ ] `prettier` - Code formatter
- [ ] `vite-plugin-lit-css` - CSS in Lit components (optional)

### 1.2 Repository Structure
```
/
├── WORKSPACE
├── BUILD.bazel
├── .bazelrc
├── frontend/
│   ├── BUILD.bazel
│   ├── src/
│   │   ├── index.html
│   │   ├── pages/
│   │   │   ├── portfolio.html
│   │   │   ├── galleries.html
│   │   │   ├── gallery-detail.html
│   │   │   ├── client-gallery.html
│   │   │   └── blog.html
│   │   ├── components/
│   │   │   ├── app-nav.ts
│   │   │   ├── app-nav.test.ts
│   │   │   ├── photo-grid.ts
│   │   │   ├── photo-grid.test.ts
│   │   │   ├── photo-lightbox.ts
│   │   │   ├── photo-lightbox.test.ts
│   │   │   └── ... (other components + tests)
│   │   ├── styles/
│   │   │   ├── global.css
│   │   │   └── variables.css
│   │   ├── utils/
│   │   │   ├── api.ts
│   │   │   ├── api.test.ts
│   │   │   ├── router.ts
│   │   │   ├── router.test.ts
│   │   │   └── ... (other utils + tests)
│   │   ├── types/
│   │   │   └── data-models.ts
│   │   └── main.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   └── vite.config.ts
├── backend/
│   ├── BUILD.bazel
│   ├── cmd/
│   │   └── admin/
│   │       └── main.go
│   ├── internal/
│   │   ├── handlers/
│   │   │   ├── album_handler.go
│   │   │   └── album_handler_test.go
│   │   ├── services/
│   │   │   ├── album_service.go
│   │   │   └── album_service_test.go
│   │   └── models/
│   │       ├── album.go
│   │       └── album_test.go
│   ├── tests/
│   │   └── integration/
│   │       └── album_lifecycle_test.go
│   └── go.mod
├── e2e/
│   ├── BUILD.bazel
│   ├── public/
│   │   ├── landing-page.spec.ts
│   │   ├── album-browsing.spec.ts
│   │   └── password-protected-album.spec.ts
│   ├── admin/
│   │   ├── auth.spec.ts
│   │   ├── album-management.spec.ts
│   │   └── photo-upload.spec.ts
│   └── playwright.config.ts
├── testdata/
│   ├── BUILD.bazel
│   ├── images/
│   │   ├── test-photo-1.jpg
│   │   └── test-photo-2.jpg
│   └── json/
│       ├── albums-fixture.json
│       └── site-config-fixture.json
├── data/
│   ├── albums.json
│   ├── blog_posts.json
│   └── site_config.json
├── static/
│   └── uploads/
│       ├── originals/
│       ├── display/
│       └── thumbnails/
├── .vscode/
│   ├── settings.json
│   ├── extensions.json
│   └── launch.json
├── .pre-commit-config.yaml
├── .editorconfig
├── .gitignore
├── .secrets.baseline
└── docs/
    └── IMPLEMENTATION_PLAN.md
```

### 1.3 Development Environment
- [ ] Set up local development scripts
- [ ] Create Bazel targets for running dev servers
- [ ] Configure Vite for frontend with HMR (hot module replacement)
- [ ] Set up Go air/realize for backend hot-reload
- [ ] Create `vite.config.ts` with proper TypeScript and Lit configuration
- [ ] Configure Vite to serve static JSON files from `/data` directory

---

## Phase 1.5: Developer Experience & Code Quality (Week 1-2)

**Philosophy**: Automate code quality checks locally using pre-commit hooks. Keep it simple initially.

> **Note**: Detailed tool configurations, VS Code setup, and workflow guides are in [`docs/DEVELOPMENT_SETUP.md`](docs/DEVELOPMENT_SETUP.md)

### 1.5.1 Essential Tooling

**Pre-commit Framework** - Automated quality checks on commit
```bash
# Install and setup
brew install pre-commit  # or: pip install pre-commit
pre-commit install
```

**What it does**:
- Formats code (Prettier for TS/JS, gofmt for Go)
- Runs linters (ESLint, golangci-lint)
- Checks for secrets, large files, merge conflicts
- Validates JSON, YAML files
- Enforces conventional commit messages (optional)

**Key Configuration**: See [`docs/DEVELOPMENT_SETUP.md`](docs/DEVELOPMENT_SETUP.md) for complete `.pre-commit-config.yaml`

### 1.5.2 Quick Start Workflow

```bash
# First-time setup
git clone <repo>
cd project
brew install pre-commit
pre-commit install
cd frontend && npm install
cd ../backend && go mod download

# Daily development
cd frontend && npm run dev      # Terminal 1
cd backend && go run cmd/admin/main.go  # Terminal 2

# Before committing (pre-commit hooks run automatically)
git add .
git commit -m "feat: your change"
```

### 1.5.3 Checklist

- [ ] Install pre-commit framework
- [ ] Create `.pre-commit-config.yaml` (see docs/DEVELOPMENT_SETUP.md)
- [ ] Create `.gitignore` for secrets and build outputs
- [ ] Create `.env.example` template
- [ ] Set up VS Code (optional, see docs/DEVELOPMENT_SETUP.md)
- [ ] Test pre-commit hooks work

---


## Phase 2: Data Model & JSON Schema (Week 2)

### 2.1 Define JSON Schemas

#### `site_config.json`
**Comprehensive site configuration - all settings editable via admin interface**

```json
{
  "version": "1.0.0",
  "last_updated": "ISO8601",

  "site": {
    "title": "Photographer Name",
    "tagline": "Optional tagline or subtitle",
    "description": "Site description for SEO and about section",
    "language": "en",
    "timezone": "America/Los_Angeles"
  },

  "owner": {
    "name": "Photographer Name",
    "bio": "Multi-paragraph bio (Markdown supported)",
    "email": "contact@example.com",
    "phone": "+1-555-0100",
    "location": "San Francisco, CA"
  },

  "social": {
    "instagram": "username",
    "facebook": "username",
    "twitter": "username",
    "linkedin": "username",
    "youtube": "channel-id",
    "pinterest": "username",
    "tiktok": "username",
    "custom_links": [
      {
        "label": "Portfolio",
        "url": "https://example.com"
      }
    ]
  },

  "branding": {
    "logo_url": "/static/uploads/logo.png",
    "favicon_url": "/static/uploads/favicon.ico",
    "primary_color": "#000000",
    "secondary_color": "#666666",
    "accent_color": "#ff6b6b",
    "font_heading": "Playfair Display",
    "font_body": "Open Sans",
    "custom_css_url": "/static/custom.css"
  },

  "portfolio": {
    "main_album_id": "uuid",
    "show_exif_data": true,
    "default_photo_layout": "masonry",
    "enable_lightbox": true,
    "show_photo_count": true
  },

  "navigation": {
    "show_home": true,
    "show_albums": true,
    "show_blog": true,
    "show_about": true,
    "show_contact": true,
    "custom_links": [
      {
        "label": "Shop",
        "url": "/shop",
        "order": 5
      }
    ]
  },

  "features": {
    "enable_blog": true,
    "enable_contact_form": true,
    "enable_newsletter": false,
    "enable_comments": false,
    "enable_analytics": false
  },

  "seo": {
    "meta_title": "Professional Photography | Photographer Name",
    "meta_description": "...",
    "meta_keywords": ["photography", "portrait", "wedding"],
    "og_image": "/static/uploads/og-image.jpg",
    "google_analytics_id": "",
    "google_site_verification": "",
    "robots_txt_allow": true
  },

  "contact": {
    "show_email": true,
    "show_phone": true,
    "show_address": false,
    "contact_form_email": "contact@example.com",
    "inquiry_types": [
      "Wedding Photography",
      "Portrait Session",
      "Commercial Work",
      "Print Purchase",
      "General Inquiry"
    ]
  },

  "gallery_defaults": {
    "default_visibility": "public",
    "default_allow_downloads": false,
    "watermark_downloads": false,
    "watermark_url": "/static/uploads/watermark.png"
  },

  "admin": {
    "items_per_page": 20,
    "auto_save_drafts": true,
    "show_storage_warnings": true
  }
}
```

**Notes**:
- All fields optional except `site.title`
- Extensible structure - easy to add new sections
- Supports Markdown in bio and descriptions
- Custom links allow for future expansion
- Settings grouped logically for admin UI

#### `albums.json`
**Note**: This replaces both `galleries.json` and `client_galleries.json` - all albums are in one file.

```json
{
  "albums": [
    {
      "id": "uuid",
      "slug": "url-friendly-name",
      "title": "Album Title",
      "subtitle": "Optional subtitle displayed on cover",
      "description": "Long-form description...",
      "cover_photo_id": "uuid",
      "visibility": "public|unlisted|password_protected",
      "password_hash": "bcrypt-hash (only if password_protected)",
      "expiration_date": "ISO8601 (optional, for client galleries)",
      "allow_downloads": true,
      "is_portfolio_album": false,
      "order": 1,
      "created_at": "ISO8601",
      "updated_at": "ISO8601",
      "photos": [
        {
          "id": "uuid",
          "filename_original": "IMG_1234.jpg",
          "url_original": "/static/uploads/originals/uuid.jpg",
          "url_display": "/static/uploads/display/uuid.webp",
          "url_thumbnail": "/static/uploads/thumbnails/uuid.webp",
          "caption": "Optional caption...",
          "alt_text": "Accessibility description",
          "order": 1,
          "width": 4000,
          "height": 3000,
          "file_size_original": 12345678,
          "file_size_display": 234567,
          "file_size_thumbnail": 45678,
          "exif": {
            "camera": "Canon EOS R5",
            "lens": "RF 50mm f/1.2",
            "iso": 400,
            "aperture": "f/2.8",
            "shutter_speed": "1/250",
            "focal_length": "50mm",
            "date_taken": "ISO8601"
          },
          "uploaded_at": "ISO8601"
        }
      ]
    }
  ]
}
```

**Album Visibility Modes**:
- `public`: Shows in public gallery list, accessible to everyone
- `unlisted`: Not shown in gallery list, but accessible via direct URL
- `password_protected`: Requires password to view (bcrypt hash stored)

**Album Customization** (Phase 8 - Advanced Features):
- `typography`: Optional per-album font customization (title, subtitle, body, caption fonts)
- `layout_options`: Optional layout variations (masonry, grid, justified, carousel)
- **MVP**: Leave these fields empty - albums use global settings from `site_config.json`

#### `blog_posts.json`
```json
{
  "posts": [
    {
      "id": "uuid",
      "slug": "url-friendly-title",
      "title": "Blog Post Title",
      "excerpt": "Short summary...",
      "content": "Full HTML content...",
      "featured_image": "/static/uploads/...",
      "author": "Photographer Name",
      "published": true,
      "published_at": "ISO8601",
      "created_at": "ISO8601",
      "updated_at": "ISO8601",
      "tags": ["tag1", "tag2"]
    }
  ]
}
```

> **Note**: Analytics moved to Phase 8 (Advanced Features). For MVP, focus on albums and site config only.

### 2.2 Go Data Models
- [ ] Create Go structs for `Album`, `Photo`, `SiteConfig`
- [ ] Implement JSON marshal/unmarshal methods
- [ ] Add validation logic (required fields, format checks)
- [ ] Create repository pattern for file I/O with atomic writes

### 2.3 Data Initialization & Bootstrap

**Purpose**: Set up empty data files and create initial admin credentials for first-time setup.

#### Initial Data Files

Create minimal valid JSON files:

**`data/albums.json`**:
```json
{
  "albums": []
}
```

**`data/site_config.json`**:
```json
{
  "version": "1.0.0",
  "last_updated": "2025-10-18T00:00:00Z",
  "site": {
    "title": "My Photography Portfolio",
    "tagline": "",
    "description": "",
    "language": "en",
    "timezone": "America/Los_Angeles"
  },
  "owner": {
    "name": "",
    "bio": "",
    "email": "",
    "phone": "",
    "location": ""
  },
  "social": {},
  "branding": {
    "primary_color": "#000000",
    "secondary_color": "#666666",
    "accent_color": "#ff6b6b"
  },
  "portfolio": {
    "show_exif_data": true,
    "enable_lightbox": true
  },
  "navigation": {
    "show_home": true,
    "show_albums": true,
    "show_about": true,
    "show_contact": true
  },
  "features": {
    "enable_analytics": false
  }
}
```

#### Bootstrap Script

Create `scripts/bootstrap.sh`:
```bash
#!/bin/bash
set -e

echo "Bootstrapping photography site..."

# Create directory structure
mkdir -p data
mkdir -p static/uploads/{originals,display,thumbnails}

# Create empty data files if they don't exist
if [ ! -f data/albums.json ]; then
    echo '{"albums":[]}' > data/albums.json
    echo "✓ Created data/albums.json"
fi

if [ ! -f data/site_config.json ]; then
    cp scripts/templates/site_config.template.json data/site_config.json
    echo "✓ Created data/site_config.json"
fi

# Create .gitkeep files
touch static/uploads/originals/.gitkeep
touch static/uploads/display/.gitkeep
touch static/uploads/thumbnails/.gitkeep

# Generate admin password hash
echo ""
echo "=== Admin Setup ==="
read -p "Enter admin username (default: admin): " ADMIN_USER
ADMIN_USER=${ADMIN_USER:-admin}

read -sp "Enter admin password: " ADMIN_PASSWORD
echo ""

# Generate bcrypt hash (requires bcrypt command or Go helper)
HASH=$(go run scripts/hash_password.go "$ADMIN_PASSWORD")

# Create admin config
cat > data/admin_config.json <<EOF
{
  "username": "$ADMIN_USER",
  "password_hash": "$HASH",
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo "✓ Created admin credentials"
echo ""
echo "Bootstrap complete! You can now:"
echo "  1. Run the frontend: cd frontend && npm run dev"
echo "  2. Run the backend: cd backend && go run cmd/admin/main.go"
echo "  3. Access admin at: http://localhost:8080/admin"
```

#### Password Hasher Utility

Create `scripts/hash_password.go`:
```go
// Simple utility to generate bcrypt hashes for passwords
package main

import (
	"fmt"
	"os"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	if len(os.Args) != 2 {
		fmt.Fprintln(os.Stderr, "Usage: hash_password <password>")
		os.Exit(1)
	}

	password := os.Args[1]
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		fmt.Fprintln(os.Stderr, "Error:", err)
		os.Exit(1)
	}

	fmt.Print(string(hash))
}
```

#### Checklist
- [ ] Create `data/` directory structure
- [ ] Create `static/uploads/` directories
- [ ] Create template JSON files
- [ ] Write bootstrap script
- [ ] Write password hasher utility
- [ ] Add bootstrap instructions to README
- [ ] Test first-time setup process

---

## Phase 3: Frontend - Public Site (Week 3-5)

**Global Site Configuration Usage**:
The frontend loads `site_config.json` once on page load and uses it throughout the application for:
- Page titles and meta tags (`site.title`, `seo.*`)
- Navigation menu visibility (`navigation.*`)
- Branding (colors, fonts, logo) (`branding.*`)
- Social links in footer (`social.*`)
- Contact information (`owner.*`, `contact.*`)
- Feature toggles (`features.*`)
- Portfolio settings (`portfolio.*`)

All Lit components should accept settings as properties or access via a global config store.

### 3.1 Landing Page / Portfolio
**Main Portfolio Album Display**:
- [ ] Hero section with cover photo from main portfolio album
  - Full-screen cover image
  - Album title and subtitle overlaid
  - Site title from `site_config.site.title`
- [ ] About section
  - Owner name from `site_config.owner.name`
  - Bio from `site_config.owner.bio` (render Markdown)
  - Location from `site_config.owner.location`
- [ ] Photo grid from main portfolio album
  - Layout based on `site_config.portfolio.default_photo_layout`
  - Click to open lightbox (if `site_config.portfolio.enable_lightbox`)
- [ ] Contact section
  - Email (if `site_config.contact.show_email`)
  - Phone (if `site_config.contact.show_phone`)
  - Social links from `site_config.social`
- [ ] Responsive design (mobile-first)
- [ ] Load data from `site_config.json` (for main portfolio album ID) and `albums.json`
- [ ] Apply branding colors from `site_config.branding`

### 3.2 Public Albums
**Album Listing Page**:
- [ ] Grid of album covers (only public albums)
- [ ] Each card shows:
  - Cover photo
  - Album title
  - Number of photos
  - Click to view album
- [ ] Responsive grid layout
- [ ] Load data from `albums.json` (filter `visibility: "public"`)

**Individual Album View**:
- [ ] Full-screen cover photo section
  - Cover photo fills viewport above fold
  - Album title and subtitle overlaid on cover
  - Scroll indicator
- [ ] Album description section
- [ ] Photo grid/masonry layout
  - Display version thumbnails
  - Lazy loading
  - Click photo to open lightbox
- [ ] Lightbox/full-screen viewer
  - Display version shown (3840px 4K-optimized)
  - Previous/next navigation
  - Keyboard support (arrow keys, ESC)
  - Touch gestures (swipe)
  - Close button
  - Photo counter (e.g., "5 of 24")
  - Optional: Show EXIF data
- [ ] Download options (if `allow_downloads: true`)
  - Individual photo download button in lightbox
  - "Download Album" button with quality selector
- [ ] Load data from `albums.json` by slug

### 3.3 Password-Protected & Unlisted Albums

> **MVP**: Server-side password check. Client-side bcrypt can be added in Phase 8.

**Password Entry Page**:
- [ ] Clean, minimal password form
- [ ] Submit password to backend API for verification
- [ ] Backend returns session token on success
- [ ] Error message for incorrect password
- [ ] Store session token in sessionStorage

**Album View** (same as public, but with access control):
- [ ] Check session token before displaying album
- [ ] Show expiration warning if applicable
- [ ] Same photo grid and lightbox as public albums

**Phase 8 Enhancement**: Client-side bcrypt verification (no server required)

### 3.4 Blog Section (Phase 8 - Advanced Feature)

> **Defer to Phase 8**: Focus on albums first. Blog can be added later without affecting core functionality.

Planned features (Phase 8):
- Blog listing page with post cards
- Individual blog post pages
- Tag filtering and pagination
- Markdown or rich text support

### 3.5 Lit Web Components
Create reusable Lit components for the public site:

#### Core Components
- [ ] `<app-nav>` - Navigation menu component
- [ ] `<app-footer>` - Footer component
- [ ] `<photo-grid>` - Responsive image grid with masonry layout
  - Property: `photos` (array of photo objects)
  - Property: `layout` ("masonry" | "grid" | "justified")
  - Event: `photo-click` - Emits photo object and index
  - Lazy loading with Intersection Observer
- [ ] `<photo-lightbox>` - Full-screen image viewer with navigation
  - Property: `photos` (array of photo objects)
  - Property: `currentIndex` (number)
  - Property: `showExif` (boolean)
  - Methods: `next()`, `prev()`, `close()`
  - Keyboard support: arrow keys, ESC
  - Touch gestures: swipe left/right
  - Shows display version (3840px 4K-optimized WebP)
- [ ] `<lazy-image>` - Image component with lazy loading
  - Property: `src` (image URL)
  - Property: `alt` (alt text)
  - Property: `aspectRatio` (for proper placeholder)
  - Progressive enhancement with blur placeholder
- [ ] `<album-card>` - Album preview card for listings
  - Property: `album` (album object)
  - Shows cover photo, title, photo count
  - Click → navigate to album
- [ ] `<album-cover-hero>` - Full-screen cover photo section
  - Property: `coverPhoto` (photo object)
  - Property: `title` (string)
  - Property: `subtitle` (string)
  - Parallax scroll effect (optional)
- [ ] `<download-menu>` - Download options dropdown
  - Property: `allowDownloads` (boolean)
  - Property: `photos` (array)
  - Options: Original, Display, Thumbnail
  - Single photo or whole album
- [ ] `<password-form>` - Password entry form
  - Property: `passwordHash` (bcrypt hash from JSON)
  - Client-side bcrypt verification
  - Event: `password-success`
- [ ] `<blog-card>` - Blog post card for listings
- [ ] `<loading-spinner>` - Loading state indicator

#### Page-Level Components
- [ ] `<portfolio-page>` - Landing page component
  - Fetches main portfolio album
  - Displays cover hero + photo grid
- [ ] `<album-list-page>` - Public albums listing
  - Fetches all public albums
  - Grid of album cards
- [ ] `<album-detail-page>` - Individual album view
  - Fetches album by slug
  - Cover hero + photo grid + lightbox
  - Password protection check
  - Download functionality
- [ ] `<blog-list>` - Blog listing with filters
- [ ] `<blog-post>` - Individual blog post view

#### Component Features
- [ ] Reactive state management with Lit reactive properties
- [ ] Shadow DOM for style encapsulation
- [ ] Event-driven communication between components
- [ ] Keyboard navigation support
- [ ] Touch gesture support for mobile
- [ ] URL state management (e.g., lightbox photo index in URL)

### 3.6 Download Functionality (Phase 8 - Advanced Feature)

> **Defer to Phase 8**: Simple right-click "Save Image As..." works for MVP. Add download buttons later.

**MVP**: Albums display photos at full quality. Users can right-click to save.

**Phase 8 Enhancement**:
- Download button in lightbox
- Quality selector (Original/Display/Thumbnail)
- Batch album download
- Optional: ZIP generation on backend

### 3.7 Analytics Tracking (Phase 8 - Advanced Feature)

> **Defer to Phase 8**: Start without analytics. Add when you have traffic to analyze.

**Planned for Phase 8**:
- Fire-and-forget analytics tracking
- Album/photo view counts
- Download tracking
- Privacy-focused (no PII)
### 3.8 TypeScript Utilities
- [ ] JSON data fetching utilities with type safety
- [ ] Type definitions for all JSON schemas (Album, Photo, BlogPost, SiteConfig)
- [ ] Client-side routing (History API or simple hash routing)
- [ ] Session storage utilities for password verification
- [ ] URL query parameter handling
- [ ] Date formatting utilities
- [ ] Image URL helpers (thumbnails, display, original)
- [ ] Download utilities (downloadPhoto, downloadAlbum)
- [ ] **Analytics tracking utility** (fire-and-forget, graceful degradation)
- [ ] bcrypt.js for client-side password verification

---

## Phase 4: Backend - Admin Server (Week 6-8)

### 4.1 Core Server Setup
- [ ] HTTP server with routing (chi router)
- [ ] Static file serving (for uploaded images)
- [ ] CORS configuration
- [ ] Logging middleware (structured logging)
- [ ] Error handling middleware
- [ ] Request ID tracking
- [ ] Panic recovery middleware

#### 4.1.1 Error Handling Strategy

**Philosophy**:
- Log everything server-side with full context
- Return safe, user-friendly errors to clients
- Never expose internal details in production
- Provide detailed errors in development mode
- Track errors for debugging and monitoring

**Error Types**:

```go
// backend/internal/errors/errors.go
package errors

import (
    "fmt"
    "net/http"
)

type AppError struct {
    // Internal details (logged, not sent to client)
    Err        error  // Underlying error
    StackTrace string // Stack trace for debugging
    Context    map[string]interface{} // Additional context

    // Public details (can be sent to client)
    Code       string // Error code (e.g., "ALBUM_NOT_FOUND")
    Message    string // User-friendly message
    HTTPStatus int    // HTTP status code
}

func (e *AppError) Error() string {
    if e.Err != nil {
        return e.Err.Error()
    }
    return e.Message
}

// Error constructors
func NotFound(resource, id string) *AppError {
    return &AppError{
        Code:       "NOT_FOUND",
        Message:    fmt.Sprintf("%s not found", resource),
        HTTPStatus: http.StatusNotFound,
        Context:    map[string]interface{}{"resource": resource, "id": id},
    }
}

func InvalidInput(field, reason string) *AppError {
    return &AppError{
        Code:       "INVALID_INPUT",
        Message:    fmt.Sprintf("Invalid %s: %s", field, reason),
        HTTPStatus: http.StatusBadRequest,
        Context:    map[string]interface{}{"field": field, "reason": reason},
    }
}

func Unauthorized(reason string) *AppError {
    return &AppError{
        Code:       "UNAUTHORIZED",
        Message:    "Authentication required",
        HTTPStatus: http.StatusUnauthorized,
        Context:    map[string]interface{}{"reason": reason},
    }
}

func Forbidden(reason string) *AppError {
    return &AppError{
        Code:       "FORBIDDEN",
        Message:    "Access denied",
        HTTPStatus: http.StatusForbidden,
        Context:    map[string]interface{}{"reason": reason},
    }
}

func Internal(err error, context string) *AppError {
    return &AppError{
        Err:        err,
        Code:       "INTERNAL_ERROR",
        Message:    "An internal error occurred",
        HTTPStatus: http.StatusInternalServerError,
        Context:    map[string]interface{}{"context": context},
    }
}

func Conflict(resource, reason string) *AppError {
    return &AppError{
        Code:       "CONFLICT",
        Message:    fmt.Sprintf("Conflict: %s", reason),
        HTTPStatus: http.StatusConflict,
        Context:    map[string]interface{}{"resource": resource, "reason": reason},
    }
}
```

**Error Handler Middleware**:

```go
// backend/internal/middleware/errors.go
func ErrorHandler(devMode bool) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            // Wrap response writer to capture errors
            wrapped := &errorResponseWriter{ResponseWriter: w, request: r}

            // Recover from panics
            defer func() {
                if err := recover(); err != nil {
                    stack := string(debug.Stack())

                    logger := GetLogger(r.Context())
                    logger.Error("panic recovered",
                        "error", err,
                        "stack", stack,
                        "path", r.URL.Path,
                        "method", r.Method,
                    )

                    appErr := &errors.Internal(
                        fmt.Errorf("panic: %v", err),
                        "panic recovered",
                    )
                    wrapped.writeError(appErr, devMode)
                }
            }()

            next.ServeHTTP(wrapped, r)
        })
    }
}

type errorResponseWriter struct {
    http.ResponseWriter
    request *http.Request
}

func (w *errorResponseWriter) writeError(err *errors.AppError, devMode bool) {
    logger := GetLogger(w.request.Context())

    // Log full error details
    logger.Error("request error",
        "code", err.Code,
        "status", err.HTTPStatus,
        "message", err.Message,
        "underlying_error", err.Err,
        "context", err.Context,
        "path", w.request.URL.Path,
        "method", w.request.Method,
    )

    // Prepare client response
    response := map[string]interface{}{
        "error": map[string]interface{}{
            "code":    err.Code,
            "message": err.Message,
        },
    }

    // Include additional details in dev mode
    if devMode && err.Err != nil {
        response["error"].(map[string]interface{})["details"] = err.Err.Error()
        response["error"].(map[string]interface{})["context"] = err.Context
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(err.HTTPStatus)
    json.NewEncoder(w).Encode(response)
}
```

**Usage in Handlers**:

```go
func (h *AlbumHandler) GetAlbum(w http.ResponseWriter, r *http.Request) {
    albumID := chi.URLParam(r, "id")

    album, err := h.service.GetAlbum(albumID)
    if err != nil {
        // Return structured error
        if errors.Is(err, ErrAlbumNotFound) {
            writeError(w, r, errors.NotFound("album", albumID))
            return
        }
        writeError(w, r, errors.Internal(err, "failed to get album"))
        return
    }

    json.NewEncoder(w).Encode(album)
}

// Helper function
func writeError(w http.ResponseWriter, r *http.Request, err *errors.AppError) {
    // Error handler middleware will catch this
    // But we can also handle it directly here
    w.(*errorResponseWriter).writeError(err, isDevMode())
}
```

#### 4.1.2 Logging Strategy

**Philosophy**:
- Structured logging for easy parsing and searching
- Different log levels for different environments
- Request tracing with unique IDs
- Log rotation and retention
- No sensitive data in logs (passwords, tokens, full IPs)

**Logging Library**: Use Go's `log/slog` (standard library, Go 1.21+)

**Logger Configuration**:

```go
// backend/internal/logger/logger.go
package logger

import (
    "context"
    "log/slog"
    "os"
)

type Config struct {
    Level      string // debug, info, warn, error
    Format     string // json, text
    Output     string // stdout, file path
    AddSource  bool   // Include source file/line
}

func New(cfg Config) *slog.Logger {
    // Parse level
    var level slog.Level
    switch cfg.Level {
    case "debug":
        level = slog.LevelDebug
    case "info":
        level = slog.LevelInfo
    case "warn":
        level = slog.LevelWarn
    case "error":
        level = slog.LevelError
    default:
        level = slog.LevelInfo
    }

    // Choose handler
    var handler slog.Handler
    opts := &slog.HandlerOptions{
        Level:     level,
        AddSource: cfg.AddSource,
    }

    if cfg.Format == "json" {
        handler = slog.NewJSONHandler(os.Stdout, opts)
    } else {
        handler = slog.NewTextHandler(os.Stdout, opts)
    }

    return slog.New(handler)
}
```

**Request Logging Middleware**:

```go
// backend/internal/middleware/logging.go
func RequestLogger(logger *slog.Logger) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            start := time.Now()

            // Generate request ID
            requestID := generateRequestID()

            // Add request ID to context
            ctx := context.WithValue(r.Context(), "request_id", requestID)

            // Add logger with request context to context
            reqLogger := logger.With(
                "request_id", requestID,
                "method", r.Method,
                "path", r.URL.Path,
                "ip", hashIP(r.RemoteAddr), // Hash IP for privacy
                "user_agent", r.UserAgent(),
            )
            ctx = context.WithValue(ctx, "logger", reqLogger)

            // Wrap response writer to capture status
            wrapped := &responseWriter{ResponseWriter: w, statusCode: 200}

            // Log request start
            reqLogger.Info("request started")

            // Process request
            next.ServeHTTP(wrapped, r.WithContext(ctx))

            // Log request completion
            duration := time.Since(start)
            reqLogger.Info("request completed",
                "status", wrapped.statusCode,
                "duration_ms", duration.Milliseconds(),
                "bytes", wrapped.bytesWritten,
            )
        })
    }
}

type responseWriter struct {
    http.ResponseWriter
    statusCode   int
    bytesWritten int
}

func (w *responseWriter) WriteHeader(statusCode int) {
    w.statusCode = statusCode
    w.ResponseWriter.WriteHeader(statusCode)
}

func (w *responseWriter) Write(b []byte) (int, error) {
    n, err := w.ResponseWriter.Write(b)
    w.bytesWritten += n
    return n, err
}

// Helper to get logger from context
func GetLogger(ctx context.Context) *slog.Logger {
    if logger, ok := ctx.Value("logger").(*slog.Logger); ok {
        return logger
    }
    return slog.Default()
}

// Hash IP for privacy (store hash, not full IP)
func hashIP(ip string) string {
    h := sha256.Sum256([]byte(ip))
    return base64.StdEncoding.EncodeToString(h[:8]) // First 8 bytes
}

func generateRequestID() string {
    b := make([]byte, 16)
    rand.Read(b)
    return fmt.Sprintf("%x", b)
}
```

**Application Logging Examples**:

```go
// In handlers or services
logger := GetLogger(r.Context())

// Info level
logger.Info("album created",
    "album_id", album.ID,
    "title", album.Title,
    "photo_count", len(album.Photos),
)

// Warning level
logger.Warn("disk space low",
    "available_gb", availableGB,
    "threshold_gb", thresholdGB,
)

// Error level
logger.Error("failed to process image",
    "photo_id", photoID,
    "error", err,
)

// Debug level (only in dev)
logger.Debug("cache hit",
    "key", cacheKey,
    "ttl_seconds", ttl,
)
```

**Log Rotation Configuration**:

```go
// Use lumberjack for log rotation
import "gopkg.in/natefinch/lumberjack.v2"

func setupFileLogger(path string) *slog.Logger {
    logFile := &lumberjack.Logger{
        Filename:   path,
        MaxSize:    100, // MB
        MaxBackups: 5,
        MaxAge:     30, // days
        Compress:   true,
    }

    handler := slog.NewJSONHandler(logFile, &slog.HandlerOptions{
        Level: slog.LevelInfo,
    })

    return slog.New(handler)
}
```

**Environment Configuration**:

```bash
# .env
LOG_LEVEL=info          # debug, info, warn, error
LOG_FORMAT=json         # json, text
LOG_OUTPUT=/var/log/photoadmin/app.log  # or stdout
LOG_ADD_SOURCE=false    # Include source file/line in production
```

**What to Log**:

✅ **DO Log**:
- All HTTP requests (method, path, status, duration)
- Authentication events (login, logout, failed attempts)
- Data mutations (create, update, delete operations)
- Image processing events (upload, resize, errors)
- System events (startup, shutdown, disk space warnings)
- Errors with full context
- Performance metrics

❌ **DO NOT Log**:
- Passwords or password hashes
- Session tokens or CSRF tokens
- Full IP addresses (hash them)
- Photo file contents or binary data
- Personal identifying information

#### 4.1.3 Error Handling in Frontend

**Global Error Handler**:

```typescript
// frontend/src/utils/errors.ts
interface APIError {
    code: string;
    message: string;
    details?: string;
}

class ErrorHandler {
    async handleResponse(response: Response): Promise<any> {
        if (response.ok) {
            return response.json();
        }

        // Handle error responses
        let error: APIError;
        try {
            const body = await response.json();
            error = body.error;
        } catch {
            error = {
                code: 'NETWORK_ERROR',
                message: 'An error occurred. Please try again.'
            };
        }

        // Handle specific error codes
        switch (error.code) {
            case 'UNAUTHORIZED':
                // Redirect to login
                window.location.href = '/admin/login';
                break;

            case 'FORBIDDEN':
                showNotification('Access denied', 'error');
                break;

            case 'NOT_FOUND':
                showNotification('Resource not found', 'error');
                break;

            case 'INVALID_INPUT':
                // Show field-specific error
                showNotification(error.message, 'error');
                break;

            default:
                showNotification(
                    error.message || 'An unexpected error occurred',
                    'error'
                );
        }

        throw error;
    }
}

// Usage
const errorHandler = new ErrorHandler();

async function fetchAlbums() {
    try {
        const response = await fetch('/api/admin/albums');
        return await errorHandler.handleResponse(response);
    } catch (error) {
        // Error already handled and displayed
        console.error('Failed to fetch albums:', error);
    }
}
```

**Toast/Notification System**:

```typescript
// Show user-friendly notifications
function showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info') {
    // Implementation using native browser notifications or custom UI
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 5000);
}
```

#### 4.1.4 Monitoring and Alerting

**Health Check Endpoint**:

```go
// GET /api/health
func HealthCheck(w http.ResponseWriter, r *http.Request) {
    health := map[string]interface{}{
        "status": "healthy",
        "timestamp": time.Now().Unix(),
        "checks": map[string]bool{
            "disk_space": checkDiskSpace(),
            "data_files": checkDataFiles(),
            "analytics_db": checkAnalyticsDB(),
        },
    }

    json.NewEncoder(w).Encode(health)
}
```

**Metrics Endpoint** (Optional):

```go
// GET /api/metrics (Prometheus format)
func MetricsHandler(w http.ResponseWriter, r *http.Request) {
    // Expose basic metrics
    // - Request count by path and status
    // - Request duration histogram
    // - Active sessions
    // - Disk usage
    // - Image processing queue size
}
```

**Implementation Checklist**:
- [ ] AppError type with internal/public fields
- [ ] Error constructor functions
- [ ] Error handler middleware
- [ ] Panic recovery middleware
- [ ] Structured logger setup (slog)
- [ ] Request logging middleware
- [ ] Request ID generation and tracking
- [ ] Log rotation configuration
- [ ] Frontend error handler
- [ ] Toast notification system
- [ ] Health check endpoint
- [ ] Audit logging for sensitive operations
- [ ] Error tracking integration (optional: Sentry, Rollbar)

### 4.2 Authentication & Authorization

**Philosophy**: Simple, secure authentication for a single admin user. No database needed - use file-based sessions and environment variables for credentials.

#### 4.2.1 Authentication Strategy

**Single Admin User Model**:
- Admin credentials stored in environment variables (`.env`)
- Password hashed with bcrypt (stored hash in env or first-run setup)
- Session-based authentication (not JWT - simpler for single-page admin)
- Sessions stored in encrypted files or in-memory with persistence

**Why Session-Based**:
- Simpler than JWT for single-user admin panel
- Can be easily invalidated server-side
- Works well with CSRF protection
- No token refresh complexity

#### 4.2.2 Session Management

**Session Storage** (`backend/internal/session/storage.go`):
```go
type Session struct {
    ID        string    `json:"id"`
    Username  string    `json:"username"`
    CreatedAt time.Time `json:"created_at"`
    ExpiresAt time.Time `json:"expires_at"`
    IPAddress string    `json:"ip_address"`
    UserAgent string    `json:"user_agent"`
}

type SessionStore interface {
    Create(username, ipAddress, userAgent string) (*Session, error)
    Get(sessionID string) (*Session, error)
    Delete(sessionID string) error
    Cleanup() error // Remove expired sessions
}
```

**Implementation Options**:

1. **File-Based Sessions** (Recommended for simplicity):
   ```go
   // Store sessions in data/sessions/{session-id}.json
   // Encrypted with SESSION_SECRET from environment
   // Automatic cleanup on server start and periodically
   ```

2. **In-Memory with Persistence**:
   ```go
   // Keep sessions in memory map with RW mutex
   // Persist to file periodically for server restarts
   // Cleanup expired sessions every hour
   ```

**Session Configuration**:
- Session duration: 24 hours (configurable)
- Extend session on activity: Yes
- Session cookie name: `photoadmin_session`
- Cookie settings:
  - `HttpOnly: true` (prevent XSS)
  - `Secure: true` (HTTPS only in production)
  - `SameSite: Strict` (CSRF protection)
  - `Path: /admin`

#### 4.2.3 Authentication Flow

**Login Process**:
```
1. User visits /admin → Redirected to /admin/login
2. User submits credentials
3. Backend verifies against env variables
4. Create session and set cookie
5. Redirect to /admin/dashboard
```

**Login Handler** (`backend/internal/handlers/auth.go`):
```go
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
    var req struct {
        Username string `json:"username"`
        Password string `json:"password"`
    }

    json.NewDecoder(r.Body).Decode(&req)

    // Verify credentials
    if !h.verifyCredentials(req.Username, req.Password) {
        // Add rate limiting here
        http.Error(w, "Invalid credentials", http.StatusUnauthorized)
        return
    }

    // Create session
    session, err := h.sessions.Create(
        req.Username,
        getIPAddress(r),
        r.UserAgent(),
    )
    if err != nil {
        http.Error(w, "Session creation failed", http.StatusInternalServerError)
        return
    }

    // Set session cookie
    http.SetCookie(w, &http.Cookie{
        Name:     "photoadmin_session",
        Value:    session.ID,
        Path:     "/admin",
        HttpOnly: true,
        Secure:   h.config.Production,
        SameSite: http.SameSiteStrictMode,
        Expires:  session.ExpiresAt,
    })

    // Generate CSRF token
    csrfToken := h.generateCSRFToken(session.ID)

    json.NewEncoder(w).Encode(map[string]string{
        "status": "success",
        "csrf_token": csrfToken,
    })
}
```

**Logout Handler**:
```go
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
    cookie, err := r.Cookie("photoadmin_session")
    if err == nil {
        h.sessions.Delete(cookie.Value)
    }

    // Clear cookie
    http.SetCookie(w, &http.Cookie{
        Name:     "photoadmin_session",
        Value:    "",
        Path:     "/admin",
        MaxAge:   -1,
        HttpOnly: true,
    })

    w.WriteHeader(http.StatusOK)
}
```

#### 4.2.4 Authentication Middleware

**Auth Middleware** (`backend/internal/middleware/auth.go`):
```go
func RequireAuth(sessions SessionStore) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            // Get session cookie
            cookie, err := r.Cookie("photoadmin_session")
            if err != nil {
                http.Error(w, "Unauthorized", http.StatusUnauthorized)
                return
            }

            // Validate session
            session, err := sessions.Get(cookie.Value)
            if err != nil || session.ExpiresAt.Before(time.Now()) {
                http.Error(w, "Session expired", http.StatusUnauthorized)
                return
            }

            // Optional: Verify IP and User-Agent match
            if session.IPAddress != getIPAddress(r) {
                // Log suspicious activity
                http.Error(w, "Session invalid", http.StatusUnauthorized)
                return
            }

            // Add session to context
            ctx := context.WithValue(r.Context(), "session", session)
            next.ServeHTTP(w, r.WithContext(ctx))
        })
    }
}
```

**Usage**:
```go
// Apply to all admin routes
adminRouter := chi.NewRouter()
adminRouter.Use(RequireAuth(sessionStore))
adminRouter.Post("/api/admin/albums", albumHandler.Create)
adminRouter.Put("/api/admin/albums/{id}", albumHandler.Update)
// ... all other admin endpoints
```

#### 4.2.5 CSRF Protection

**CSRF Token Generation**:
```go
// Generate CSRF token = HMAC(session_id, csrf_secret)
func generateCSRFToken(sessionID string, secret []byte) string {
    h := hmac.New(sha256.New, secret)
    h.Write([]byte(sessionID))
    return base64.StdEncoding.EncodeToString(h.Sum(nil))
}

func validateCSRFToken(sessionID, token string, secret []byte) bool {
    expected := generateCSRFToken(sessionID, secret)
    return hmac.Equal([]byte(expected), []byte(token))
}
```

**CSRF Middleware**:
```go
func CSRFProtection(secret []byte) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            // Only check on state-changing methods
            if r.Method == "GET" || r.Method == "HEAD" || r.Method == "OPTIONS" {
                next.ServeHTTP(w, r)
                return
            }

            // Get CSRF token from header
            token := r.Header.Get("X-CSRF-Token")
            if token == "" {
                http.Error(w, "CSRF token missing", http.StatusForbidden)
                return
            }

            // Get session
            session := r.Context().Value("session").(*Session)

            // Validate token
            if !validateCSRFToken(session.ID, token, secret) {
                http.Error(w, "CSRF token invalid", http.StatusForbidden)
                return
            }

            next.ServeHTTP(w, r)
        })
    }
}
```

**Frontend Usage**:
```typescript
// Store CSRF token from login response
let csrfToken = '';

async function login(username: string, password: string) {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    csrfToken = data.csrf_token;
}

// Include in all admin API calls
async function updateAlbum(albumId: string, data: any) {
    await fetch(`/api/admin/albums/${albumId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify(data)
    });
}
```

#### 4.2.6 Password Management

**Initial Setup**:
```bash
# On first run, generate admin password hash
go run cmd/admin-setup/main.go

# Prompts for password, outputs hash to add to .env:
# ADMIN_PASSWORD_HASH=\$2a\$10\$...
```

**Environment Variables**:
```bash
# .env
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=\$2a\$10\$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

# Session encryption
SESSION_SECRET=<64-char-hex-string>
CSRF_SECRET=<64-char-hex-string>

# Generate with:
# openssl rand -hex 32
```

**Password Verification**:
```go
func verifyPassword(password, hash string) bool {
    err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
    return err == nil
}
```

**Password Change Endpoint**:
```go
// POST /api/admin/auth/change-password
func (h *AuthHandler) ChangePassword(w http.ResponseWriter, r *http.Request) {
    var req struct {
        CurrentPassword string `json:"current_password"`
        NewPassword     string `json:"new_password"`
    }
    json.NewDecoder(r.Body).Decode(&req)

    // Verify current password
    if !h.verifyPassword(req.CurrentPassword, h.config.PasswordHash) {
        http.Error(w, "Current password incorrect", http.StatusUnauthorized)
        return
    }

    // Validate new password (min 12 chars, complexity requirements)
    if len(req.NewPassword) < 12 {
        http.Error(w, "Password too short", http.StatusBadRequest)
        return
    }

    // Hash new password
    hash, _ := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)

    // Update .env file (or prompt to update manually)
    fmt.Fprintf(w, "New password hash:\nADMIN_PASSWORD_HASH=%s\n", hash)
}
```

#### 4.2.7 Rate Limiting

**Login Rate Limiting**:
```go
// Prevent brute force attacks
// Max 5 login attempts per IP per 15 minutes

type RateLimiter struct {
    attempts map[string][]time.Time
    mu       sync.Mutex
}

func (rl *RateLimiter) AllowLogin(ip string) bool {
    rl.mu.Lock()
    defer rl.mu.Unlock()

    now := time.Now()
    cutoff := now.Add(-15 * time.Minute)

    // Clean old attempts
    recent := []time.Time{}
    for _, t := range rl.attempts[ip] {
        if t.After(cutoff) {
            recent = append(recent, t)
        }
    }

    rl.attempts[ip] = recent

    // Check limit
    if len(recent) >= 5 {
        return false
    }

    // Record attempt
    rl.attempts[ip] = append(recent, now)
    return true
}
```

#### 4.2.8 Security Headers

**Add security headers to all admin responses**:
```go
func SecurityHeaders(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("X-Content-Type-Options", "nosniff")
        w.Header().Set("X-Frame-Options", "DENY")
        w.Header().Set("X-XSS-Protection", "1; mode=block")
        w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
        w.Header().Set("Content-Security-Policy", "default-src 'self'")
        next.ServeHTTP(w, r)
    })
}
```

#### 4.2.9 Implementation Checklist

**Backend**:
- [ ] Session store implementation (file-based or in-memory)
- [ ] Login handler with bcrypt verification
- [ ] Logout handler
- [ ] Session cleanup task (runs hourly)
- [ ] Auth middleware for protected routes
- [ ] CSRF token generation and validation
- [ ] CSRF middleware
- [ ] Rate limiting for login attempts
- [ ] Security headers middleware
- [ ] Password change endpoint
- [ ] Admin setup CLI tool for initial password

**Frontend**:
- [ ] Login page component
- [ ] Login form with validation
- [ ] Store session/CSRF token
- [ ] Include CSRF token in all API calls
- [ ] Handle 401 responses (redirect to login)
- [ ] Logout button in admin header
- [ ] Session expiration warning (show modal 5 mins before expiry)
- [ ] Auto-logout on session expiration

**Environment/Config**:
- [ ] Add auth variables to `.env.example`
- [ ] Document session configuration options
- [ ] Add password requirements to docs
- [ ] Security best practices documentation

### 4.3 JSON File Management Service
- [ ] Atomic file read/write operations
- [ ] File locking mechanism
- [ ] Backup before write
- [ ] Validation before saving
- [ ] Rollback capability

### 4.4 Image Processing Service

**Philosophy**: Professional photography requires careful handling - preserve originals, generate optimized versions for web.

#### 4.4.1 Upload Constraints and Validation

**File Size Limits**:
- **Single file maximum**: 50 MB (configurable)
- **Batch upload maximum**: 500 MB total (configurable)
- **Max files per batch**: 50 files (configurable)
- **Rationale**: Balance between professional photography file sizes and server resources

**Allowed File Types**:
- **JPEG**: `.jpg`, `.jpeg` (most common)
- **PNG**: `.png` (transparency support)
- **WebP**: `.webp` (modern format)
- **HEIC**: `.heic`, `.heif` (iPhone photos)
- **Future**: RAW formats (`.cr2`, `.nef`, `.arw`, `.dng`) - requires additional processing

**File Type Detection**:
- **DO NOT trust file extension** - validate via magic bytes
- Use Go's `http.DetectContentType()` or `github.com/h2non/filetype`
- Reject files that don't match expected image MIME types

**Image Dimension Validation**:
- **Minimum dimensions**: 800px on shortest side
  - Ensures quality - reject tiny images
  - Professional photos should be high resolution
- **Maximum dimensions**: 12000px on longest side
  - Prevents abuse with extremely large files
  - Most professional cameras: 6000-9000px
  - Medium format: up to 12000px
- **Aspect ratio**: No restrictions (support panoramas, squares, etc.)

**Filename Sanitization**:
- Original filename stored in metadata but not used for storage
- Storage filename: UUID + `.webp` (or original extension for originals)
- Reject filenames with path traversal attempts (`../`, `..\\`)
- Strip special characters that could cause filesystem issues

**Configuration** (`.env` or `site_config.json`):
```go
type UploadConfig struct {
    MaxFileSizeMB      int    `json:"max_file_size_mb"`      // Default: 50
    MaxBatchSizeMB     int    `json:"max_batch_size_mb"`     // Default: 500
    MaxFilesPerBatch   int    `json:"max_files_per_batch"`   // Default: 50
    MinDimensionPx     int    `json:"min_dimension_px"`      // Default: 800
    MaxDimensionPx     int    `json:"max_dimension_px"`      // Default: 12000
    AllowedFormats     []string `json:"allowed_formats"`     // Default: ["jpeg", "png", "webp", "heic"]
    EnableRAWSupport   bool   `json:"enable_raw_support"`    // Default: false
}
```

#### 4.4.2 Upload Validation Pipeline

**Step 1: Pre-Upload Validation (Frontend)**:
```typescript
// Check before upload starts
function validateFileBeforeUpload(file: File): ValidationError | null {
    // Check file size
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
        return { field: 'size', message: `File too large: ${formatBytes(file.size)}. Max: 50MB` };
    }

    // Check file type (preliminary)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (!allowedTypes.includes(file.type) && !file.type.startsWith('image/')) {
        return { field: 'type', message: 'Invalid file type. Please upload an image.' };
    }

    // Check filename
    if (file.name.includes('../') || file.name.includes('..\\')) {
        return { field: 'name', message: 'Invalid filename.' };
    }

    return null;
}

function validateBatch(files: File[]): ValidationError | null {
    if (files.length > 50) {
        return { field: 'count', message: `Too many files. Max: 50. Selected: ${files.length}` };
    }

    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    const maxBatchSize = 500 * 1024 * 1024; // 500MB
    if (totalSize > maxBatchSize) {
        return { field: 'batch_size', message: `Batch too large: ${formatBytes(totalSize)}. Max: 500MB` };
    }

    return null;
}
```

**Step 2: Backend Upload Validation**:
```go
// backend/internal/handlers/upload.go
func (h *UploadHandler) ValidateUpload(r *http.Request) error {
    // Parse multipart form with size limit
    err := r.ParseMultipartForm(h.config.MaxBatchSizeMB << 20) // Convert MB to bytes
    if err != nil {
        return fmt.Errorf("batch size exceeds limit: %w", err)
    }

    files := r.MultipartForm.File["photos"]

    // Validate batch count
    if len(files) > h.config.MaxFilesPerBatch {
        return fmt.Errorf("too many files: %d (max: %d)", len(files), h.config.MaxFilesPerBatch)
    }

    // Validate each file
    for _, fileHeader := range files {
        if err := h.validateSingleFile(fileHeader); err != nil {
            return err
        }
    }

    return nil
}

func (h *UploadHandler) validateSingleFile(fileHeader *multipart.FileHeader) error {
    // Check size
    maxBytes := int64(h.config.MaxFileSizeMB << 20)
    if fileHeader.Size > maxBytes {
        return fmt.Errorf("file %s too large: %d bytes (max: %d)",
            fileHeader.Filename, fileHeader.Size, maxBytes)
    }

    // Open file to validate content
    file, err := fileHeader.Open()
    if err != nil {
        return err
    }
    defer file.Close()

    // Read first 512 bytes for content type detection
    buffer := make([]byte, 512)
    _, err = file.Read(buffer)
    if err != nil {
        return err
    }

    // Detect content type via magic bytes
    contentType := http.DetectContentType(buffer)
    if !h.isAllowedContentType(contentType) {
        return fmt.Errorf("invalid content type: %s", contentType)
    }

    // Reset file pointer for further processing
    file.Seek(0, 0)

    // Decode image to validate it's actually an image and get dimensions
    img, format, err := image.Decode(file)
    if err != nil {
        return fmt.Errorf("invalid image file: %w", err)
    }

    // Validate dimensions
    bounds := img.Bounds()
    width := bounds.Dx()
    height := bounds.Dy()

    minDim := min(width, height)
    maxDim := max(width, height)

    if minDim < h.config.MinDimensionPx {
        return fmt.Errorf("image too small: %dx%d (min: %dpx on shortest side)",
            width, height, h.config.MinDimensionPx)
    }

    if maxDim > h.config.MaxDimensionPx {
        return fmt.Errorf("image too large: %dx%d (max: %dpx on longest side)",
            width, height, h.config.MaxDimensionPx)
    }

    return nil
}

func (h *UploadHandler) isAllowedContentType(contentType string) bool {
    allowed := []string{
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/heic",
    }

    for _, allowed := range allowed {
        if contentType == allowed {
            return true
        }
    }

    return false
}
```

**Step 3: Error Handling and User Feedback**:
```go
// Return detailed validation errors to frontend
type UploadError struct {
    Filename string `json:"filename"`
    Error    string `json:"error"`
    Field    string `json:"field"` // size, type, dimensions, etc.
}

type UploadResponse struct {
    Success    []PhotoMetadata `json:"success"`    // Successfully uploaded photos
    Failed     []UploadError   `json:"failed"`     // Failed uploads with reasons
    TotalCount int            `json:"total_count"`
}
```

**Frontend Error Display**:
```typescript
// Show validation errors in upload dialog
function displayUploadResults(response: UploadResponse) {
    if (response.success.length > 0) {
        showNotification(`Successfully uploaded ${response.success.length} photos`, 'success');
    }

    if (response.failed.length > 0) {
        // Show detailed error list
        const errorList = response.failed.map(err =>
            `${err.filename}: ${err.error}`
        ).join('\n');

        showErrorDialog(
            `${response.failed.length} files failed to upload`,
            errorList
        );
    }
}
```

#### 4.4.3 Disk Space Management

**Check Available Space Before Upload**:
```go
func (h *UploadHandler) checkDiskSpace(requiredBytes int64) error {
    var stat syscall.Statfs_t
    syscall.Statfs(h.config.UploadPath, &stat)

    availableBytes := stat.Bavail * uint64(stat.Bsize)

    // Require 3x the upload size (original + display + thumbnail)
    // Plus 20% buffer for safety
    requiredWithBuffer := uint64(requiredBytes) * 3 * 120 / 100

    if availableBytes < requiredWithBuffer {
        return fmt.Errorf("insufficient disk space: %d bytes available, %d required",
            availableBytes, requiredWithBuffer)
    }

    return nil
}
```

**Disk Space Warning in Admin UI**:
```typescript
// Show disk space warning in dashboard
interface DiskSpaceInfo {
    total_gb: number;
    used_gb: number;
    available_gb: number;
    percent_used: number;
}

// GET /api/admin/system/disk-space
async function checkDiskSpace(): Promise<DiskSpaceInfo> {
    const response = await fetch('/api/admin/system/disk-space');
    return response.json();
}

// Display warning if > 85% full
if (diskSpace.percent_used > 85) {
    showWarning(`Disk space low: ${diskSpace.available_gb}GB remaining`);
}
```

#### 4.4.4 Upload Pipeline
- [ ] Multi-file upload handler (drag-drop or click-to-upload)
- [ ] **File validation** (size, type, dimensions, magic bytes)
- [ ] **Disk space check** before processing
- [ ] **Sanitize filenames** for security
- [ ] Progress tracking for batch uploads
- [ ] Unique filename generation (UUID-based)
- [ ] Concurrent processing (process multiple images in parallel)
- [ ] **Detailed error reporting** for failed uploads
- [ ] **Partial success handling** (some files succeed, some fail)

#### Image Processing Workflow
When an image is uploaded, the backend creates three versions:

1. **Original** (`/static/uploads/originals/`)
   - [ ] Store untouched original file
   - [ ] Preserve original filename in metadata
   - [ ] No compression, no resizing

2. **Display Version** (`/static/uploads/display/`)
   - [ ] Target: 3840px on longest side (optimized for 4K displays)
   - [ ] Format: WebP with quality 85
   - [ ] Maintain aspect ratio
   - [ ] Strip EXIF (privacy - except for display purposes)
   - [ ] Target file size: ~800KB-1.5MB (acceptable for beautiful 4K viewing)

3. **Thumbnail** (`/static/uploads/thumbnails/`)
   - [ ] Target: 800px on longest side
   - [ ] Format: WebP with quality 80
   - [ ] Maintain aspect ratio
   - [ ] Target file size: ~50-100KB

#### EXIF Processing
- [ ] Extract EXIF from original using Go library (e.g., `github.com/rwcarlsen/goexif`)
- [ ] Parse camera, lens, ISO, aperture, shutter speed, focal length
- [ ] Store in photo metadata (albums.json)
- [ ] Extract date taken for sorting

#### Storage Organization
```
/static/uploads/
├── originals/
│   └── <uuid>.<original-ext>  (e.g., abc123.jpg, def456.cr2)
├── display/
│   └── <uuid>.webp
└── thumbnails/
    └── <uuid>.webp
```

#### Image Libraries (Go)
- [ ] `github.com/disintegration/imaging` - Image resizing and processing
- [ ] `github.com/rwcarlsen/goexif` - EXIF extraction
- [ ] Native `image/jpeg`, `image/png` support
- [ ] WebP encoding support

#### Future Enhancement: RAW Support
- Consider adding RAW file support (CR2, NEF, ARW) with `dcraw` or similar
- Generate JPEG from RAW for web versions

### 4.5 Admin API Endpoints

#### Album Management
- `GET /api/admin/albums` - List all albums
- `GET /api/admin/albums/:id` - Get album details
- `POST /api/admin/albums` - Create new album
- `PUT /api/admin/albums/:id` - Update album metadata (title, subtitle, visibility, etc.)
- `DELETE /api/admin/albums/:id` - Delete album (and optionally photos)
- `POST /api/admin/albums/:id/set-cover` - Set cover photo for album
- `POST /api/admin/albums/:id/reorder` - Reorder photos in album

#### Photo Upload & Management
**Upload Workflow**:
1. Admin selects/creates album
2. Uploads photos to that album
3. Backend processes: original → display → thumbnail
4. Returns photo metadata

Endpoints:
- `POST /api/admin/albums/:id/photos/upload` - Upload photos to album (multipart form)
  - Accepts multiple files
  - Returns array of photo objects with IDs
  - Processing happens asynchronously, returns immediately with status
- `GET /api/admin/albums/:id/photos/upload-status/:batchId` - Check upload batch status
- `PUT /api/admin/albums/:id/photos/:photoId` - Update photo metadata (caption, alt text, order)
- `DELETE /api/admin/albums/:id/photos/:photoId` - Delete photo from album
- `POST /api/admin/albums/:id/photos/reorder` - Reorder photos in album

#### Password Management
- `POST /api/admin/albums/:id/set-password` - Set or update password for album
  - Body: `{ "password": "plaintext" }`
  - Backend bcrypts and stores hash
- `DELETE /api/admin/albums/:id/password` - Remove password protection

#### Main Portfolio Album
- `PUT /api/admin/config/main-portfolio-album` - Set which album is the main portfolio
  - Body: `{ "album_id": "uuid" }`
  - Updates `site_config.json`

#### Blog Management
- `GET /api/admin/blog` - List posts
- `POST /api/admin/blog` - Create post
- `PUT /api/admin/blog/:id` - Update post
- `DELETE /api/admin/blog/:id` - Delete post
- `POST /api/admin/blog/:id/publish` - Publish post
- `POST /api/admin/blog/:id/unpublish` - Unpublish post

#### Media Management
- `POST /api/admin/upload` - Upload images
- `GET /api/admin/media` - List uploaded media
- `DELETE /api/admin/media/:id` - Delete media

#### Site Configuration / Settings
- `GET /api/admin/settings` - Get complete site configuration
- `PUT /api/admin/settings` - Update entire site configuration
- `PATCH /api/admin/settings/:section` - Update specific section (site, owner, social, branding, etc.)
  - Examples:
    - `PATCH /api/admin/settings/site` - Update site settings only
    - `PATCH /api/admin/settings/branding` - Update branding only
- `POST /api/admin/settings/upload-logo` - Upload logo image
- `POST /api/admin/settings/upload-favicon` - Upload favicon
- `POST /api/admin/settings/upload-watermark` - Upload watermark image
- `GET /api/admin/settings/preview` - Preview current settings

#### Analytics Tracking (Public, No Auth Required)
**Public endpoints** - accessible from static site, no authentication:
- `POST /api/analytics/album-view` - Track album view
- `POST /api/analytics/photo-view` - Track photo view in lightbox
- `POST /api/analytics/photo-download` - Track photo download
- `POST /api/analytics/album-download` - Track album download
- `POST /api/analytics/page-view` - Track general page view

**Request format** (all endpoints):
```json
{
  "event": "album-view",
  "data": {
    "album_id": "uuid",
    "album_slug": "wedding-2024"
  },
  "timestamp": "ISO8601",
  "referrer": "...",
  "user_agent": "..."
}
```

**Response**: `202 Accepted` (fire and forget, no response body needed)

**Admin analytics endpoints** (auth required):
- `GET /api/admin/analytics/overview` - Dashboard overview stats
  - Total views, downloads, unique visitors (last 7/30/90 days)
- `GET /api/admin/analytics/albums` - Album-specific stats
  - Views and downloads per album, sortable
  - Query params: `?days=30&sort=views&order=desc`
- `GET /api/admin/analytics/photos` - Photo-specific stats
  - Most viewed/downloaded photos
  - Query params: `?album_id=uuid&days=30`
- `GET /api/admin/analytics/referrers` - Top referrers
- `GET /api/admin/analytics/timeline` - Time-series data for charts
  - Daily/weekly/monthly aggregates
  - Query params: `?period=daily&days=30`

### 4.6 Admin UI (Server-Rendered HTML)

#### Dashboard
- [ ] Overview stats
  - Total albums (public, unlisted, password-protected)
  - Total photos
  - Storage usage
  - Recent uploads
  - **Analytics summary** (last 7 days):
    - Total page views
    - Total album views
    - Total downloads
    - Trending albums (most viewed)
- [ ] Quick actions
  - Create new album
  - Upload to main portfolio
  - Jump to blog
  - View full analytics
- [ ] Charts/visualizations
  - Views over time (sparkline/mini chart)
  - Top 5 albums by views

#### Album Management Page
**Main View** - Album List:
- [ ] Grid/list view of all albums
- [ ] Show album cover, title, visibility status
- [ ] Filter by visibility (all, public, unlisted, password-protected)
- [ ] Search by album name
- [ ] "Create New Album" button
- [ ] Quick actions: Edit, Delete, View Public URL

**Album Editor** - Edit Single Album:
- [ ] Album metadata form
  - Title (required)
  - Subtitle (optional)
  - Description (rich text)
  - Visibility dropdown (public, unlisted, password_protected)
  - Password field (shown only if password_protected)
  - Allow downloads toggle
  - Expiration date (optional, datepicker)
- [ ] Photo upload zone
  - Drag-drop area
  - Click to browse files
  - Multi-file selection
  - Upload progress bar with thumbnails
  - Processing status indicator
- [ ] Photo grid view
  - Thumbnails of all photos in album
  - Drag-drop reordering
  - Click photo to edit caption/alt text
  - "Set as Cover" button on each photo
  - Delete photo button
  - Current cover photo highlighted
- [ ] Cover photo display
  - Large preview of current cover
  - "Select Cover Photo" flow
- [ ] Save/Cancel buttons

#### Main Portfolio Album Selector
- [ ] Dropdown or modal to select which album is the main portfolio
- [ ] Preview of selected album
- [ ] "Set as Main Portfolio" button

#### Blog Editor
- [ ] Rich text editor (e.g., TinyMCE, Quill)
- [ ] Preview mode
- [ ] Publish/unpublish toggle
- [ ] Featured image upload

#### Settings Page
**Comprehensive settings management with tabbed/sectioned interface**

**Main Layout**:
- [ ] Tabbed or sidebar navigation for different setting sections
- [ ] "Save Changes" button (sticky at bottom or top)
- [ ] "Reset to Default" option with confirmation
- [ ] Unsaved changes warning
- [ ] Real-time preview option (optional)

**Section 1: General Settings**
- [ ] Site title (required field)
- [ ] Site tagline/subtitle
- [ ] Site description (textarea)
- [ ] Language dropdown
- [ ] Timezone selector

**Section 2: Owner Information**
- [ ] Owner name
- [ ] Bio (rich text editor with Markdown support)
- [ ] Email address
- [ ] Phone number
- [ ] Location

**Section 3: Social Media**
- [ ] Input fields for each platform:
  - Instagram, Facebook, Twitter, LinkedIn
  - YouTube, Pinterest, TikTok
- [ ] Add custom social link button
  - Label input
  - URL input
  - Remove button for each custom link
- [ ] Preview of how social links will appear

**Section 4: Branding**
- [ ] Logo upload
  - Image preview
  - Drag-drop or click to upload
  - Recommended dimensions displayed
- [ ] Favicon upload
  - Preview
  - Format requirements (ICO, PNG)
- [ ] Color scheme
  - Primary color picker
  - Secondary color picker
  - Accent color picker
  - Preview of color scheme
- [ ] Typography
  - Heading font dropdown (Google Fonts)
  - Body font dropdown (Google Fonts)
  - Font preview
- [ ] Custom CSS
  - Upload custom CSS file (optional)
  - Or paste CSS in textarea

**Section 5: Portfolio Settings**
- [ ] Main portfolio album selector
  - Dropdown of all albums
  - Preview of selected album
- [ ] Default photo layout (masonry, grid, justified)
- [ ] Show EXIF data toggle
- [ ] Enable lightbox toggle
- [ ] Show photo count toggle

**Section 6: Navigation**
- [ ] Toggle switches for each nav item:
  - Show Home
  - Show Albums
  - Show Blog
  - Show About
  - Show Contact
- [ ] Custom navigation links
  - Add custom link button
  - Label, URL, order inputs
  - Drag-drop reordering
- [ ] Preview of navigation menu

**Section 7: Features**
- [ ] Enable/disable toggles:
  - Blog
  - Contact form
  - Newsletter signup (future)
  - Comments (future)
  - Analytics

**Section 8: SEO & Analytics**
- [ ] Meta title
- [ ] Meta description
- [ ] Meta keywords (tag input)
- [ ] Open Graph image upload
- [ ] Google Analytics ID
- [ ] Google Site Verification code
- [ ] Robots.txt settings
  - Allow indexing toggle
  - Custom robots.txt (textarea)

**Section 9: Contact Settings**
- [ ] Display options toggles:
  - Show email
  - Show phone
  - Show address
- [ ] Contact form recipient email
- [ ] Inquiry types (tags input)
  - Add/remove inquiry types
  - Reorder via drag-drop

**Section 10: Gallery Defaults**
- [ ] Default visibility (public, unlisted, password_protected)
- [ ] Default allow downloads toggle
- [ ] Watermark settings
  - Enable watermark on downloads
  - Upload watermark image
  - Watermark position (corner selector)
  - Watermark opacity slider

**Section 11: Admin Preferences**
- [ ] Items per page (number input)
- [ ] Auto-save drafts toggle
- [ ] Show storage warnings toggle
- [ ] Admin email notifications
  - New comments (future)
  - Contact form submissions
  - Storage threshold alerts

**Section 12: System & Maintenance**
- [ ] Storage statistics
  - Total storage used
  - Storage by type (originals, display, thumbnails)
  - Number of albums, photos
  - Chart/visualization
- [ ] Admin password change
  - Current password
  - New password
  - Confirm password
- [ ] Backup & Export
  - Download all data as ZIP button
  - Download site_config.json
  - Export albums metadata
  - Import configuration
- [ ] System information (read-only)
  - Version number
  - Last updated timestamp
  - Go version
  - Total uptime

**UI/UX Considerations**:
- [ ] Form validation with inline error messages
- [ ] Success notifications after save
- [ ] Unsaved changes prompt before leaving page
- [ ] Collapsible sections to reduce visual clutter
- [ ] Search/filter for finding specific settings
- [ ] Keyboard shortcuts (Cmd/Ctrl+S to save)
- [ ] Mobile-responsive layout

#### Analytics Page

**Purpose**: View detailed analytics about site usage, album performance, and photo downloads.

**Route**: `/admin/analytics`

**Layout**:
```
┌────────────────────────────────────────────┐
│ Analytics                                  │
├────────────────────────────────────────────┤
│ Time Period: [Last 7 days ▼]              │
├─────────────┬─────────────┬────────────────┤
│ Total Views │ Total       │ Unique         │
│    12,345   │ Downloads   │ Visitors       │
│             │    1,234    │    3,456       │
└─────────────┴─────────────┴────────────────┘

Album Performance
┌─────────────────────────────────────────────┐
│ Album Name      │ Views │ Downloads │ Rate  │
├─────────────────┼───────┼───────────┼───────┤
│ Portfolio       │ 8,234 │    456    │ 5.5%  │
│ Wedding 2024    │ 1,205 │    234    │ 19.4% │
│ Landscapes      │   876 │     45    │ 5.1%  │
└─────────────────┴───────┴───────────┴───────┘

Photo Performance (Top 10)
┌─────────────────────────────────────────────┐
│ [Thumbnail] Album       │ Views │ Downloads │
├────────────────────────┼───────┼───────────┤
│ [IMG] Portfolio         │ 1,234 │    123    │
│ [IMG] Wedding 2024      │   987 │     89    │
└────────────────────────┴───────┴───────────┘

Referrer Sources
┌─────────────────────────────────────────────┐
│ Source              │ Views │ Percentage    │
├─────────────────────┼───────┼───────────────┤
│ Direct              │ 5,678 │    46%        │
│ google.com          │ 3,456 │    28%        │
│ instagram.com       │ 1,234 │    10%        │
└─────────────────────┴───────┴───────────────┘

Timeline Chart
┌─────────────────────────────────────────────┐
│     │                                        │
│ 500 │     ╱╲                                │
│ 400 │    ╱  ╲      ╱╲                       │
│ 300 │   ╱    ╲    ╱  ╲                      │
│ 200 │  ╱      ╲  ╱    ╲    ╱╲               │
│ 100 │╱         ╲╱      ╲  ╱  ╲              │
│   0 └───────────────────────────────────────│
│     Mon  Tue  Wed  Thu  Fri  Sat  Sun       │
└─────────────────────────────────────────────┘

[Export CSV] [Export JSON]
```

**Features**:
- [ ] Time period selector (last 7 days, 30 days, 90 days, all time)
- [ ] Overview stats cards
  - Total views across all content
  - Total downloads
  - Unique visitors (based on IP hash)
- [ ] Album performance table
  - Sortable by views, downloads, download rate
  - Shows public vs private albums
  - Click to see individual photo stats
- [ ] Top performing photos
  - Thumbnail preview
  - Views and download counts
  - Link to edit photo
- [ ] Referrer statistics
  - Top traffic sources
  - Percentage breakdown
  - Link to view details
- [ ] Timeline visualization
  - Line chart showing views/downloads over time
  - Toggle between daily and cumulative views
  - Responsive chart using Chart.js or D3.js
- [ ] Export functionality
  - Export to CSV for spreadsheet analysis
  - Export to JSON for custom processing
- [ ] Real-time updates
  - Auto-refresh every 30 seconds (optional)
  - Manual refresh button

**API Endpoints Used**:
```typescript
// Overview stats
GET /api/admin/analytics/overview?period=7d
Response: {
  total_views: 12345,
  total_downloads: 1234,
  unique_visitors: 3456,
  period: "7d"
}

// Album performance
GET /api/admin/analytics/albums?period=7d&sort=views&order=desc
Response: {
  albums: [
    {
      album_id: "uuid",
      album_name: "Portfolio",
      album_slug: "portfolio",
      views: 8234,
      downloads: 456,
      download_rate: 0.055
    }
  ]
}

// Photo performance
GET /api/admin/analytics/photos?limit=10&sort=views&order=desc
Response: {
  photos: [
    {
      photo_id: "uuid",
      album_id: "uuid",
      album_name: "Portfolio",
      filename: "sunset.jpg",
      thumbnail_url: "/data/photos/...",
      views: 1234,
      downloads: 123
    }
  ]
}

// Referrer stats
GET /api/admin/analytics/referrers?period=7d
Response: {
  referrers: [
    { source: "Direct", views: 5678, percentage: 46 },
    { source: "google.com", views: 3456, percentage: 28 }
  ]
}

// Timeline data
GET /api/admin/analytics/timeline?period=7d&metric=views
Response: {
  timeline: [
    { date: "2024-01-01", views: 234, downloads: 23 },
    { date: "2024-01-02", views: 345, downloads: 34 }
  ]
}

// Export
GET /api/admin/analytics/export?period=7d&format=csv
Response: CSV file download
```

**Implementation Notes**:
- Analytics data is read from SQLite database (Phase 2.2)
- All queries should be efficient with proper indexes
- Cache aggregated stats for common time periods
- Daily stats table provides fast queries for historical data
- Privacy: Only show hashed IPs, never raw IPs
- Consider data retention policy (90 days by default)

---

## Phase 5: Integration & Build System (Week 9)

### 5.1 Bazel Build Targets
- [ ] `//frontend:dev_server` - Run frontend dev server
- [ ] `//frontend:build` - Build frontend for production
- [ ] `//backend:admin_server` - Build and run admin server
- [ ] `//:deploy` - Build everything for deployment

### 5.2 Development Workflow
- [ ] Script to initialize data JSON files with defaults
- [ ] Script to run both frontend and backend concurrently
- [ ] Hot-reload configuration
- [ ] Development environment documentation

### 5.3 Testing Strategy (Simplified)

> **MVP Approach**: Start with pre-commit hooks + manual E2E testing. Add comprehensive automated testing in Phase 8.

**Initial Testing**:
- ✅ **Pre-commit hooks**: Linting, formatting, type-checking (automated)
- ✅ **Manual E2E**: Key workflows tested manually before each release
- ✅ **Critical unit tests**: Core business logic only (auth, file I/O)

**Defer to Phase 8**:
- Component tests for all Lit components
- Integration tests for API endpoints
- Automated E2E test suite
- Code coverage requirements

#### 5.3.1 Pre-commit Quality Checks

Already configured in Phase 1.5:
- Linting (ESLint for TS, golangci-lint for Go)
- Formatting (Prettier, gofmt)
- Type checking (tsc --noEmit)
- JSON/YAML validation
- Secret detection

#### 5.3.2 Critical Unit Tests (Minimal Set)

**Frontend** (`frontend/src/utils/`):
- [ ] `api.test.ts` - Data fetching and error handling
- [ ] `router.test.ts` - URL routing logic

**Backend** (`backend/internal/`):
- [ ] `models/album_test.go` - Album validation logic
- [ ] `services/file_service_test.go` - Atomic file writes
- [ ] `services/auth_service_test.go` - Password verification

**Test Framework Setup**:
```bash
# Frontend
cd frontend && npm install --save-dev vitest

# Backend (uses built-in go test)
# No additional dependencies needed
```

#### 5.3.3 Manual E2E Test Checklist

Test these key workflows manually before each release:

**Public Site**:
- [ ] Landing page loads and displays portfolio album
- [ ] Album list shows public albums
- [ ] Album detail page displays photos
- [ ] Lightbox opens, navigates (arrows, ESC works)
- [ ] Password-protected album requires password
- [ ] Correct password grants access
- [ ] Mobile responsive design works

**Admin**:
- [ ] Login with credentials
- [ ] Create new album
- [ ] Upload photos to album
- [ ] Edit album settings (title, visibility)
- [ ] Delete photo
- [ ] Delete album
- [ ] Logout works

#### 5.3.4 Test Automation (Phase 8)

Defer comprehensive automated testing to Phase 8:
- Playwright E2E test suite
- Component test coverage for all Lit components
- Integration tests for all API endpoints
- Code coverage targets (80%+)

---

mkdir -p "$BACKUP_ROOT"/{daily,weekly,monthly}

# 1. Backup data files (JSON, config, database)
log "Backing up data files..."
tar -czf "$BACKUP_ROOT/daily/data-${DATE}.tar.gz" \
    -C "$SITE_ROOT/data" \
    --exclude='logs' \
    --exclude='tmp' \
    --exclude='uploads' \
    --exclude='sessions/*.json' \
    .

DATA_SIZE=$(du -h "$BACKUP_ROOT/daily/data-${DATE}.tar.gz" | cut -f1)
log "Data backup complete: $DATA_SIZE"

# 2. Backup photos (originals only, incremental if possible)
log "Backing up photos..."
if command -v rsync &> /dev/null; then
    # Use rsync for incremental backups
    PHOTO_BACKUP_DIR="$BACKUP_ROOT/daily/photos-${DATE}"
    mkdir -p "$PHOTO_BACKUP_DIR"
    rsync -a --link-dest="$BACKUP_ROOT/daily/photos-latest" \
        "$SITE_ROOT/data/uploads/originals/" \
        "$PHOTO_BACKUP_DIR/"

    # Update "latest" symlink
    ln -snf "$PHOTO_BACKUP_DIR" "$BACKUP_ROOT/daily/photos-latest"

    # Create tarball for weekly/monthly rotation
    if [ "$(date +%u)" -eq 7 ] || [ "$(date +%d)" -eq 01 ]; then
        tar -czf "$BACKUP_ROOT/daily/photos-${DATE}.tar.gz" \
            -C "$PHOTO_BACKUP_DIR" .
    fi
else
    # Fallback: full tar backup
    tar -czf "$BACKUP_ROOT/daily/photos-${DATE}.tar.gz" \
        -C "$SITE_ROOT/data/uploads/originals" \
        .
fi

PHOTO_SIZE=$(du -sh "$BACKUP_ROOT/daily/photos-${DATE}"* | cut -f1)
log "Photo backup complete: $PHOTO_SIZE"

# 3. Weekly backup (every Sunday)
if [ "$(date +%u)" -eq 7 ]; then
    log "Creating weekly backup..."
    cp "$BACKUP_ROOT/daily/data-${DATE}.tar.gz" \
       "$BACKUP_ROOT/weekly/data-${WEEK}.tar.gz"

    if [ -f "$BACKUP_ROOT/daily/photos-${DATE}.tar.gz" ]; then
        cp "$BACKUP_ROOT/daily/photos-${DATE}.tar.gz" \
           "$BACKUP_ROOT/weekly/photos-${WEEK}.tar.gz"
    fi
fi

# 4. Monthly backup (first of month)
if [ "$(date +%d)" -eq 01 ]; then
    log "Creating monthly backup..."
    cp "$BACKUP_ROOT/daily/data-${DATE}.tar.gz" \
       "$BACKUP_ROOT/monthly/data-${MONTH}.tar.gz"

    if [ -f "$BACKUP_ROOT/daily/photos-${DATE}.tar.gz" ]; then
        cp "$BACKUP_ROOT/daily/photos-${DATE}.tar.gz" \
           "$BACKUP_ROOT/monthly/photos-${MONTH}.tar.gz"
    fi
fi

# 5. Cleanup old backups (retention policy)
log "Cleaning up old backups..."

# Remove old daily backups
find "$BACKUP_ROOT/daily" -name "data-*.tar.gz" -type f -mtime +$KEEP_DAILY -delete
find "$BACKUP_ROOT/daily" -name "photos-*.tar.gz" -type f -mtime +$KEEP_DAILY -delete

# Remove old weekly backups
cd "$BACKUP_ROOT/weekly" && ls -t data-*.tar.gz 2>/dev/null | tail -n +$((KEEP_WEEKLY + 1)) | xargs -r rm
cd "$BACKUP_ROOT/weekly" && ls -t photos-*.tar.gz 2>/dev/null | tail -n +$((KEEP_WEEKLY + 1)) | xargs -r rm

# Remove old monthly backups
cd "$BACKUP_ROOT/monthly" && ls -t data-*.tar.gz 2>/dev/null | tail -n +$((KEEP_MONTHLY + 1)) | xargs -r rm
cd "$BACKUP_ROOT/monthly" && ls -t photos-*.tar.gz 2>/dev/null | tail -n +$((KEEP_MONTHLY + 1)) | xargs -r rm

# 6. Backup summary
log "Backup complete!"
log "Total backup size: $(du -sh $BACKUP_ROOT | cut -f1)"
log "Daily backups: $(ls -1 $BACKUP_ROOT/daily/*.tar.gz 2>/dev/null | wc -l)"
log "Weekly backups: $(ls -1 $BACKUP_ROOT/weekly/*.tar.gz 2>/dev/null | wc -l)"
log "Monthly backups: $(ls -1 $BACKUP_ROOT/monthly/*.tar.gz 2>/dev/null | wc -l)"

# 7. Optional: Upload to remote storage (S3, B2, etc.)
if [ -n "${BACKUP_REMOTE_ENABLED:-}" ] && [ "$BACKUP_REMOTE_ENABLED" = "true" ]; then
    log "Uploading to remote storage..."

    # Example with rclone (configure rclone first)
    if command -v rclone &> /dev/null; then
        rclone sync "$BACKUP_ROOT" remote:photography-backups \
            --progress \
            --exclude 'photos-latest/**'
        log "Remote backup complete"
    fi
fi

exit 0
```

#### 7.4.4 Automated Backup Scheduling

**Cron Configuration** (`/etc/cron.d/photography-backup`):
```cron
# Run backup daily at 3 AM
0 3 * * * www-data /var/www/photography-site/app/scripts/backup.sh >> /var/log/photography-backup.log 2>&1
```

**Systemd Timer** (alternative to cron):

**File**: `deployment/systemd/photography-backup.timer`
```ini
[Unit]
Description=Photography Site Backup Timer
Requires=photography-backup.service

[Timer]
# Run daily at 3 AM
OnCalendar=daily
OnCalendar=*-*-* 03:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

**File**: `deployment/systemd/photography-backup.service`
```ini
[Unit]
Description=Photography Site Backup
After=network.target

[Service]
Type=oneshot
User=www-data
Group=www-data
WorkingDirectory=/var/www/photography-site
ExecStart=/var/www/photography-site/app/scripts/backup.sh
StandardOutput=append:/var/log/photography-backup.log
StandardError=append:/var/log/photography-backup.log

# Environment
Environment="SITE_ROOT=/var/www/photography-site"
Environment="BACKUP_ROOT=/var/backups/photography-site"

[Install]
WantedBy=multi-user.target
```

**Enable systemd timer**:
```bash
sudo systemctl enable photography-backup.timer
sudo systemctl start photography-backup.timer

# Check timer status
sudo systemctl list-timers photography-backup.timer

# Run backup manually
sudo systemctl start photography-backup.service
```

#### 7.4.5 Restore Procedure

**File**: `scripts/restore.sh`
```bash
#!/bin/bash
set -euo pipefail

# Usage: ./restore.sh <backup-date>
# Example: ./restore.sh 20240115-030000

if [ $# -lt 1 ]; then
    echo "Usage: $0 <backup-date>"
    echo "Available backups:"
    ls -1 /var/backups/photography-site/daily/data-*.tar.gz | sed 's/.*data-\(.*\)\.tar\.gz/\1/'
    exit 1
fi

BACKUP_DATE=$1
SITE_ROOT="${SITE_ROOT:-/var/www/photography-site}"
BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/photography-site}"

# Find backup files
DATA_BACKUP="$BACKUP_ROOT/daily/data-${BACKUP_DATE}.tar.gz"
PHOTO_BACKUP="$BACKUP_ROOT/daily/photos-${BACKUP_DATE}.tar.gz"

# Validate backups exist
if [ ! -f "$DATA_BACKUP" ]; then
    echo "Error: Data backup not found: $DATA_BACKUP"
    exit 1
fi

echo "Found backups:"
echo "  Data: $DATA_BACKUP"
if [ -f "$PHOTO_BACKUP" ]; then
    echo "  Photos: $PHOTO_BACKUP"
else
    echo "  Photos: (not found, will skip)"
fi

read -p "Restore these backups? This will OVERWRITE current data. (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

# Stop backend service
echo "Stopping backend service..."
sudo systemctl stop photography-admin

# Backup current state before restore (just in case)
echo "Creating safety backup of current state..."
SAFETY_BACKUP="/tmp/photography-pre-restore-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "$SAFETY_BACKUP" -C "$SITE_ROOT/data" .
echo "Safety backup created: $SAFETY_BACKUP"

# Restore data files
echo "Restoring data files..."
sudo tar -xzf "$DATA_BACKUP" -C "$SITE_ROOT/data"

# Restore photos (if available)
if [ -f "$PHOTO_BACKUP" ]; then
    echo "Restoring photos..."
    sudo mkdir -p "$SITE_ROOT/data/uploads/originals"
    sudo tar -xzf "$PHOTO_BACKUP" -C "$SITE_ROOT/data/uploads/originals"

    # Regenerate display and thumbnail versions
    echo "Regenerating display and thumbnail versions..."
    # Call backend API to regenerate (implement this endpoint)
    # curl -X POST http://localhost:8080/api/admin/photos/regenerate-all
fi

# Fix permissions
echo "Fixing permissions..."
sudo chown -R www-data:www-data "$SITE_ROOT/data"

# Start backend service
echo "Starting backend service..."
sudo systemctl start photography-admin

echo "Restore complete!"
echo "Safety backup available at: $SAFETY_BACKUP"
```

#### 7.4.6 Backup Monitoring

**Health Check for Backups**:

Add to backend API:
```go
// GET /api/admin/system/backup-status
func BackupStatus(w http.ResponseWriter, r *http.Request) {
    backupRoot := os.Getenv("BACKUP_ROOT")

    // Check latest backup age
    latestBackup := findLatestBackup(backupRoot + "/daily")
    age := time.Since(latestBackup.ModTime)

    status := map[string]interface{}{
        "latest_backup": latestBackup.Name,
        "age_hours": age.Hours(),
        "healthy": age.Hours() < 36, // Warn if > 36 hours old
        "backup_count": countBackups(backupRoot),
        "total_size_gb": calculateTotalSize(backupRoot),
    }

    json.NewEncoder(w).Encode(status)
}
```

**Admin Dashboard Widget**:
```typescript
// Show backup status in admin dashboard
interface BackupStatus {
    latest_backup: string;
    age_hours: number;
    healthy: boolean;
    backup_count: number;
    total_size_gb: number;
}

// Display warning if backup is stale
if (backupStatus.age_hours > 36) {
    showWarning(`Last backup was ${Math.round(backupStatus.age_hours)} hours ago`);
}
```

#### 7.4.7 Remote Backup Options

**Option 1: rclone to any cloud storage**
```bash
# Install rclone
curl https://rclone.org/install.sh | sudo bash

# Configure remote (interactive)
rclone config

# Add to backup script
rclone sync /var/backups/photography-site remote:backups/photography-site
```

**Option 2: AWS S3**
```bash
# Using AWS CLI
aws s3 sync /var/backups/photography-site s3://my-bucket/photography-backups/ \
    --storage-class STANDARD_IA
```

**Option 3: Backblaze B2**
```bash
# Using B2 CLI
b2 sync /var/backups/photography-site b2://my-bucket/photography-backups/
```

#### 7.4.8 Implementation Checklist

- [ ] Create backup script with retention policy
- [ ] Test backup script on development machine
- [ ] Create restore script
- [ ] Test restore procedure (critical!)
- [ ] Set up cron or systemd timer for automated backups
- [ ] Configure log rotation for backup logs
- [ ] Add backup status endpoint to backend API
- [ ] Add backup status widget to admin dashboard
- [ ] Document restore procedure for emergencies
- [ ] Optional: Configure remote backup destination
- [ ] Optional: Add email/Slack notifications for backup failures
- [ ] Schedule monthly restore drill (test that backups work!)

---

### 7.5 Data Migration System

**Philosophy**: Treat data like a database - use migrations for schema changes.

#### 7.4.1 Migration Structure

**File**: `backend/internal/migrations/migration.go`
```go
package migrations

type Migration struct {
    Version     int
    Description string
    Up          func() error
    Down        func() error
}

var Migrations = []Migration{
    {
        Version:     1,
        Description: "Initial schema",
        Up:          migrate_v1_up,
        Down:        migrate_v1_down,
    },
    {
        Version:     2,
        Description: "Add watermark settings to site_config",
        Up:          migrate_v2_up,
        Down:        migrate_v2_down,
    },
    // Add new migrations here
}
```

#### 7.4.2 Migration Tracking

**File**: `data/schema_version.json` (in data directory, gitignored)
```json
{
  "current_version": 2,
  "applied_migrations": [1, 2],
  "last_migration_date": "2025-10-18T10:30:00Z"
}
```

#### 7.4.3 Migration Runner

**Backend startup sequence**:
1. Check `schema_version.json`
2. Compare with available migrations
3. Run pending migrations in order
4. Update `schema_version.json`
5. Create backup before each migration

**File**: `backend/cmd/admin/main.go`
```go
func main() {
    // Check and run migrations
    currentVersion := migrations.GetCurrentVersion()
    targetVersion := migrations.LatestVersion()

    if currentVersion < targetVersion {
        log.Printf("Migrations needed: v%d -> v%d", currentVersion, targetVersion)

        // Backup before migration
        if err := createBackup(); err != nil {
            log.Fatal("Failed to create backup:", err)
        }

        // Run migrations
        if err := migrations.RunMigrations(currentVersion, targetVersion); err != nil {
            log.Fatal("Migration failed:", err)
        }

        log.Printf("Migrations complete: now at v%d", targetVersion)
    }

    // Start server
    startServer()
}
```

#### 7.4.4 Migration Example

**Adding a new field to site_config.json**:
```go
func migrate_v2_up() error {
    // Read current site_config.json
    config, err := readSiteConfig()
    if err != nil {
        return err
    }

    // Add new field with default value
    if config.GalleryDefaults == nil {
        config.GalleryDefaults = &GalleryDefaults{}
    }
    if config.GalleryDefaults.WatermarkURL == "" {
        config.GalleryDefaults.WatermarkURL = ""
        config.GalleryDefaults.WatermarkDownloads = false
    }

    // Write back
    return writeSiteConfig(config)
}

func migrate_v2_down() error {
    // Reverse the migration (remove the field)
    config, err := readSiteConfig()
    if err != nil {
        return err
    }

    // Remove the field
    if config.GalleryDefaults != nil {
        config.GalleryDefaults.WatermarkURL = ""
        config.GalleryDefaults.WatermarkDownloads = false
    }

    return writeSiteConfig(config)
}
```

---

### 7.5 Alternative Deployment Methods

#### 7.5.1 Docker Deployment

**File**: `deployment/docker/Dockerfile`
```dockerfile
FROM golang:1.21-alpine AS backend-builder
WORKDIR /app
COPY backend/ .
RUN go build -o admin_server cmd/admin/main.go

FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY frontend/ .
RUN npm install && npm run build

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /app

# Copy built artifacts
COPY --from=backend-builder /app/admin_server /app/
COPY --from=frontend-builder /app/dist /app/frontend/

# Data volume
VOLUME ["/data"]

EXPOSE 8080

CMD ["/app/admin_server"]
```

**File**: `deployment/docker/docker-compose.yml`
```yaml
version: '3.8'

services:
  photography-site:
    build: .
    ports:
      - "8080:8080"
    volumes:
      - ./data:/data:rw
    environment:
      - DATA_DIR=/data/content
      - UPLOADS_DIR=/data/uploads
      - CONFIG_FILE=/data/config/site_config.json
    restart: unless-stopped

  apache:
    image: httpd:2.4-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./apache.conf:/usr/local/apache2/conf/httpd.conf:ro
      - ./data/uploads:/var/www/uploads:ro
      - ./frontend/dist:/var/www/html:ro
    depends_on:
      - photography-site
    restart: unless-stopped
```

#### 7.5.2 Static Hosting (Netlify/Vercel) + Backend Elsewhere

For users who want frontend on CDN:
- Frontend: Deploy to Netlify/Vercel
- Backend: Deploy to VPS or cloud provider
- Configure CORS on backend to allow frontend domain

---

### 7.6 Deployment Checklist

**Pre-deployment**:
- [ ] Test deployment in staging environment
- [ ] Backup current data
- [ ] Review migration scripts
- [ ] Update version number
- [ ] Test rollback procedure

**Deployment**:
- [ ] Run `bazel test //...` (all tests pass)
- [ ] Build production artifacts
- [ ] Run deployment script
- [ ] Verify migrations applied
- [ ] Check service status
- [ ] Test critical paths (login, upload, view albums)

**Post-deployment**:
- [ ] Monitor logs for errors
- [ ] Check storage usage
- [ ] Verify backups created
- [ ] Test rollback if needed
- [ ] Update documentation if needed

---

### 7.7 Rollback Procedure

**If deployment fails**:
```bash
# 1. Stop new service
ssh $target "sudo systemctl stop photography-admin"

# 2. Restore previous version
ssh $target "
    cd $site_root
    sudo rm -rf app.new
    sudo mv app app.new
    sudo mv app.backup app
"

# 3. Restore data if corrupted
ssh $target "
    cd $site_root
    sudo tar -xzf /var/backups/photography-site/backup-TIMESTAMP.tar.gz -C data/
"

# 4. Start service
ssh $target "sudo systemctl start photography-admin"
```

---

### 7.8 Release and Deployment Process

**Philosophy**: Manual release process with automated local testing via pre-commit hooks. All quality checks run locally before push.

#### 7.8.1 Pre-release Checklist

Before creating a release, ensure all quality gates pass locally:

```bash
# 1. Run pre-commit hooks on all files
pre-commit run --all-files

# 2. Run full test suite
bazel test //... --test_output=errors

# 3. Run E2E tests manually
cd e2e && npm run test:e2e

# 4. Check for security vulnerabilities
cd frontend && npm audit
cd ../backend && go list -json -m all | docker run --rm -i sonatypecommunity/nancy:latest sleuth

# 5. Verify build artifacts
bazel build //...
cd frontend && npm run build
cd ../backend && go build ./cmd/admin/main.go
```

#### 7.8.2 Manual Release Process

**Creating a new release**:

1. **Update version number**:
   ```bash
   # Update package.json, go.mod, or version file
   vim frontend/package.json  # Update version
   vim backend/cmd/admin/main.go  # Update const Version
   git add .
   git commit -m "chore: bump version to v1.2.3"
   ```

2. **Run pre-release checklist** (see 7.8.1 above)

3. **Create and push tag**:
   ```bash
   git tag -a v1.2.3 -m "Release v1.2.3"
   git push origin v1.2.3
   git push origin main
   ```

4. **Build release artifacts**:
   ```bash
   # Frontend
   cd frontend
   npm ci
   npm run build
   cd ..

   # Backend
   cd backend
   go build -ldflags="-X main.Version=v1.2.3" -o ../dist/admin_server cmd/admin/main.go
   cd ..

   # Create deployment package
   mkdir -p release
   tar -czf release/photography-site-v1.2.3.tar.gz \
     -C dist . \
     --exclude='*.map'

   # Generate checksums
   cd release
   sha256sum *.tar.gz > checksums.txt
   ```

5. **Create GitHub release manually**:
   - Go to GitHub → Releases → Draft a new release
   - Choose tag v1.2.3
   - Add release notes
   - Upload `photography-site-v1.2.3.tar.gz` and `checksums.txt`
   - Publish release

#### 7.8.3 Manual Deployment Process

```bash
# 1. Download release artifact from GitHub
wget https://github.com/user/repo/releases/download/v1.2.3/photography-site-v1.2.3.tar.gz

# 2. Verify checksum
sha256sum -c checksums.txt

# 3. Upload to server
scp photography-site-v1.2.3.tar.gz user@server:/tmp/

# 4. Deploy on server
ssh user@server << 'EOF'
  set -e
  cd /var/www/photography-site

  # Stop service
  sudo systemctl stop photography-admin

  # Backup current version
  sudo mv app app.backup.$(date +%Y%m%d_%H%M%S) || true

  # Extract new version
  sudo mkdir -p app
  sudo tar -xzf /tmp/photography-site-v1.2.3.tar.gz -C app/

  # Set permissions
  sudo chown -R www-data:www-data app/

  # Start service
  sudo systemctl start photography-admin

  # Verify service started
  sleep 5
  sudo systemctl status photography-admin

  echo "Deployment complete!"
EOF

# 5. Verify deployment
curl -f https://your-domain.com/api/health || echo "Health check failed!"

# 6. Rollback if needed
# ssh user@server 'sudo systemctl stop photography-admin && sudo rm -rf app && sudo mv app.backup.TIMESTAMP app && sudo systemctl start photography-admin'
```

#### 7.8.4 Development Workflow

**Daily development**:
```bash
# Pre-commit hooks run automatically on git commit
git add .
git commit -m "feat: add new feature"  # Pre-commit hooks run here

# If hooks fail, fix issues and retry
git add .
git commit -m "feat: add new feature"
```

**Before pushing to main**:
```bash
# Run full test suite manually
bazel test //...

# Or run specific test suites
bazel test //frontend:all_tests
bazel test //backend:all_tests
bazel test //e2e:all_tests
```

#### 7.8.5 Dependency Management

**Frontend dependencies**:
```bash
# Check for outdated packages
cd frontend
npm outdated

# Update dependencies (review changes carefully)
npm update

# Or update specific package
npm install lit@latest

# Audit for security vulnerabilities
npm audit
npm audit fix
```

**Backend dependencies**:
```bash
# Check for outdated modules
cd backend
go list -u -m all

# Update dependencies
go get -u ./...
go mod tidy

# Check for vulnerabilities
go list -json -m all | nancy sleuth
```

#### 7.8.6 Implementation Checklist

- [ ] Set up pre-commit hooks (see Phase 1.5)
- [ ] Create `scripts/build-release.sh` for automated release builds
- [ ] Create `scripts/deploy.sh` for deployment automation
- [ ] Document release process in `docs/RELEASE.md`
- [ ] Create deployment rollback procedure in `docs/ROLLBACK.md`
- [ ] Set up version management strategy (semver)
- [ ] Create changelog template
- [ ] Test full release process with v0.1.0

---

### 7.9 Documentation

- [ ] Deployment Guide (`docs/DEPLOYMENT.md`)
  - Apache setup
  - SSL certificate setup (Let's Encrypt)
  - Firewall configuration
  - DNS configuration
- [ ] Operations Manual (`docs/OPERATIONS.md`)
  - Backup procedures
  - Restore procedures
  - Monitoring setup
  - Log rotation
- [ ] Migration Guide (`docs/MIGRATIONS.md`)
  - How to write migrations
  - Testing migrations
  - Rollback procedures
- [ ] Troubleshooting Guide (`docs/TROUBLESHOOTING.md`)
  - Common issues
  - Log locations
  - Debug mode
- [ ] API Documentation (`docs/API.md`)
  - All endpoints
  - Request/response formats
  - Authentication
- [ ] User Guide (`docs/USER_GUIDE.md`)
  - Admin interface walkthrough
  - Creating albums
  - Uploading photos
  - Managing settings

---

## Future Enhancements (Post-Launch)

### Phase 8: Advanced Features
- [ ] Image gallery sorting/filtering on frontend
- [ ] Search functionality for blog
- [ ] Comments system for blog posts
- [ ] Newsletter subscription integration
- [ ] Analytics integration (privacy-focused)
- [ ] Multiple admin users with roles
- [ ] Version control for content (git-based?)
- [ ] Automated image optimization pipeline
- [ ] Client gallery download as ZIP
- [ ] Watermarking for client galleries
- [ ] Print shop integration
- [ ] Multi-language support
- [ ] **Album/Gallery Typography & Layout Customization** (see below)

### Phase 9: Developer Experience
- [ ] CLI tool for common operations
- [ ] Migration scripts for data schema changes
- [ ] Monitoring and logging
- [ ] Automated backups
- [ ] Local testing scripts and pre-commit hooks

---

## Phase 8 Feature: Album/Gallery Typography & Layout Customization

> **Important**: This is an **advanced feature** for Phase 8, **NOT part of the MVP**. The MVP uses global typography and layouts from `site_config.json`.

### Overview
Enable administrators to assign different typography styles and layout options to individual albums, allowing each gallery to have a unique visual identity.

### Use Cases
- **Wedding galleries**: Elegant serif fonts with romantic styling
- **Corporate portfolios**: Professional sans-serif typography
- **Client galleries**: Match client's brand identity
- **Portfolio sections**: Different visual styles for different types of work

### Planned Capabilities

#### Typography Customization
- Per-album font selection for titles, subtitles, body text, and captions
- Font properties: family, weight, size, line-height, letter-spacing
- Support for Google Fonts and custom font uploads
- Fallback to global typography settings when not customized

#### Layout Options
- Multiple photo layout modes: masonry, grid, justified, carousel
- Configurable spacing and column options
- Different cover photo presentation styles
- Photo aspect ratio and crop preferences

#### Color & Styling
- Per-album color schemes (background, text, accents)
- Border and shadow styling options
- Hover effect variations

#### Admin Features
- Font browser with live preview
- Typography presets (Elegant, Modern, Classic, Minimalist)
- Copy settings between albums
- Reset to global defaults

### Data Structure
Albums will have optional `typography` and `layout_options` fields. When not set or disabled, albums inherit from global settings. This ensures backward compatibility and simple MVP implementation.

### Implementation Phases
1. **Data model updates**: Add optional fields to album schema
2. **Backend API**: CRUD endpoints for typography and layout settings
3. **Frontend rendering**: Dynamic font loading and layout application
4. **Admin interface**: Typography and layout editors with live preview
5. **Testing**: Cross-browser compatibility and performance validation

### Performance Considerations
- Lazy load custom fonts only when album is viewed
- Cache font files aggressively
- Use font-display: swap to prevent Flash of Invisible Text
- Preload fonts for likely navigation paths

### Extensibility
The `typography` and `layout_options` structure allows for future expansion:
- Additional layout modes
- More granular color controls
- Photo presentation options (captions, EXIF display)
- Navigation preferences (thumbnails, slideshow controls)

This feature provides photographers flexibility to create unique visual experiences for different types of galleries while maintaining simplicity in the MVP.

---

## Risk Mitigation

### File Locking & Concurrency
**Risk**: Multiple simultaneous admin operations corrupting JSON files.
**Mitigation**:
- Implement file locking
- Atomic write operations (write to temp, then rename)
- Backup before modification

### Data Loss
**Risk**: Accidental deletion or corruption of JSON files.
**Mitigation**:
- Automated backups before each modification
- Git-based versioning of data directory
- Export functionality

### Image Storage Growth
**Risk**: Storage fills up with uploaded images.
**Mitigation**:
- Image optimization on upload
- Storage monitoring
- Cleanup utilities for unused images

### Security
**Risk**: Unauthorized access to admin panel or client galleries.
**Mitigation**:
- Strong authentication
- Rate limiting
- Regular security audits
- HTTPS enforcement

### Performance at Scale
**Risk**: Large JSON files becoming slow to parse.
**Mitigation**:
- Pagination in admin interface
- Lazy loading on frontend
- Consider splitting large files if needed
- Monitor file sizes

---

## Success Metrics

### Performance
- [ ] Public pages load in < 2 seconds (3G connection)
- [ ] Lighthouse score > 90
- [ ] Images optimized (< 200KB per image)

### Functionality
- [ ] All CRUD operations working for all content types
- [ ] Image upload and processing reliable
- [ ] Client gallery access control working
- [ ] Blog editor fully functional

### Developer Experience
- [ ] Local development environment runs with single command
- [ ] Build completes in < 2 minutes
- [ ] Clear documentation for all processes

### User Experience
- [ ] Admin panel intuitive and easy to use
- [ ] Public site responsive on all devices
- [ ] Fast page transitions
- [ ] Accessible (WCAG 2.1 AA compliant)

---

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| 1. Setup | 1-2 weeks | Bazel workspace, repo structure |
| 2. Data Model | 1 week | JSON schemas, Go models |
| 3. Frontend | 3 weeks | All public-facing pages |
| 4. Backend | 3 weeks | Admin server and UI |
| 5. Integration | 1 week | Build system, testing |
| 6. Polish | 1 week | Performance, SEO, accessibility |
| 7. Deployment | 1 week | Deployment, documentation |

**Total Estimated Time**: 10-11 weeks for MVP

---

## Next Steps

1. **Get approval** on this implementation plan
2. **Set up development environment** (Bazel, Go, Node.js)
3. **Create initial Bazel workspace** and repository structure
4. **Begin Phase 1** - Project setup and infrastructure
5. **Establish development workflow** and conventions

---

## Notes & Decisions Log

*This section will be updated as implementation progresses with key decisions, changes to the plan, and lessons learned.*

- **2025-10-18**: Initial implementation plan created

- **2025-10-18**: Selected **Lit** as the frontend framework
  - **Rationale**:
    - Tiny bundle size (~5KB) ensures fast page loads
    - Native web components are future-proof and framework-agnostic
    - Excellent TypeScript support out of the box
    - Perfect fit for component-based photo gallery UIs
    - No hydration overhead, works seamlessly with static HTML
    - Shadow DOM provides natural style encapsulation
  - **Vite** chosen as build tool for fast dev experience with HMR
  - Components will be organized by functionality (core components vs page-level components)

- **2025-10-18**: Refined **Album-Centric Photo Management** approach
  - **Unified album model**: Single `albums.json` file for all albums (public, unlisted, password-protected)
  - **Album visibility modes**:
    - `public`: Listed and accessible to everyone
    - `unlisted`: Direct URL access only, not in listings
    - `password_protected`: Requires bcrypt password (client-side verification)
  - **Main Portfolio Album**: One special album designated as the portfolio for landing page
  - **Cover photo**: Each album has a selectable cover photo displayed full-screen at top
  - **Three-tier image storage**:
    1. **Original**: Untouched source files (any format, any resolution)
    2. **Display**: 3840px WebP @ quality 85 (~800KB-1.5MB) for beautiful 4K viewing
    3. **Thumbnail**: 800px WebP @ quality 80 (~50-100KB) for grids
  - **Download functionality**:
    - Per-album setting: `allow_downloads`
    - Users can choose quality: Original, Display, or Thumbnail
    - Single photo or whole album (sequential browser downloads)
  - **EXIF data**: Extracted and stored in JSON, stripped from web versions for privacy
  - **Upload workflow**:
    1. Select/create album
    2. Drag-drop or click to upload photos
    3. Backend processes all three versions + EXIF extraction
    4. Photos appear in album
  - **Admin workflow prioritizes photographer needs**:
    - Batch upload with progress tracking
    - Drag-drop photo reordering
    - Quick cover photo selection
    - Easy visibility toggle and password management

- **2025-10-18**: Established **Comprehensive Testing Strategy**
  - **Testing pyramid approach**: Many unit tests, some integration tests, few E2E tests
  - **Frontend testing**:
    - **Vitest** for fast unit tests of TypeScript utilities
    - **@web/test-runner** for real browser testing of Lit web components
    - Tests for Shadow DOM, CSS encapsulation, browser APIs
    - Every component and utility has corresponding `.test.ts` file
  - **Backend testing**:
    - Go standard library `testing` package with **testify** for assertions
    - Unit tests for models, services, handlers (with mocking)
    - Integration tests for full workflows (album lifecycle, image processing)
    - Real filesystem and image processing in integration tests
  - **E2E testing**:
    - **Playwright** for full browser automation
    - Public site workflows (browsing, lightbox, downloads, passwords)
    - Admin workflows (auth, album management, photo upload)
  - **Bazel integration**:
    - All tests run via Bazel targets
    - Tags for filtering (unit, integration, e2e)
    - Coverage reporting support
    - Pre-commit hooks for fast tests, CI for full suite
  - **Coverage targets**: Frontend >80%, Backend >85%, Critical paths >95%
  - **Test fixtures**: Dedicated `testdata/` directory with images and JSON fixtures

- **2025-10-18**: Implemented **Developer Experience & Code Quality** tooling
  - **Pre-commit hooks** via [pre-commit.com](https://pre-commit.com/):
    - Runs on every commit automatically
    - Multi-language support: TypeScript, Go, Bazel, Shell, Markdown
    - Secrets detection with `detect-secrets`
    - File checks: large files, merge conflicts, JSON/YAML validity
    - Prevents commits to main/master branches
  - **TypeScript tooling**:
    - **ESLint** with TypeScript parser and Lit plugin
    - **Prettier** for consistent formatting (100 char line width, single quotes)
    - Strict TypeScript config (noUnusedLocals, noUnusedParameters, etc.)
  - **Go tooling**:
    - **golangci-lint** with 15+ linters (gofmt, govet, staticcheck, gosec, etc.)
    - Automatic import organization with goimports
    - Security checks with gosec
  - **Bazel tooling**:
    - **Buildifier** for BUILD file formatting and linting
  - **VS Code integration**:
    - Format on save for all languages
    - Recommended extensions (ESLint, Prettier, Go, Bazel, Lit, Vitest, Playwright)
    - Debug configurations for frontend, backend, and full stack
    - Proper file associations for Bazel files
  - **Secrets management**:
    - `.env.example` template (committed)
    - `.env` files gitignored
    - `detect-secrets` baseline for false positive management
    - Private keys and credentials automatically blocked
  - **Commit conventions**:
    - Conventional Commits format enforced via commitlint
    - Types: feat, fix, docs, style, refactor, test, chore, perf, ci, build
  - **EditorConfig**: Consistent indentation across editors (2 spaces for TS, tabs for Go)
  - **Developer workflow**: One-command setup, automatic checks on commit, manual override available

- **2025-10-18**: Designed **Production Deployment Strategy**
  - **Code vs Data Separation**:
    - User data NEVER committed to git repository
    - Code in `/app`, data in `/data` (separate directories)
    - Comprehensive `.gitignore` prevents accidental data commits
    - Example data and schemas committed for reference only
  - **Primary deployment: Apache + Reverse Proxy**:
    - Static site served directly by Apache (blazing fast)
    - Go backend runs as systemd service on port 8080
    - Apache reverse proxies `/api` and `/admin` to backend
    - Full Apache config template with security headers, caching, compression
    - Systemd service template with security hardening
  - **Bazel deploy command**:
    - `bazel run //:deploy` - One command deployment
    - Configurable via `deployment/deploy.local.yaml` (gitignored)
    - Builds frontend and backend, creates tarball, deploys via SSH
    - Automatic backup before deployment
    - Preserves existing data during upgrades
    - Initializes empty data files on first deploy
  - **Data migration system**:
    - Database-style migrations for JSON schema changes
    - Tracked in `schema_version.json`
    - Automatic migration on backend startup
    - Up/down migrations for rollback capability
    - Automatic backup before each migration
  - **Rollback procedure**: Quick restoration of previous version and data
  - **Alternative deployments**: Docker Compose, static hosting + VPS backend
  - **Security**: SSL/TLS enforcement, security headers, systemd hardening, upload directory protections
