# Concurrent Upload Implementation Plan

**Status**: Planning
**Priority**: High (MVP Enhancement)
**Complexity**: Medium-High

## Overview

Enhance the photo upload system to support concurrent uploads with real-time visual progress feedback. Users can upload multiple images simultaneously with live progress indicators shown as placeholder grid items.

## Goals

1. **Concurrent Uploads**: Upload multiple images simultaneously with controlled concurrency
2. **Visual Progress**: Show real-time progress for each uploading image
3. **Graceful Errors**: Display persistent error states for failed uploads
4. **Professional UX**: Smooth, informative feedback that builds user confidence

## User Experience

### Visual Design

**Upload Placeholder Grid Item**:

- Appears in the photo grid immediately when upload starts
- Shows image filename (truncated if needed)
- Four states:
  1. **Uploading** (0-100%): Blue circular progress arc showing real upload progress, "Uploading..."
  2. **Waiting**: No progress arc, "Waiting..." text _(when upload complete, waiting for backend worker)_
  3. **Processing**: No progress arc, "Processing..." text with subtle pulsing animation
  4. **Complete**: Brief "Complete!" message, then thumbnail fades in
  5. **Error**: Red border, error icon, specific error message, tap to dismiss

**Progress Flow**:

```text
User selects 100 images
  → 100 placeholder grid items appear instantly
  → Network upload begins (3 at a time): Shows REAL 0-100% progress arc
  → Upload completes: Progress arc disappears, shows "Waiting..."
  → Backend worker picks up file: "Processing..."
  → Success: Shows "Complete!" as thumbnail fades quickly in (300ms, don't wait if thumnail is available, fade in fast!)
  → Error: Shows specific error message with red border
  → User can see: "Uploading 3, Waiting 10, Processing 3, Complete 84" at top
```

### Interaction Model

- **Drag & Drop**: Works as today, but with new progress indicators
- **Click to Upload**: Same behavior
- **During Upload**: User can navigate away (uploads continue in background)
- **Error Dismissal**: Click/tap error placeholder to dismiss it
- **Toast Notifications**: "Uploading 5 images..." → "4 of 5 uploaded successfully"

### Upload Architecture: Per-File HTTP Requests

**Key Design Decision**: Upload each file as a separate HTTP request (not batch upload).

```text
Frontend                          Backend
--------                          -------

File 1: [===== 0-100% =====] ──→  Process File 1 ──→ Response 1
File 2: [===== 0-100% =====] ──→  Process File 2 ──→ Response 2
File 3: [===== 0-100% =====] ──→  Process File 3 ──→ Response 3
  (3 concurrent at a time)          (3 concurrent)

File 4: [waiting for slot...]
File 5: [waiting for slot...]
...
File 100: [waiting for slot...]
```

**Benefits**:

- Each HTTP request lifecycle tells us exact state transitions
- No need for polling or SSE for progress
- Natural concurrency control (3 concurrent uploads)
- Each file's success/failure is independent
- Can start processing as soon as each file arrives

**State Transitions Per File**:

```text
XHR Created → xhr.upload.progress → xhr.upload.load → xhr.onload
     ↓              ↓                      ↓               ↓
  Placeholder   "Uploading 47%"     "Processing..."   Thumbnail
   appears                                              appears
```

## Technical Design

### Frontend Changes

#### 1. New Component: `upload-placeholder.ts`

```typescript
// Lit web component
interface UploadPlaceholderProps {
  filename: string;
  progress: number; // 0-100, only used during 'uploading' state
  status: 'uploading' | 'waiting' | 'processing' | 'complete' | 'error';
  error?: string;
  onDismiss?: () => void;
}
```

**Visual Appearance**:

- Square aspect ratio (matches photo grid)
- **Uploading state**: Circular progress arc (SVG) showing 0-100%
- **Waiting/Processing states**: No progress arc, just text with optional animation
- Filename centered (small, muted text)
- Status text below filename:
  - "Uploading..." (with 0-100% arc)
  - "Waiting..." (no arc)
  - "Processing..." (no arc, subtle pulse animation)
  - "Faieled" with an error message"
- Error state: red border, error icon, error message

#### 2. Modified: `admin-album-editor-page.ts`

**State Management**:

```typescript
@state() private uploadingFiles: Map<string, UploadProgress> = new Map();

interface UploadProgress {
  filename: string;
  progress: number; // 0-100, only meaningful during 'uploading'
  status: 'uploading' | 'waiting' | 'processing' | 'complete' | 'error';
  error?: string;
}
```

**Key Changes**:

- Track upload progress per file
- Render placeholders alongside actual photos
- Handle progress callbacks from `uploadPhotos()`
- Show REAL upload progress (0-100%) during network transfer
- After upload completes, transition to text-only states ("Waiting...", "Processing...")
- Remove placeholder when thumbnail appears or user dismisses error
- Show summary counts: "Uploading: 3 | Waiting: 10 | Processing: 3 | Complete: 84"
- Update storage stats after all uploads complete

**Visual Design:**

```text
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   ⟲ 47%         │     │                 │     │                 │
│                 │     │                 │     │    ⟳           │
│  image.jpg      │ →   │  image.jpg      │ →   │  image.jpg      │
│  Uploading...   │     │  Waiting...     │     │  Processing...  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
   (Progress Arc)          (Text Only)            (Text + Pulse)
```

#### 3. Modified: `admin-api.ts`

**Already Implemented** ✅:

- `uploadPhotos()` function supports progress callbacks
- Concurrent upload handling (3 files at a time)
- Per-file error reporting

**Enhancement Needed**:

- Report REAL upload progress (0-100%) during network transfer using XHR progress events
- Handle state transitions based on HTTP request lifecycle

**State Transition Mechanism**:

Key insight: **Each file is uploaded as a separate HTTP request** (not batch). This gives us clear transition points:

```typescript
// Per-file upload lifecycle
async function uploadSinglePhoto(file: File, onProgress: ProgressCallback) {
  const formData = new FormData();
  formData.append('photos', file);

  // STATE 1: Uploading (0-100%)
  // Use XMLHttpRequest for upload progress events
  const xhr = new XMLHttpRequest();
  xhr.upload.addEventListener('progress', (e) => {
    if (e.lengthComputable) {
      const percent = (e.loaded / e.total) * 100;
      onProgress({
        filename: file.name,
        status: 'uploading',
        progress: percent, // Real progress!
      });
    }
  });

  // STATE 2: Processing
  // Upload complete, waiting for backend to process and respond
  xhr.upload.addEventListener('load', () => {
    onProgress({
      filename: file.name,
      status: 'processing', // Backend is working
      progress: 100,
    });
  });

  // Send request
  xhr.open('POST', `/api/admin/albums/${albumId}/photos/upload`);
  xhr.send(formData);

  // STATE 3: Complete
  // Backend responds when processing is done
  await new Promise((resolve, reject) => {
    xhr.onload = () => {
      if (xhr.status === 200) {
        const result = JSON.parse(xhr.responseText);
        onProgress({
          filename: file.name,
          status: 'complete',
          progress: 100,
        });
        resolve(result);
      } else {
        reject(new Error('Upload failed'));
      }
    };
    xhr.onerror = () => reject(new Error('Network error'));
  });
}
```

**State Transitions**:

1. **Uploading (0-100%)**: Real XHR upload progress events
2. **Processing**: Triggered when `xhr.upload.load` fires (upload complete, backend processing)
3. **Complete**: Triggered when `xhr.onload` fires (backend HTTP response received)

**No polling or estimation needed!** The HTTP request lifecycle tells us exactly when transitions happen.

**Simplified Alternative**:

We can skip "Waiting" state entirely:

- **Uploading**: 0-100% real progress
- **Processing**: As soon as upload completes (one state for backend work)
- **Complete**: Backend responds

This is simpler and equally accurate since "Waiting" would be very brief.

**Loading the Completed Image**:

When the backend responds (xhr.onload), the response includes:

```json
{
  "uploaded": [
    {
      "id": "abc123",
      "filename_original": "photo.jpg",
      "url_thumbnail": "/static/uploads/thumbnails/abc123_thumbnail.webp"
    }
  ],
  "errors": []
}
```

The frontend:

1. Receives the response with thumbnail URL
2. Updates state to `complete`
3. Renders actual photo component with thumbnail URL
4. Removes placeholder from `uploadingFiles` map
5. Adds photo to album's photo list (triggers re-render)

The placeholder automatically disappears and the real thumbnail appears because they're conditionally rendered based on whether the photo exists in the album data or in the uploading state map.

### Backend Changes

#### 1. Current Implementation

**File**: `backend/internal/handlers/album_handler.go`

Current flow:

```go
for _, fileHeader := range files {
  photo, err := h.imageService.ProcessUpload(fileHeader)  // Sequential
  if err != nil {
    errors = append(errors, ...)
    continue
  }
  uploadedPhotos = append(uploadedPhotos, *photo)
}
```

**Issues**:

- Processes images sequentially (slow for multiple files)
- No progress reporting during processing
- Single-threaded image processing

**Note**: Since we're uploading one file at a time from the frontend, the backend receives one file per request. The sequential loop is fine! We only need worker pools if we want concurrent processing when a single request contains multiple files (which won't happen with our approach).

#### 2. Backend Enhancement: Keep It Simple OR Add Worker Pool

**Option A: No Backend Changes Needed** ✅ (Recommended for MVP):

Since frontend uploads one file at a time (3 concurrent requests max), the backend is already processing 3 images concurrently (3 separate HTTP requests). No changes needed!

**Option B: Worker Pool for Multi-File Requests** (Future Enhancement):

If we ever want to support uploading all 100 files in a single HTTP request, then add worker pool pattern:

**File**: `backend/internal/handlers/album_handler.go`

```go
// New struct for processing results
type uploadResult struct {
  photo *models.Photo
  err   error
  filename string
}

func (h *AlbumHandler) UploadPhotos(w http.ResponseWriter, r *http.Request) {
  // ... existing validation ...

  // Create worker pool (max 3 concurrent processing jobs)
  const maxWorkers = 3
  jobs := make(chan *multipart.FileHeader, len(files))
  results := make(chan uploadResult, len(files))

  // Start workers
  var wg sync.WaitGroup
  for i := 0; i < maxWorkers; i++ {
    wg.Add(1)
    go func() {
      defer wg.Done()
      for fileHeader := range jobs {
        photo, err := h.imageService.ProcessUpload(fileHeader)
        results <- uploadResult{
          photo: photo,
          err: err,
          filename: fileHeader.Filename,
        }
      }
    }()
  }

  // Send jobs
  for _, fh := range files {
    jobs <- fh
  }
  close(jobs)

  // Wait and close results
  go func() {
    wg.Wait()
    close(results)
  }()

  // Collect results
  uploadedPhotos := []models.Photo{}
  errors := []string{}

  for result := range results {
    if result.err != nil {
      errors = append(errors, result.filename + ": " + result.err.Error())
      continue
    }

    // Add photo to album
    if err := h.albumService.AddPhoto(albumID, result.photo); err != nil {
      errors = append(errors, result.filename + ": " + err.Error())
      continue
    }

    uploadedPhotos = append(uploadedPhotos, *result.photo)
  }

  // ... existing response ...
}
```

**Key Design Decisions**:

- **Worker Pool Size**: 3 workers (image processing is CPU/memory intensive)
- **Channels**: Coordinate work distribution and result collection
- **WaitGroup**: Ensure all workers complete before responding
- **Error Handling**: Preserve per-file error messages
- **Atomicity**: Each image processed independently
- **Progress Reporting**: Only real upload progress (0-100%), then text states
- **No Fake Progress**: Backend doesn't report processing substeps - we just show "Processing..."

#### 3. Modified: `image_service.go`

**No Changes Required** ✅:

Since we're only showing real upload progress and then simple "Waiting..." / "Processing..." text states, we don't need to modify the backend to report processing progress. The approach is:

1. **Upload**: Real XHR progress events give us 0-100%
2. **After Upload**: Frontend shows "Waiting..." (file uploaded, queued on backend)
3. **Backend Processing**: Frontend shows "Processing..." (can estimate when this starts based on timing)
4. **Complete**: Backend responds, thumbnail appears

This is honest and simple. No fake percentages, no complex progress streaming.

**Existing thread-safety** ✅:

- `ProcessUpload()` is already thread-safe (processes single file)
- Uses `uuid.New()` for unique filenames (thread-safe)
- Writes to separate files (no shared state)
- EXIF extraction is stateless

**Potential Concern**:

- Multiple goroutines writing to disk simultaneously
- **Mitigation**: Modern filesystems handle concurrent writes well
- **Monitoring**: Add logging to detect any I/O contention issues

## Limits & Constraints

### Upload Limits

**Frontend**:

- **Max files per batch**: 100 files
- **Concurrent network uploads**: 3 at a time (browser HTTP/2 limits)
- **Reasoning**:
  - Modern browsers can handle 100+ files in FormData easily
  - Progress indicators keep UI responsive
  - Network uploads are throttled to 3 at a time (controlled)
  - Memory footprint is minimal (just tracking state, not holding file data)

**Backend**:

- **Concurrent processing**: 3 goroutines
- **Max total upload size**: 5GB (existing multipart form limit)
- **Per-file size limit**: 60MB (from site_config.json)
- **Reasoning**: Image processing (libvips) is memory-intensive
  - ~200MB RAM per 4K image being processed
  - 3 concurrent = ~600MB peak memory (acceptable)
  - 100 files queued is fine - they're processed sequentially through the worker pool
  - Processing time: ~2-3 seconds per image × 100 = ~5-10 minutes total (acceptable for bulk uploads)

### Performance Considerations

**Upload Speed**:

- Network: Bottleneck for most users (upload bandwidth)
- Frontend batching: 3 at a time prevents browser overload
- Backend processing: 3 concurrent workers prevent memory exhaustion

**Memory Usage**:

- Frontend: Minimal (progress state only)
- Backend: ~200MB per image × 3 = 600MB peak
- Safe for systems with 2GB+ RAM

## Risks & Mitigation

### High Risk

**1. Backend Memory Exhaustion**

- **Risk**: 3 concurrent 60MB images = potential 600MB+ memory usage
- **Mitigation**:
  - Set worker pool size to 3 (configurable)
  - Monitor memory usage in production
  - Add memory limit checks before processing
- **Severity**: High (could crash backend)
- **Likelihood**: Medium (depends on user behavior)

**2. Disk I/O Contention**

- **Risk**: Multiple goroutines writing simultaneously could slow down
- **Mitigation**:
  - Worker pool limits concurrent writes
  - Modern filesystems handle this well
  - Monitor disk I/O metrics
- **Severity**: Medium (slower uploads)
- **Likelihood**: Low

### Medium Risk

**3. Race Conditions in Album Updates**

- **Risk**: Multiple goroutines calling `AddPhoto()` simultaneously
- **Mitigation**:
  - Check if `albumService.AddPhoto()` is thread-safe (uses file I/O)
  - If needed, add mutex around album JSON updates
  - Collect results first, then update album sequentially
- **Severity**: High (data corruption)
- **Likelihood**: Low (Go standard lib is thread-safe)

**4. Frontend State Management**

- **Risk**: Complex state tracking for multiple uploads
- **Mitigation**:
  - Use Map for O(1) lookups
  - Clear state management with TypeScript types
  - Thoroughly test edge cases
- **Severity**: Medium (UI bugs)
- **Likelihood**: Low (Lit handles state well)

### Low Risk

**5. Upload Interruption**

- **Risk**: User navigates away during upload
- **Mitigation**:
  - Uploads continue in background (fetch API)
  - Show toast notification on completion
  - Consider adding beforeunload warning
- **Severity**: Low (user initiated)
- **Likelihood**: Medium

## Implementation Phases

### Phase 1: Backend Concurrent Processing (2-3 hours)

**Files**:

- `backend/internal/handlers/album_handler.go`

**Tasks**:

1. Implement worker pool pattern in `UploadPhotos()`
2. Add tests for concurrent upload processing
3. Add memory/performance logging
4. Test with 3, 5, 10 concurrent files

**Testing**:

- Unit tests: Worker pool coordination
- Integration tests: Upload 10 files, verify all processed
- Load tests: Memory usage under concurrent load

### Phase 2: Frontend Progress Component (2-3 hours)

**Files**:

- `frontend/src/components/upload-placeholder.ts` (new)
- `frontend/src/components/upload-placeholder.test.ts` (new)

**Tasks**:

1. Create upload placeholder component
2. Implement circular progress indicator (SVG arc)
3. Style for different states (uploading/processing/error)
4. Add unit tests

**Testing**:

- Unit tests: Component rendering, state changes
- Visual tests: Progress animations, error states

### Phase 3: Frontend Integration (3-4 hours)

**Files**:

- `frontend/src/pages/admin-album-editor-page.ts`

**Tasks**:

1. Add upload progress state management
2. Render placeholders in photo grid
3. Wire up progress callbacks
4. Handle error dismissal
5. Update storage stats after completion

**Testing**:

- Manual testing: Upload 5, 10, 20 images
- Test error scenarios (network failure, file too large)
- Test concurrent uploads + navigation

### Phase 4: Polish & Error Handling (1-2 hours)

**Tasks**:

1. Add toast notifications
2. Improve error messages
3. Handle edge cases (all fail, partial success)
4. Add upload limit validation (20 files max)

**Testing**:

- E2E testing: Complete upload flows
- Error scenario testing

**Total Estimated Time**: 8-12 hours

## Success Criteria

1. **Functional**:

   - ✅ Users can upload 10 images simultaneously
   - ✅ Progress indicators update in real-time
   - ✅ Errors persist until user dismisses
   - ✅ Backend processes 3 images concurrently

2. **Performance**:

   - ✅ Memory usage stays under 800MB
   - ✅ Upload of 10 images completes faster than sequential
   - ✅ No UI lag or freezing during upload

3. **Reliability**:

   - ✅ No race conditions or data corruption
   - ✅ All images processed correctly
   - ✅ Clear error messages for failures

4. **UX**:
   - ✅ Users understand upload progress
   - ✅ Smooth visual transitions
   - ✅ Professional error handling

## Architectural Impact

**Rating**: Minor Enhancement

**Changes Required**:

- ✅ Backend: Add goroutine coordination (worker pool pattern)
- ✅ Frontend: New component + state management
- ❌ No database changes
- ❌ No API changes (existing endpoint works)
- ❌ No breaking changes

**This is NOT a major architectural change**:

- Existing APIs remain unchanged
- No new endpoints required
- Builds on existing foundation
- Backward compatible

## Alternative Considered

**Alternative 1: SSE (Server-Sent Events) for Progress**

- Backend streams progress updates
- More complex: requires new endpoint, connection management
- **Rejected**: Overkill for this use case

**Alternative 2: Upload One-by-One (No Concurrency)**

- Simpler implementation
- Much slower for multiple files
- **Rejected**: Poor UX for bulk uploads

**Alternative 3: Websockets for Progress**

- Real-time bidirectional communication
- Complex: requires websocket infrastructure
- **Rejected**: Too complex for the benefit

## Conclusion

This plan implements concurrent uploads with visual progress feedback using:

- **Frontend**: TypeScript/Lit components with real-time state updates
- **Backend**: Go worker pool pattern with bounded concurrency
- **Complexity**: Medium (8-12 hours implementation)
- **Risk**: Low-Medium (manageable with proper testing)
- **Architecture**: Minor enhancement (no breaking changes)

The implementation follows Go best practices (worker pools, channels) and modern web UX patterns (inline progress indicators). It's production-ready with proper error handling and resource limits.
