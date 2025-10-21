# Feature Implementation: Drag-and-Drop Photo Reordering

**Date**: October 21, 2025
**Time**: 11:00 AM PST
**Status**: ✅ Complete

## Overview

Implemented drag-and-drop functionality to allow administrators to reorder photos within albums by dragging them to new positions in the album editor. This feature provides an intuitive, visual way to organize album photos without requiring manual order field editing.

## Changes Made

### Backend (Go)

**1. Album Service** (`backend/internal/services/album_service.go`)

- Added `ReorderPhotos(albumID string, photoIDs []string)` method
- Validates all photo IDs exist in the album
- Reorders photos and updates their `Order` field sequentially
- Performs atomic write operation to persist changes

**2. Album Handler** (`backend/internal/handlers/album_handler.go`)

- Added `ReorderPhotos(w http.ResponseWriter, r *http.Request)` endpoint handler
- Accepts JSON payload with `photo_ids` array
- Returns 204 No Content on success
- Returns 400 Bad Request if photo count doesn't match or IDs are invalid

**3. Router** (`backend/cmd/admin/main.go`)

- Added route: `POST /api/admin/albums/{id}/reorder-photos`
- Protected with authentication middleware

**4. Tests** (`backend/internal/services/album_service_test.go`)

- Added `TestAlbumService_ReorderPhotos` - tests successful reordering
- Added `TestAlbumService_ReorderPhotos_InvalidCount` - tests error handling for wrong photo count
- Added `TestAlbumService_ReorderPhotos_InvalidPhotoID` - tests error handling for invalid photo IDs
- All tests pass ✅

### Frontend (TypeScript + Lit)

**1. Admin API Utility** (`frontend/src/utils/admin-api.ts`)

- Added `reorderPhotos(albumId: string, photoIds: string[])` function
- Calls backend endpoint with photo IDs in desired order

**2. Album Editor Page** (`frontend/src/pages/admin-album-editor-page.ts`)

**State Management:**

- Added `draggedPhotoId: string | null` - tracks which photo is being dragged
- Added `dragOverPhotoId: string | null` - tracks which photo is being hovered over

**Event Handlers:**

- `handlePhotoDragStart(e: DragEvent, photoId: string)` - initiates drag operation
- `handlePhotoDragEnd(e: DragEvent)` - cleans up after drag operation
- `handlePhotoDragOver(e: DragEvent, photoId: string)` - handles drag hover state
- `handlePhotoDragLeave(e: DragEvent, photoId: string)` - clears hover state
- `handlePhotoDrop(e: DragEvent, targetPhotoId: string)` - processes the drop and reorders photos

**CSS Styling:**

- Added `cursor: move` to photo items for drag affordance
- Added hover effect with transform and shadow
- Added `.dragging` class with reduced opacity
- Added `.drag-over` class with blue border and glow effect
- Smooth transitions for all visual feedback

**Template Updates:**

- Made photo items `draggable="true"`
- Bound all drag event handlers to photo items
- Applied dynamic CSS classes based on drag state

## User Experience

### Visual Feedback

1. **Hover**: Photos lift slightly with shadow when hovered
2. **Drag Start**: Dragged photo becomes semi-transparent (40% opacity)
3. **Drag Over**: Target drop position shows blue border and glow
4. **Drop**: Photos reorder instantly with smooth transition
5. **Success**: Brief success message confirms save to backend
6. **Error**: Error message shown if save fails, auto-reverts to previous order

### Interaction Flow

1. User hovers over a photo (cursor changes to move icon)
2. User clicks and drags photo to new position
3. As user drags, target drop zones highlight with blue border
4. User releases mouse to drop photo in new position
5. Photos reorder immediately in UI
6. Backend API call persists the new order
7. Success message appears briefly
8. If backend fails, error message shown and photos revert to previous order

## Technical Implementation Details

### Drag-and-Drop Strategy

- Uses native HTML5 Drag and Drop API (no external libraries)
- Optimistic UI updates for instant visual feedback
- Backend API call happens after UI update for responsive feel
- Error handling reverts to saved state if backend call fails

### Data Flow

1. User drags photo → `handlePhotoDragStart` sets `draggedPhotoId`
2. User drags over target → `handlePhotoDragOver` sets `dragOverPhotoId` for visual feedback
3. User drops photo → `handlePhotoDrop`:
   - Calculates new order by finding indices and splicing array
   - Updates local state immediately
   - Calls `reorderPhotos()` API with new photo ID order
   - Shows success message or error message
   - Reloads album data on error to revert

### Backend Validation

- Ensures photo count matches album photo count (prevents missing photos)
- Validates all photo IDs exist in album (prevents invalid IDs)
- Atomic write operation (all-or-nothing persistence)
- Returns descriptive error messages for debugging

## Testing

### Backend Tests

```bash
cd backend && go test ./internal/services -v -run "ReorderPhotos"
```

- ✅ TestAlbumService_ReorderPhotos - basic reordering
- ✅ TestAlbumService_ReorderPhotos_InvalidCount - error handling
- ✅ TestAlbumService_ReorderPhotos_InvalidPhotoID - validation

### Manual Testing Checklist

- ✅ Photos can be dragged and dropped to new positions
- ✅ Visual feedback shows during drag operation
- ✅ Photos reorder correctly in the UI
- ✅ Backend persists new order (verified by page reload)
- ✅ Error handling works if backend call fails
- ✅ Works with 1, 2, and many photos
- ✅ Doesn't break existing photo operations (delete, set cover)

## Code Quality

- All Go code formatted with `go fmt`
- All TypeScript code formatted with Prettier
- No linting errors
- No TypeScript compilation errors
- All existing tests still pass
- New tests added for new functionality

## Future Enhancements (Post-MVP)

1. **Touch Support**: Add touch event handlers for mobile drag-and-drop
2. **Keyboard Navigation**: Add keyboard shortcuts for reordering (Alt+Arrow keys)
3. **Bulk Reorder**: Add "Sort by date", "Sort by name", "Reverse order" buttons
4. **Undo/Redo**: Add undo/redo stack for reorder operations
5. **Drag Preview**: Show custom drag image with photo thumbnail
6. **Multi-Select**: Allow dragging multiple photos at once

## Files Modified

### Backend

- `backend/internal/services/album_service.go`
- `backend/internal/services/album_service_test.go`
- `backend/internal/handlers/album_handler.go`
- `backend/cmd/admin/main.go`

### Frontend

- `frontend/src/utils/admin-api.ts`
- `frontend/src/pages/admin-album-editor-page.ts`

## Commit Message

```text
feat: add drag-and-drop photo reordering in album editor

Backend changes:
- Add ReorderPhotos service method with validation
- Add POST /api/admin/albums/{id}/reorder-photos endpoint
- Add comprehensive tests for reorder functionality

Frontend changes:
- Implement HTML5 drag-and-drop with visual feedback
- Add draggable photo items with hover effects
- Optimistic UI updates with error handling
- Instant visual feedback during drag operations

All tests pass. Ready for production use.
```

## Summary

This feature significantly improves the admin UX by allowing intuitive visual reordering of album photos. The implementation follows best practices with proper error handling, optimistic UI updates, comprehensive tests, and clean separation of concerns. The drag-and-drop interface feels responsive and professional, with clear visual feedback at every step.
