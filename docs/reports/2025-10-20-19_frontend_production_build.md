# Frontend Production Build Configuration

**Date**: October 20, 2025, 7:00 PM
**Developer**: Copilot
**Type**: Feature Addition

## Summary

Configured the frontend to build for static site deployment. The frontend can now be compiled into a `build/` directory that can be copy-pasted to any static web server.

## Changes Made

### 1. Updated Vite Configuration (`frontend/vite.config.ts`)

- Changed output directory from `dist/` to `build/`
- Set `base: '/'` to ensure all paths are absolute from domain root
- Disabled `publicDir` for production (handled manually)
- Enhanced dev server middleware to serve both `/data/` and `/uploads/` directories
- Configured Rollup input to use `src/index.html`

### 2. Enhanced Build Script (`frontend/scripts/build.sh`)

- Compiles TypeScript and bundles with Vite
- Copies `data/` directory to build output
- Copies `uploads/` directory (from `static/uploads/`) to build output at root level
- Provides deployment instructions after build

### 3. Created Deployment Documentation (`docs/DEPLOYMENT.md`)

Complete guide covering:

- Build process and output structure
- Deployment requirements and steps
- Server configuration examples (Nginx, Apache, Netlify, Vercel)
- Testing locally before deployment
- Troubleshooting common issues
- Production checklist

### 4. Created Frontend README (`frontend/README.md`)

Developer-focused documentation including:

- Quick start guide
- Available npm scripts
- Project structure overview
- Development and production workflows
- Testing strategy
- Deployment notes

### 5. Cleanup

- Removed TypeScript compilation artifacts (.js files) from source directory
- These were causing ESLint errors and shouldn't be in version control

## Build Output Structure

```text
frontend/build/
├── index.html              # Main entry point
├── assets/                 # Compiled JS/CSS with content hashes
│   ├── main-[hash].js     # ~133KB (~26KB gzipped)
│   └── main-[hash].css    # ~0.11KB
├── data/                   # JSON configuration (copied from /data)
│   ├── site_config.json
│   ├── albums.json
│   └── blog_posts.json
└── uploads/                # User uploads (copied from /static/uploads)
    ├── originals/          # Original uploaded images
    ├── display/            # Display-sized images (~1200px)
    └── thumbnails/         # Thumbnail images (~400px)
```

## Deployment Instructions

### Quick Deploy

```bash
cd frontend
./scripts/build.sh
```

Then copy the entire `frontend/build/` directory to your web server root.

### Requirements

- Site must be served from domain root (e.g., `nielsshootsfilm.com/`)
- Web server needs SPA fallback (serve `index.html` for all routes)
- Recommended cache headers:
  - `/assets/*` - Long-term cache (1 year)
  - `/uploads/*` - Long-term cache (1 year)
  - `/data/*` - No cache (may be updated by admin)

### Tested With

- Local Python HTTP server (`python3 -m httpserver`)
- Site loads correctly at `http://localhost:8888`
- All asset paths resolve correctly
- Data files load successfully
- Client-side routing works

## Technical Notes

### Path Strategy

All frontend code uses absolute paths from root:

- `/data/albums.json` - Album data
- `/data/site_config.json` - Site configuration
- `/uploads/thumbnails/*` - Thumbnail images
- `/uploads/display/*` - Display images
- `/assets/*` - Compiled JS/CSS

This ensures the site works when deployed to a domain root without path rewriting.

### Admin Backend NOT Included

This build **only** includes the public-facing frontend. The admin interface frontend is included in the build, but the Go backend (which handles photo uploads, album editing, etc.) is **not** deployed by this process.

For full functionality:

- Public site: Deploy `build/` directory to static host
- Admin backend: Deploy Go server separately (future work)

### Data Management

The `data/` directory contains static JSON files in the build. To update content after deployment:

- Option 1: Rebuild and redeploy frontend with updated JSON
- Option 2: Deploy admin backend to modify files remotely (Phase 8)

## Verification

- ✅ Build completes successfully
- ✅ Output directory structure correct
- ✅ All assets and data copied
- ✅ Pre-commit hooks pass
- ✅ TypeScript compiles without errors
- ✅ Markdown linting passes
- ✅ Shell scripts validated with shellcheck
- ✅ Site tested locally and loads correctly

## Files Modified

- `frontend/vite.config.ts` - Build configuration
- `frontend/scripts/build.sh` - Build script with data/static copying

## Files Created

- `docs/DEPLOYMENT.md` - Comprehensive deployment guide (320 lines)
- `frontend/README.md` - Frontend developer documentation (192 lines)

## Files Deleted

- Multiple `*.js` files in `frontend/src/` - TypeScript compilation artifacts

## Next Steps

For production deployment:

1. Run `./scripts/build.sh` from frontend directory
2. Test locally with a simple HTTP server
3. Deploy `build/` contents to web server root
4. Configure web server with appropriate cache headers and SPA fallback
5. Verify site loads at production domain

For full site functionality (admin backend):

- Deploy Go backend separately (out of scope for this change)
- Configure admin backend to serve from `/admin/api/` or separate subdomain

## Words: 485
