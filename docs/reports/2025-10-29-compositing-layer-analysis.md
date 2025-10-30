# Compositing Layer Analysis - iOS Safari Crash Investigation

**Date**: 2025-10-29
**Issue**: iOS Safari crashes when users zoom out far enough after zooming in
**Root Cause**: Extreme viewport zoom causes Safari to exceed GPU memory/texture limits, triggering page reload and crashes

## Compositing Triggers Found in Codebase

### 1. `position: fixed` (High Impact)

**Locations:**

- `album-photo-page.ts:73` - `:host { position: fixed; z-index: 9999; }` - **ENTIRE PHOTO PAGE**
- `toast-notification.ts:20` - Toast notifications
- `admin-albums-page.ts:229` - Modal overlays
- `styles/admin.css:228` - Admin modals

**Impact**: `position: fixed` creates a compositing layer, especially combined with high `z-index`. The photo page being a full-screen fixed layer is particularly expensive.

**Recommendation**:

- **Keep photo page as fixed** (needed for full-screen overlay behavior)
- Consider removing fixed positioning from less critical elements (toasts could use `absolute` in a fixed container)

---

### 2. `will-change: transform` (High Impact)

**Location:**

- `album-photo-page.ts:240` - Photo `<img>` element

**Impact**: Tells browser to create a compositing layer for the image in anticipation of transforms. Combined with large images and viewport zoom, this can consume massive GPU memory.

**Recommendation**:

- **Remove `will-change: transform`** - It's an optimization hint that becomes harmful when Safari is already under memory pressure
- The browser will still hardware-accelerate transforms when they occur; `will-change` is premature optimization here

---

### 3. `position: sticky` (Medium Impact)

**Location:**

- `admin-header.ts:18` - Admin header navigation

**Impact**: Creates compositing layer during scroll

**Recommendation**:

- **Leave as-is** - Only appears on admin pages, not user-facing pages where crashes occur

---

### 4. CSS `filter` Property (Medium Impact)

**Locations:**

- `album-photo-page.ts:339` - `filter: blur(10px)` on thumbnail during loading
- `admin.css:142` - `filter: brightness(0.95)` on hover states
- `admin-header.ts:87` - `filter: grayscale(100%)` on logo

**Impact**: `filter` creates compositing layers, especially `blur()` which is GPU-intensive.

**Recommendation**:

- **Consider removing blur on photo thumbnails** - This is only shown during loading state and contributes to memory pressure
- Admin filters are fine (not on crash-prone pages)

---

### 5. CSS Animations on `transform` (Medium Impact)

**Locations:**

- `toast-notification.ts` - Slide in/out animations using `transform: translateY()`
- `album-cover-hero.ts` - Bounce animation using `transform: translateY()`
- `loading-spinner.ts` - Spin animation using `transform: rotate()`
- `lazy-image.ts` - Pulse animation using `opacity`
- `upload-placeholder.ts` - Spin/pulse animations

**Impact**: Animating `transform` creates compositing layers for each animated element.

**Recommendation**:

- **Leave as-is** - These are small elements and animations are brief. Not primary culprit.

---

### 6. High `z-index` Stacking (Medium Impact)

**Stacking layers found:**

- Photo page: `z-index: 9999` (host), `10` (toolbar), `5` (nav buttons), `1` (loading overlay)
- App shell: `z-index: 100` (floating nav), `10` (normal nav)
- Toasts: `z-index: 9999`
- Admin modals: `z-index: 1000`

**Impact**: Multiple high z-index layers can trigger implicit compositing when elements overlap.

**Recommendation**:

- **Reduce z-index values** - Use 1-10 range instead of 9999. Modern browsers handle stacking context well without extreme values.
- **Consolidate stacking** - Photo page could use `z-index: 100` instead of `9999`

---

### 7. NOT FOUND (Good News)

- ✅ No 3D transforms (`translateZ`, `translate3d`, `perspective`)
- ✅ No `-webkit-overflow-scrolling: touch`
- ✅ No `backface-visibility: hidden`
- ✅ No `<iframe>` elements

---

## Primary Culprit: Photo Page Fixed Layer + Large Images + Viewport Zoom

The **combination** of these factors creates the crash:

1. **Full-screen fixed positioning** (`album-photo-page.ts` `:host`)
2. **High z-index** (`9999`)
3. **will-change: transform** on image element
4. **Large image dimensions** (high-res photos)
5. **Extreme viewport zoom-out** (Safari tries to render 10x+ viewport)

When zoomed out far enough, Safari must render:

- The compositing layer for the fixed photo page (full viewport × zoom scale)
- The image layer (potentially multiple megapixels × zoom scale)
- All transform layers anticipated by `will-change`

This exceeds GPU memory limits → Safari discards tiles (black areas) → reload → crash loop

---

## Recommended Fixes (Priority Order)

### 1. Remove `will-change: transform` ⭐⭐⭐

**File**: `frontend/src/pages/album-photo-page.ts:240`

```diff
-      will-change: transform;
```

**Impact**: Reduces memory allocation for transform layers. Browser still accelerates actual transforms.

---

### 2. Remove `filter: blur()` from Loading State ⭐⭐

**File**: `frontend/src/pages/album-photo-page.ts:339`

```diff
-    .photo-thumbnail {
-      filter: blur(10px);
-      opacity: 0.5;
-    }
+    .photo-thumbnail {
+      opacity: 0.3;
+    }
```

**Impact**: Reduces GPU memory during image loading transitions.

---

### 3. Reduce z-index Values ⭐

**File**: `frontend/src/pages/album-photo-page.ts:73`

```diff
-      z-index: 9999;
+      z-index: 100;
```

**File**: `frontend/src/components/toast-notification.ts:20`

```diff
-      z-index: 9999;
+      z-index: 200;
```

**Impact**: Cleaner stacking context, less implicit compositing.

---

### 4. Long-term: Investigate Lighter Photo Viewer

Consider whether the photo page needs `position: fixed` at all, or if there's a lighter approach:

- Could use a modal overlay pattern instead of full fixed page
- Could lazy-load high-res images only when zoomed in
- Could implement progressive image loading (low-res → high-res)

---

## Testing Plan

After applying fixes:

1. Deploy changes
2. Test on iPhone Safari:
   - Navigate to photo page
   - Zoom in significantly
   - Zoom out far beyond normal viewport
   - Check for black areas appearing
   - Check if page reloads
   - Check if Safari crashes

Expected result: Page may still reload under extreme zoom (Safari memory pressure), but should recover gracefully with our `pageshow` handler instead of crashing.

---

## References

- [Compositing and Layer Creation in Chrome](https://developers.google.com/web/updates/2018/09/inside-browser-part3)
- [CSS will-change](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change)
- [Safari WebKit Memory Limits](https://webkit.org/blog/8970/memory-footprint/)
