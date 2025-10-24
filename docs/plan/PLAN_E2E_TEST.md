# E2E and Visual Regression Test Plan

## Overview

This plan establishes a comprehensive testing strategy using **Vitest 4.0** with **Browser Mode** and **Playwright** for end-to-end testing and visual regression testing. The goal is to ensure UI stability, catch visual regressions, and maintain code quality through automated testing.

## Testing Stack

### Core Testing Framework

- **Vitest 4.0** - Modern, fast test runner with built-in browser testing
- **Playwright** - Browser automation via `@vitest/browser-playwright`
- **Visual Regression** - Vitest 4's new `toMatchScreenshot` matcher
- **Coverage** - Built-in coverage with `@vitest/coverage-v8`

### Key Features in Vitest 4.0

1. **Stable Browser Mode** - No longer experimental
2. **Visual Regression Testing** - Screenshot comparison built-in
3. **Playwright Traces** - Debug with trace viewer
4. **Type-Aware Hooks** - Extended context in lifecycle hooks
5. **Schema Matching** - Validate with Zod/Valibot schemas

## Test Categories

### 1. Component Tests (Unit Level)

Test individual Lit components in isolation using Vitest's browser mode.

**Priority Components:**

- `upload-placeholder` - All four states (uploading, processing, complete, error)
- `storage-stats` - Display logic, warning banners, refresh
- `photo-grid` - Layout modes (masonry, grid, square, justified)
- `photo-lightbox` - Navigation, EXIF display, keyboard controls
- `album-card` - Cover photos, password badges, visibility states
- `toast-notification` - Success/error states, auto-dismiss

**Testing Approach:**

```typescript
import { expect, test } from 'vitest';
import { page } from 'vitest/browser';

test('upload placeholder shows progress', async () => {
  // Render component with props
  const placeholder = page.getByTestId('upload-placeholder');

  // Verify visual state
  await expect(placeholder).toMatchScreenshot('upload-25-percent');

  // Check viewport visibility
  await expect.element(placeholder).toBeInViewport();
});
```

### 2. Page-Level E2E Tests

Test complete user flows through the application.

**Critical User Flows:**

**Admin Workflows:**

1. **Login Flow** - Invalid credentials, successful login, session persistence
2. **Album Creation** - New album, add photos, set cover, reorder photos
3. **Photo Upload** - Single file, multiple files (10, 50, 100), concurrent uploads
4. **Album Management** - Edit details, change visibility, password protection
5. **Settings Update** - Site config, storage limits, social links

**Public Workflows:**

1. **Portfolio View** - Hero display, photo grid, lightbox navigation
2. **Album Browse** - List view, password-protected access
3. **Photo Navigation** - Lightbox keyboard controls, EXIF data, downloads
4. **Responsive Layouts** - Mobile, tablet, desktop breakpoints

**Example Test:**

```typescript
test('complete photo upload workflow', async () => {
  // Login
  await page.goto('/admin/login');
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Login' }).click();

  // Create album
  await page.goto('/admin/albums/new');
  await page.getByLabel('Title').fill('Test Album');
  await page.getByRole('button', { name: 'Create Album' }).click();

  // Upload photos
  await page
    .getByTestId('upload-area')
    .setInputFiles(['./test-fixtures/photo1.jpg', './test-fixtures/photo2.jpg']);

  // Verify upload placeholders appear
  await expect.element(page.getByTestId('upload-placeholder')).toHaveLength(2);

  // Wait for completion
  await expect(page.getByText('Successfully uploaded 2 photo(s)')).toBeVisible();

  // Screenshot final state
  await expect(page.getByTestId('photos-grid')).toMatchScreenshot('uploaded-photos');
});
```

### 3. Visual Regression Tests

Capture and compare screenshots to detect unintended UI changes.

**Critical UI Elements:**

- Album editor layout (sidebar + photo grid)
- Storage stats cards and warning states
- Upload progress indicators
- Photo grids in all layout modes
- Lightbox overlay and controls
- Admin dashboard cards
- Settings forms

**Viewport Testing:**

- Desktop: 1920x1080, 1366x768
- Tablet: 768x1024
- Mobile: 375x667

**Theme Testing:**

- Light mode screenshots
- Dark mode screenshots

### 4. API Integration Tests

Test backend endpoints with schema validation.

```typescript
test('album creation API', async () => {
  const response = await fetch('/api/admin/albums', {
    method: 'POST',
    body: JSON.stringify({
      title: 'New Album',
      visibility: 'public',
    }),
  });

  const album = await response.json();

  // Validate response schema with Zod
  expect(album).toEqual({
    id: expect.schemaMatching(z.string().uuid()),
    title: expect.schemaMatching(z.string().min(1)),
    slug: expect.schemaMatching(z.string()),
    created_at: expect.schemaMatching(z.string().datetime()),
  });
});
```

## Configuration

### Vitest Config

```typescript
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  test: {
    browser: {
      provider: playwright({
        launchOptions: {
          slowMo: 100, // Easier debugging
        },
      }),
      instances: [{ browser: 'chromium' }, { browser: 'firefox' }],
      screenshotFailures: false, // Don't capture on failures
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/test-*.ts'],
    },
  },
});
```

## Coverage Targets

- **Unit Tests**: 80%+ coverage for core components
- **E2E Tests**: All critical user workflows covered
- **Visual Regression**: Key UI states captured
- **API Tests**: All admin endpoints validated

## Test Organization

```text
frontend/
├── src/
│   ├── components/
│   │   ├── upload-placeholder.test.ts
│   │   ├── storage-stats.test.ts
│   │   └── ...
│   ├── pages/
│   │   ├── admin-album-editor-page.test.ts
│   │   └── ...
│   └── utils/
│       ├── admin-api.test.ts
│       └── ...
├── tests/
│   ├── e2e/
│   │   ├── admin-workflows.test.ts
│   │   ├── public-workflows.test.ts
│   │   └── visual-regression.test.ts
│   └── fixtures/
│       ├── photo1.jpg
│       ├── photo2.jpg
│       └── test-data.json
└── __snapshots__/
    └── visual-regression.test.ts/
        ├── hero-section-chromium.png
        └── ...
```

## Debugging

### Playwright Traces

Enable traces for failed tests:

```bash
vitest --browser.trace=retain-on-failure
```

View traces:

```bash
npx playwright show-trace trace.zip
```

### VS Code Integration

Use "Debug Test" button in VS Code with the Vitest extension.

### Manual Debugging

```bash
vitest --inspect --browser
```

## CI/CD Integration

Run in CI with verbose reporter:

```bash
vitest run --browser --reporter=verbose --coverage
```

## Implementation Priority

1. **Phase 1** - Component unit tests (high-value components first)
2. **Phase 2** - Admin workflow E2E tests (login, album creation, uploads)
3. **Phase 3** - Visual regression baseline capture
4. **Phase 4** - Public workflow E2E tests
5. **Phase 5** - Comprehensive visual regression suite

## Success Metrics

- All critical workflows covered by E2E tests
- No visual regressions in pull requests
- 80%+ code coverage maintained
- Tests run in < 5 minutes locally
- CI test suite completes in < 10 minutes
