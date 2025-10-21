# Remove Duplicate is_portfolio_album Property

**Date:** October 20, 2025, 6:00 PM PDT  
**Commit:** c7bb3d5

## Overview

Removed the duplicate `is_portfolio_album` property from album records. The portfolio album designation is now managed solely through `site_config.json`'s `portfolio.main_album_id` field, eliminating data duplication and potential inconsistencies.

## Problem

Previously, albums had an `is_portfolio_album` boolean field, while `site_config.json` also had a `portfolio.main_album_id` field. This created duplicate sources of truth:

- Album object: `{ "is_portfolio_album": true }`
- Site config: `{ "portfolio": { "main_album_id": "album-uuid" }}`

This duplication could lead to:

- Data inconsistencies (flag and ID pointing to different albums)
- Extra UI complexity (checkbox in album editor)
- Confusion about which field is authoritative

## Solution

**Single Source of Truth:** Portfolio album is now determined exclusively by `site_config.json`'s `portfolio.main_album_id`.

### Changes Made

#### Data Layer

- **data/albums.json:** Removed `is_portfolio_album` from both albums
- Portfolio album status now implicit: the album whose ID matches `site_config.portfolio.main_album_id`

#### TypeScript Frontend

- **frontend/src/types/data-models.ts:** Removed `is_portfolio_album: boolean` from Album interface
- **frontend/src/utils/admin-api.ts:** Removed from CreateAlbumRequest interface
- **frontend/src/pages/admin-album-editor-page.ts:**
  - Removed portfolio album checkbox from UI
  - Removed checkbox event handlers
  - Removed calls to `setMainPortfolioAlbum()` on save
  - Removed import of `setMainPortfolioAlbum`
- **frontend/src/pages/admin-dashboard-page.ts:** Updated `getStats()` to find portfolio album by checking `site_config.portfolio.main_album_id` instead of `album.is_portfolio_album`

#### Go Backend

- **backend/internal/models/album.go:** Removed `IsPortfolio` field from Album struct
- **backend/internal/models/schema_validation_test.go:**
  - Removed field from test fixtures
  - Removed validation checks for the field
  - Updated JSON field expectations

#### Tests

- Updated all test files to remove `is_portfolio_album` from mock data:
  - admin-album-editor-page.test.ts
  - admin-albums-page.test.ts
  - admin-dashboard-page.test.ts
  - admin-settings-page.test.ts
  - album-card.test.ts
  - admin-api.test.ts
  - api.test.ts
  - schema-validation.test.ts
- Removed obsolete test: "should call setMainPortfolioAlbum when portfolio album checkbox is checked"

## Files Changed

```text
backend/internal/models/album.go                   |  1 -
backend/internal/models/schema_validation_test.go  | 15 +--------------
data/albums.json                                   |  2 --
frontend/src/components/album-card.test.ts         |  1 -
frontend/src/pages/admin-album-editor-page.test.ts | 30 ------------------------------
frontend/src/pages/admin-album-editor-page.ts      | 26 --------------------------
frontend/src/pages/admin-albums-page.test.ts       |  6 ------
frontend/src/pages/admin-dashboard-page.test.ts    |  2 --
frontend/src/pages/admin-dashboard-page.ts         |  5 ++++-
frontend/src/pages/admin-settings-page.test.ts     |  1 -
frontend/src/types/data-models.ts                  |  1 -
frontend/src/types/schema-validation.test.ts       | 12 ------------
frontend/src/utils/admin-api.test.ts               |  6 ------
frontend/src/utils/admin-api.ts                    |  1 -
frontend/src/utils/api.test.ts                     |  6 ------
16 files changed, 7 insertions(+), 112 deletions(-)
```

## How Portfolio Album Works Now

1. **Admin sets portfolio album** via Settings page → Portfolio settings section
2. **Setting stored** in `site_config.json`: `"portfolio": { "main_album_id": "uuid" }`
3. **Dashboard displays** portfolio album by looking up album with matching ID
4. **Public site uses** `site_config.portfolio.main_album_id` to determine featured album

## Verification

✅ **TypeScript compilation:** Passes without errors  
✅ **Go compilation:** Builds successfully  
✅ **Go tests:** All passing (100%)  
✅ **Pre-commit hooks:** All checks passed (prettier, ESLint, golangci-lint, etc.)  
✅ **Code search:** No remaining references to `is_portfolio_album` in production code

## Benefits

1. **Single source of truth:** Portfolio designation managed in one place
2. **Simpler data model:** Albums no longer carry redundant portfolio flag
3. **Cleaner UI:** Removed confusing checkbox from album editor
4. **Better UX:** Portfolio album setting now clearly part of site-wide settings
5. **Reduced code:** 105 fewer lines of code to maintain

## Migration Notes

For existing deployments:

- Old `is_portfolio_album` values in albums.json will be ignored (safely backward compatible)
- Portfolio album ID should already exist in site_config.json
- No data migration needed - just deploy and old field will be ignored
