# Plan: Convert Lightbox Overlay to Dedicated Page

**Status**: Planning
**Date**: 2025-10-28
**Size**: Medium
**Priority**: High (fixes iOS zoom crash issues)

## Problem Statement

The current lightbox implementation is an overlay component that floats on top of the album detail page. This causes several issues:

1. **iOS Safari zoom crash**: When users zoom the album page, then open the lightbox, it can crash or freeze
2. **Complex state management**: Managing two layers of UI state (album page + lightbox overlay)
3. **URL handling complexity**: Using query parameters (`?photo=xyz`) to track lightbox state
4. **Browser back button UX**: Back button behavior is unintuitive with overlay pattern
5. **No native zoom reset**: Can't reliably reset page zoom when opening overlay on iOS

## Proposed Solution

Convert the lightbox from an overlay component to a dedicated full-page view with its own route:

**Current**: `/albums/my-album` with `?photo=xyz` query param for lightbox
**Proposed**: `/albums/my-album/photo/xyz` as a separate page/route

## Architecture Changes

### 1. New Route Structure

```text
/albums/:slug              → Album detail page (grid view)
/albums/:slug/photo/:id    → Photo lightbox page (full-screen view)
```

### 2. Component Changes

#### Create New Page Component: `album-photo-page.ts`

This will be a standalone full-page photo viewer with all functionality built in:

- **Photo Display**: Full-screen photo with pinch-to-zoom support
- **Data Loading**: Loads album data and finds specific photo by ID
- **Navigation**: Keyboard arrows, prev/next buttons, photo counter
- **Toolbar**: Download, share, copy link buttons
- **EXIF Display**: Camera settings, date, location
- **Preloading**: Adjacent photos preloaded for instant navigation
- **Clean Architecture**: No overlay complexity, dedicated route

#### Modify: `album-detail-page.ts`

- Remove lightbox overlay from template
- Remove lightbox state management (`lightboxOpen`, `lightboxIndex`)
- Remove `photo-lightbox` component embedding
- Remove query parameter handling for photos
- Update photo click handler to navigate to new route:

  ```typescript
  private handlePhotoClick(photoId: string) {
    window.location.href = `/albums/${this.slug}/photo/${photoId}`;
  }
  ```

#### Remove: `photo-lightbox.ts` component

- The overlay-based lightbox component will be deprecated
- All functionality moved into `album-photo-page.ts`
- Simpler architecture without z-index/overlay management
- Can remove after confirming new page works correctly

### 3. Routing Updates

Update `main.ts` router configuration:

```typescript
{
  path: '/albums/:slug',
  component: 'album-detail-page'
},
{
  path: '/albums/:slug/photo/:id',
  component: 'album-photo-page'
}
```

### 4. Navigation Flow

**Opening a photo:**

1. User clicks photo on album detail page
2. Navigate to `/albums/album-slug/photo/photo-id`
3. Browser performs full page navigation (zoom state resets naturally!)
4. New page loads with photo in full-screen view

**Navigating between photos:**

1. User clicks next/prev or uses keyboard arrows
2. Update URL: `/albums/album-slug/photo/next-photo-id`
3. Update displayed photo (can be fast without full page reload)
4. Browser history tracks each photo view

**Closing/going back:**

1. User clicks close button or presses Escape
2. Navigate back to `/albums/album-slug`
3. Returns to album grid view
4. Browser back button works intuitively

## Benefits

✅ **iOS zoom issue solved**: Full page navigation naturally resets zoom
✅ **Simpler state management**: Each page has clear, independent state
✅ **Better URL structure**: RESTful, shareable photo URLs
✅ **Intuitive back button**: Browser back naturally returns to album grid
✅ **Cleaner code**: No overlay z-index management, no complex state coordination
✅ **Better for SEO**: Each photo is a distinct URL
✅ **Faster perceived performance**: Full-screen photo loads immediately
✅ **Better mobile UX**: Each view is clearly separated

## Drawbacks/Considerations

⚠️ **Slightly slower transitions**: Full page nav vs. overlay (but faster than overlay with zoom issues!)
⚠️ **More routes to maintain**: Two pages instead of one
⚠️ **Initial load slightly heavier**: Photo page needs to load album data
⚠️ **Need to handle 404s**: What if photo ID doesn't exist in album?

## Implementation Steps

### Phase 1: Create New Page Component (3-4 hours)

1. Create `frontend/src/pages/album-photo-page.ts` with complete functionality:
   - Full-page layout with black background
   - Photo display with responsive sizing
   - URL parameter parsing (album slug, photo ID)
   - Album data loading and photo lookup
   - Close button that navigates back to album
   - Keyboard navigation (arrows for prev/next, Escape to close)
2. Implement photo navigation:
   - Next/previous buttons with SVG icons
   - Photo counter display (X of Y)
   - URL updates using History API (no page reload)
   - **Intelligent photo preloading**: current photo, then expanding outward (±1, ±2, ±3, etc.)
3. Add toolbar features:
   - Download button
   - Share button (native Web Share API)
   - Copy link button
4. Add pinch-to-zoom support:
   - Two-finger pinch gesture detection
   - Scale transformation (1x-4x)
   - Pan support when zoomed
   - Snap-back to fit
   - Double-tap to zoom back out to full view
5. Add EXIF data display (conditional):
   - Camera model, settings, date
   - Toggle visibility
6. Add loading states and error handling

### Phase 2: Update Album Detail Page (1 hour)

1. Remove lightbox overlay from `album-detail-page.ts` template
2. Remove lightbox state management (`lightboxOpen`, `lightboxIndex`)
3. Remove query parameter handling (`checkPhotoParameter`, `updateURLWithPhoto`, etc.)
4. Update photo click handler to navigate to new route
5. Remove `photo-lightbox` component import
6. Clean up unused imports and methods

### Phase 3: Update Routing (30 min)

1. Add new route in `main.ts`:

   ```typescript
   {
     path: '/albums/:slug/photo/:id',
     component: 'album-photo-page'
   }
   ```

2. Import new page component
3. Test navigation flow
4. Test browser back/forward
5. Test direct URL access

### Phase 4: Testing & Polish (1-2 hours)

1. Test on desktop (Chrome, Firefox, Safari):
   - Photo display and navigation
   - Keyboard shortcuts (arrows, Escape)
   - Toolbar functions (download, share, copy)
   - Pinch zoom (on trackpad)
2. Test on mobile (iOS Safari, Chrome):
   - Photo display and navigation
   - Touch navigation (prev/next buttons)
   - Pinch-to-zoom functionality
   - **Verify no zoom crash** (primary goal!)
3. Test edge cases:
   - Invalid photo ID shows error
   - Missing album handles gracefully
   - Direct URL access works
   - Browser back/forward
4. Update any documentation

### Phase 5: Cleanup & Remove Old Code (1 hour)

1. Remove `photo-lightbox.ts` component and its test file
2. Remove any unused overlay-related styles
3. Update tests for `album-detail-page` (remove lightbox tests)
4. Create tests for new `album-photo-page.ts`
5. Document new URL structure in README
6. Update any related documentation

## Technical Details

### URL Structure Examples

```text
/albums/wedding-2024/photo/img_001
/albums/wedding-2024/photo/img_002
/albums/portraits/photo/portrait_05
```

### Photo Page State

**Album Photo Page State:**

```typescript
@property({ type: String }) albumSlug = '';
@property({ type: String }) photoId = '';
@state() private album?: Album;
@state() private currentPhoto?: Photo;
@state() private currentIndex = 0;
@state() private loading = true;
@state() private error = '';
@state() private preloadedImages = new Set<string>(); // Track which photos are preloaded
@state() private preloadQueue: string[] = []; // Queue of photos to preload
```

### Navigation Logic

```typescript
private navigateToPhoto(photoId: string) {
  // Update URL without full page reload
  const url = `/albums/${this.albumSlug}/photo/${photoId}`;
  window.history.pushState({}, '', url);

  // Update displayed photo
  this.photoId = photoId;
  this.updateCurrentPhoto();

  // Start intelligent preloading from current photo outward
  this.startPreloading();
}

private startPreloading() {
  if (!this.album) return;

  const photos = this.album.photos;
  const totalPhotos = photos.length;

  // Build preload queue: current, then expanding outward (±1, ±2, ±3, etc.)
  this.preloadQueue = [];

  for (let offset = 0; offset < totalPhotos; offset++) {
    if (offset === 0) {
      // Current photo (highest priority)
      this.preloadQueue.push(photos[this.currentIndex].id);
    } else {
      // Add right side (+offset)
      const rightIndex = (this.currentIndex + offset) % totalPhotos;
      this.preloadQueue.push(photos[rightIndex].id);

      // Add left side (-offset) if different from right
      const leftIndex = (this.currentIndex - offset + totalPhotos) % totalPhotos;
      if (leftIndex !== rightIndex) {
        this.preloadQueue.push(photos[leftIndex].id);
      }
    }
  }

  // Start preloading from the queue
  this.preloadNextImage();
}

private preloadNextImage() {
  if (!this.album || this.preloadQueue.length === 0) return;

  // Get next photo to preload
  const photoId = this.preloadQueue.shift();
  if (!photoId || this.preloadedImages.has(photoId)) {
    // Already preloaded, move to next
    this.preloadNextImage();
    return;
  }

  // Find photo in album
  const photo = this.album.photos.find(p => p.id === photoId);
  if (!photo) {
    this.preloadNextImage();
    return;
  }

  // Preload the image
  const img = new Image();
  img.onload = () => {
    this.preloadedImages.add(photoId);
    // Continue with next image after short delay to avoid overwhelming network
    setTimeout(() => this.preloadNextImage(), 100);
  };
  img.onerror = () => {
    // Skip failed image and continue
    this.preloadNextImage();
  };
  img.src = `/static/photos/${this.albumSlug}/${photo.filename}`;
}private close() {
  // Navigate back to album
  window.location.href = `/albums/${this.albumSlug}`;
}
```

## Risks & Mitigation

**Risk**: Performance impact from full page navigation
**Mitigation**: Use history API to update URL without reload when navigating between photos. Only initial open is full navigation. Intelligent preloading ensures all album photos are loaded in priority order (current photo first, then expanding outward).

**Risk**: Breaking existing shared photo links with `?photo=` format
**Mitigation**: Add redirect in router to handle old format and redirect to new format.

**Risk**: More complex routing
**Mitigation**: Well-documented, clear URL patterns. Standard REST conventions.

**Risk**: Accidental data reloading
**Mitigation**: Cache album data in memory when navigating between photos of same album. Intelligent preloading system loads all photos in background, starting from current and expanding outward (±1, ±2, ±3, etc.) with 100ms delay between loads to avoid network congestion.

## Dependencies

- No external dependencies
- No breaking backend changes
- Requires frontend-only changes
- Must update any links to photos (if they exist elsewhere)

## Testing Checklist

- [ ] Desktop: Open photo from album grid
- [ ] Desktop: Navigate next/prev with keyboard
- [ ] Desktop: Navigate next/prev with buttons
- [ ] Desktop: Close with Escape key
- [ ] Desktop: Close with close button
- [ ] Mobile: Tap photo to open
- [ ] Mobile: Swipe/tap next/prev
- [ ] Mobile: Close with button
- [ ] Mobile: iOS Safari - verify no zoom crash
- [ ] Mobile: Pinch to zoom photo
- [ ] Browser back button returns to album
- [ ] Browser forward button returns to photo
- [ ] Direct URL access works: `/albums/slug/photo/id`
- [ ] Invalid photo ID shows error
- [ ] Share button creates correct URL
- [ ] Copy link creates correct URL
- [ ] Download works

## Success Criteria

1. ✅ No iOS Safari zoom crashes
2. ✅ Browser back button works intuitively
3. ✅ Photo URLs are shareable and bookmarkable
4. ✅ Navigation feels fast and responsive
5. ✅ All existing lightbox features work (zoom, share, download, EXIF)
6. ✅ Code is simpler and easier to maintain

## Timeline

**Estimated Total**: 6-8 hours of development
**Breakdown**:

- Phase 1 (Create page): 3-4 hours
- Phase 2 (Update album page): 1 hour
- Phase 3 (Routing): 30 min
- Phase 4 (Testing): 1-2 hours
- Phase 5 (Cleanup): 1 hour

**Can be done incrementally**: Yes, can keep old lightbox until new page is fully tested

## Notes

- This approach is more aligned with traditional web architecture
- Solves iOS zoom issue without hacky workarounds
- Better for accessibility (each photo is distinct page)
- More maintainable long-term
- Standard pattern used by major photo sites (Flickr, 500px, etc.)
