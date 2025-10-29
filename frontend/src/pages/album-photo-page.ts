import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import type { Album, Photo } from '../types/data-models';
import { fetchAlbumBySlug } from '../utils/api';

// Import icons
import downloadIcon from '../assets/icons/download-simple.svg?raw';
import linkIcon from '../assets/icons/link.svg?raw';
import shareIcon from '../assets/icons/share-fat.svg?raw';
import closeIcon from '../assets/icons/x-circle.svg?raw';

/**
 * Full-page photo viewer with navigation, zoom, and sharing.
 */
@customElement('album-photo-page')
export class AlbumPhotoPage extends LitElement {
  // Grace period before showing loading screen (prevents flash on fast connections)
  private static readonly LOADING_GRACE_PERIOD_MS = 200;

  @property({ type: String }) albumSlug = '';
  @property({ type: String }) photoId = '';

  @state() private album?: Album;
  @state() private currentPhoto?: Photo;
  @state() private currentIndex = 0;
  @state() private loading = true;
  @state() private error = '';
  @state() private showExif = false;
  @state() private currentPhotoLoaded = false;
  @state() private loadingProgress = 0; // 0-100 percentage
  @state() private showLoadingScreen = false; // Only show after grace period

  // Cache blob URLs to prevent redundant network requests
  private imageBlobCache = new Map<string, string>();
  // Track current XHR request to cancel if needed
  private currentXHR: XMLHttpRequest | null = null;
  // Track bytes loaded for progress estimation
  private bytesLoaded = 0;
  // Delay showing loading screen to avoid flash on fast connections
  private loadingGracePeriodTimeout: number | null = null;

  // Zoom state
  @state() private imageScale = 1;
  @state() private imageTranslateX = 0;
  @state() private imageTranslateY = 0;

  // Touch state for pinch zoom
  private lastTouchDistance = 0;
  private initialScale = 1;
  private lastTouchMidpoint = { x: 0, y: 0 };
  private isPinching = false;
  private lastTapTime = 0;

  // Touch state for swipe navigation
  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartTime = 0;
  private isSwiping = false;

  static styles = css`
    :host {
      display: block;
      position: fixed;
      inset: 0;
      background-color: var(--color-background);
      z-index: 9999;
    }

    .page-container {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      touch-action: none;
      -webkit-user-select: none;
      user-select: none;
    }

    .toolbar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      padding: 1rem 2rem;
      background: transparent;
      color: var(--color-text-primary);
      z-index: 10;
      height: 3rem;
      box-sizing: border-box;
      gap: 0.5rem;
    }

    .photo-counter {
      font-size: 0.9rem;
    }

    .toolbar-button {
      background: none;
      border: none;
      color: var(--color-text-secondary);
      cursor: pointer;
      padding: 0;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.6;
      transition:
        opacity 0.2s,
        transform 0.2s;
    }

    .toolbar-button:hover {
      opacity: 1;
      transform: scale(1.15);
    }

    .toolbar-button:active {
      transform: scale(0.95);
      opacity: 0.8;
    }

    .toolbar-button svg {
      width: 20px;
      height: 20px;
      fill: currentColor;
    }

    .close-button {
      background: none;
      border: none;
      color: var(--color-text-secondary);
      cursor: pointer;
      padding: 0;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.6;
      transition:
        opacity 0.2s,
        transform 0.2s;
    }

    .close-button svg {
      width: 20px;
      height: 20px;
      stroke: currentColor;
    }

    .close-button:hover {
      opacity: 1;
      transform: scale(1.15);
    }

    .close-button:active {
      transform: scale(0.95);
      opacity: 0.8;
    }

    .photo-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      position: relative;
      touch-action: none;
    }

    .nav-button {
      position: absolute;
      top: 0;
      bottom: 0;
      background: transparent;
      border: none;
      color: var(--color-text-primary);
      font-size: 3rem;
      cursor: pointer;
      transition:
        color 0.2s,
        transform 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 60px;
      z-index: 5;
      opacity: 0.6;
    }

    .nav-button:hover {
      opacity: 1;
      transform: scale(1.2);
    }

    .nav-button:active {
      transform: scale(0.95);
      opacity: 0.8;
    }

    .nav-button:disabled {
      opacity: 0.2;
      cursor: not-allowed;
    }

    .nav-button.prev {
      left: 0;
    }

    .nav-button.next {
      right: 0;
    }

    .photo-container img {
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
      object-fit: contain;
      display: block;
      touch-action: none;
      -webkit-user-select: none;
      user-select: none;
      transform-origin: center center;
      will-change: transform;
    }

    .exif-panel {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 1rem 2rem;
      background: transparent;
      color: var(--color-text-secondary);
      font-size: 9px;
      line-height: 1.4;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: space-between;
      white-space: nowrap;
      overflow-x: auto;
      z-index: 10;
      height: 4rem;
    }

    .exif-items {
      display: flex;
      align-items: center;
    }

    .exif-item {
      display: inline;
    }

    .exif-item::after {
      content: ' • ';
      margin: 0 0.5rem;
    }

    .exif-item:last-child::after {
      content: '';
      margin: 0;
    }

    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--color-text-secondary);
    }

    .error {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--color-error);
      padding: 2rem;
      text-align: center;
    }

    .photo-loading {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--color-text-secondary);
      gap: 1rem;
      z-index: 1;
    }

    .photo-loading-text {
      font-size: 1rem;
    }

    .progress-bar-container {
      width: 300px;
      height: 4px;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 2px;
      overflow: hidden;
      margin-top: 0.5rem;
    }

    .progress-bar {
      height: 100%;
      background-color: var(--color-accent, #007aff);
      transition: width 0.2s ease-out;
      border-radius: 2px;
    }

    .progress-percentage {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      margin-top: 0.25rem;
    }

    .photo-thumbnail {
      filter: blur(10px);
      opacity: 0.5;
    }

    @media (max-width: 768px) {
      .nav-button {
        font-size: 2rem;
        width: 50px;
      }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('keydown', this.handleKeyDown);
    this.disableBodyScroll(true);
    this.disableMobileZoom(true);
    void this.loadAlbumData();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this.handleKeyDown);
    this.disableBodyScroll(false);
    this.disableMobileZoom(false);

    // Clean up any pending timeouts
    if (this.loadingGracePeriodTimeout !== null) {
      clearTimeout(this.loadingGracePeriodTimeout);
      this.loadingGracePeriodTimeout = null;
    }
  }

  private async loadAlbumData() {
    this.loading = true;
    this.error = '';

    try {
      const album = await fetchAlbumBySlug(this.albumSlug);
      if (!album) {
        this.error = 'Album not found';
        this.loading = false;
        return;
      }

      this.album = album;

      // Find the photo by ID
      const index = album.photos.findIndex((p: Photo) => p.id === this.photoId);
      if (index === -1) {
        this.error = 'Photo not found in album';
        this.loading = false;
        return;
      }

      this.currentIndex = index;
      this.currentPhoto = album.photos[index];
      this.loading = false;

      // Load the current photo
      this.loadCurrentPhoto();
    } catch {
      this.error = 'Failed to load album';
      this.loading = false;
    }
  }

  private loadCurrentPhoto() {
    if (!this.currentPhoto) return;

    const photoId = this.currentPhoto.id;
    const photoUrl = this.currentPhoto.url_display;

    // Cancel any pending XHR
    if (this.currentXHR) {
      this.currentXHR.abort();
      this.currentXHR = null;
    }

    // Cancel any pending loading screen grace period
    if (this.loadingGracePeriodTimeout !== null) {
      clearTimeout(this.loadingGracePeriodTimeout);
      this.loadingGracePeriodTimeout = null;
    }

    // Check if already in cache
    if (this.imageBlobCache.has(photoId)) {
      this.currentPhotoLoaded = true;
      this.showLoadingScreen = false;
      this.loadingProgress = 0;
      return;
    }

    // Mark as loading, but don't show loading screen immediately
    this.currentPhotoLoaded = false;
    this.showLoadingScreen = false;
    this.loadingProgress = 0;
    this.bytesLoaded = 0;

    // Show loading screen after grace period if photo hasn't loaded yet
    // This prevents flash on fast connections
    this.loadingGracePeriodTimeout = window.setTimeout(() => {
      if (!this.currentPhotoLoaded) {
        this.showLoadingScreen = true;
      }
      this.loadingGracePeriodTimeout = null;
    }, AlbumPhotoPage.LOADING_GRACE_PERIOD_MS);

    // Use XMLHttpRequest to track progress
    const xhr = new XMLHttpRequest();
    this.currentXHR = xhr;

    xhr.open('GET', photoUrl, true);
    xhr.responseType = 'blob';

    xhr.onprogress = (e) => {
      if (this.currentXHR === xhr) {
        this.bytesLoaded = e.loaded;
        if (e.lengthComputable) {
          // Server sent Content-Length, show actual progress
          this.loadingProgress = Math.round((e.loaded / e.total) * 100);
        }
        // Don't show fake progress if no Content-Length
      }
    };

    xhr.onload = () => {
      if (this.currentXHR === xhr && xhr.status === 200) {
        const blob = xhr.response as Blob;
        const objectUrl = URL.createObjectURL(blob);

        // Cache the blob URL for this photo
        this.imageBlobCache.set(photoId, objectUrl);

        // Cancel grace period if still pending
        if (this.loadingGracePeriodTimeout !== null) {
          clearTimeout(this.loadingGracePeriodTimeout);
          this.loadingGracePeriodTimeout = null;
        }

        // Show the image immediately
        this.currentPhotoLoaded = true;
        this.showLoadingScreen = false;
        this.loadingProgress = 0;
        this.currentXHR = null;
      }
    };

    xhr.onerror = () => {
      if (this.currentXHR === xhr) {
        // Cancel grace period if still pending
        if (this.loadingGracePeriodTimeout !== null) {
          clearTimeout(this.loadingGracePeriodTimeout);
          this.loadingGracePeriodTimeout = null;
        }

        this.currentPhotoLoaded = false;
        this.showLoadingScreen = false;
        this.loadingProgress = 0;
        this.currentXHR = null;
      }
    };

    xhr.send();
  }

  private navigateToPhoto(photoId: string) {
    if (!this.album) return;

    // Update URL without full page reload
    const url = `/albums/${this.albumSlug}/photo/${photoId}`;
    window.history.pushState({}, '', url);

    // Update displayed photo
    this.photoId = photoId;
    const index = this.album.photos.findIndex((p) => p.id === photoId);
    if (index !== -1) {
      this.currentIndex = index;
      this.currentPhoto = this.album.photos[index];
      this.resetZoom();

      // Load the current photo
      this.loadCurrentPhoto();
    }
  }

  private handlePrev = () => {
    if (!this.album) return;
    const prevIndex = (this.currentIndex - 1 + this.album.photos.length) % this.album.photos.length;
    this.navigateToPhoto(this.album.photos[prevIndex].id);
  };

  private handleNext = () => {
    if (!this.album) return;
    const nextIndex = (this.currentIndex + 1) % this.album.photos.length;
    this.navigateToPhoto(this.album.photos[nextIndex].id);
  };

  private handleClose = () => {
    window.location.href = `/albums/${this.albumSlug}`;
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      this.handleClose();
    } else if (e.key === 'ArrowLeft') {
      this.handlePrev();
    } else if (e.key === 'ArrowRight') {
      this.handleNext();
    }
  };

  private handleDownload = () => {
    if (!this.currentPhoto) return;
    const link = document.createElement('a');
    link.href = this.currentPhoto.url_original;
    link.download = this.currentPhoto.filename_original;
    link.click();
  };

  private async handleShare() {
    if (!this.currentPhoto || !navigator.share) {
      // Fallback to copy link
      void this.handleCopyLink();
      return;
    }

    try {
      await navigator.share({
        title: this.album?.title || 'Photo',
        url: window.location.href,
      });
    } catch (err) {
      // User cancelled or error occurred
      console.log('Share cancelled or failed:', err);
    }
  }

  private handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      // TODO: Show toast notification
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  private resetZoom() {
    this.imageScale = 1;
    this.imageTranslateX = 0;
    this.imageTranslateY = 0;
  }

  private disableBodyScroll(disable: boolean) {
    if (disable) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  private disableMobileZoom(disable: boolean) {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) return;

    if (disable) {
      viewport.setAttribute(
        'content',
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
      );
    } else {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
    }
  }

  // Touch handlers for pinch zoom and swipe navigation
  private handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      // Two-finger touch - pinch zoom
      e.preventDefault();
      this.isPinching = true;
      this.isSwiping = false;
      this.lastTouchDistance = this.getTouchDistance(e.touches);
      this.initialScale = this.imageScale;
      this.lastTouchMidpoint = this.getTouchMidpoint(e.touches);
    } else if (e.touches.length === 1) {
      // Single finger touch - could be tap, double-tap, or swipe
      const now = Date.now();

      // Check for double-tap
      if (now - this.lastTapTime < 300) {
        // Double-tap detected - reset zoom
        this.resetZoom();
        this.isSwiping = false;
      } else {
        // Start tracking for potential swipe (only if not zoomed)
        if (this.imageScale === 1) {
          this.touchStartX = e.touches[0].clientX;
          this.touchStartY = e.touches[0].clientY;
          this.touchStartTime = now;
          this.isSwiping = true;
        }
      }

      this.lastTapTime = now;
    }
  };

  private handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 2 && this.isPinching) {
      // Two-finger pinch zoom
      e.preventDefault();

      const currentDistance = this.getTouchDistance(e.touches);
      const currentMidpoint = this.getTouchMidpoint(e.touches);

      // Calculate scale change
      const scaleChange = currentDistance / this.lastTouchDistance;
      let newScale = this.initialScale * scaleChange;

      // Clamp scale between 1x and 4x
      newScale = Math.max(1, Math.min(4, newScale));

      // Update scale
      this.imageScale = newScale;
      this.initialScale = newScale;
      this.lastTouchDistance = currentDistance;

      // Calculate pan if zoomed
      if (newScale > 1) {
        const deltaX = currentMidpoint.x - this.lastTouchMidpoint.x;
        const deltaY = currentMidpoint.y - this.lastTouchMidpoint.y;
        this.imageTranslateX += deltaX;
        this.imageTranslateY += deltaY;
        this.lastTouchMidpoint = currentMidpoint;
      }
    } else if (e.touches.length === 1 && this.isSwiping && this.imageScale === 1) {
      // Single finger swipe for navigation (only when not zoomed)
      const deltaX = Math.abs(e.touches[0].clientX - this.touchStartX);
      const deltaY = Math.abs(e.touches[0].clientY - this.touchStartY);

      // If moving more vertically than horizontally, cancel swipe (allow scrolling)
      if (deltaY > deltaX) {
        this.isSwiping = false;
      }

      // Prevent default if swiping horizontally
      if (this.isSwiping && deltaX > 10) {
        e.preventDefault();
      }
    }
  };

  private handleTouchEnd = (e: TouchEvent) => {
    // Handle swipe navigation (only when not zoomed)
    if (this.isSwiping && this.imageScale === 1 && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - this.touchStartX;
      const deltaY = touch.clientY - this.touchStartY;
      const deltaTime = Date.now() - this.touchStartTime;

      // Calculate swipe distance and velocity
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      const velocity = absDeltaX / deltaTime; // pixels per millisecond

      // Swipe threshold: 50px distance or fast swipe (>0.5 px/ms)
      const isHorizontalSwipe = absDeltaX > absDeltaY;
      const isSwipeGesture = (absDeltaX > 50 || velocity > 0.5) && deltaTime < 300;

      if (isHorizontalSwipe && isSwipeGesture) {
        if (deltaX > 0) {
          // Swipe right - go to previous photo
          this.handlePrev();
        } else {
          // Swipe left - go to next photo
          this.handleNext();
        }
      }
    }

    // Reset swipe state
    this.isSwiping = false;

    // Handle pinch zoom end
    if (e.touches.length < 2) {
      this.isPinching = false;

      // Snap back to fit if zoomed out below threshold
      if (this.imageScale < 1.05) {
        this.resetZoom();
      }
    }
  };

  private getTouchDistance(touches: TouchList): number {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private getTouchMidpoint(touches: TouchList): { x: number; y: number } {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  }

  render() {
    if (this.loading) {
      return html`<div class="loading">Loading...</div>`;
    }

    if (this.error) {
      return html`<div class="error">${this.error}</div>`;
    }

    if (!this.currentPhoto || !this.album) {
      return html`<div class="error">Photo not found</div>`;
    }

    // Use cached blob URL if available, otherwise use original URL
    const photoUrl = this.imageBlobCache.get(this.currentPhoto.id) || this.currentPhoto.url_display;
    const imageTransform = `scale(${this.imageScale}) translate(${this.imageTranslateX}px, ${this.imageTranslateY}px)`;

    return html`
      <div class="page-container">
        <div class="toolbar">
          <span class="photo-counter">${this.currentIndex + 1} / ${this.album.photos.length}</span>
          <button class="toolbar-button" @click=${this.handleDownload} title="Download">
            ${unsafeSVG(downloadIcon)}
          </button>
          <button class="toolbar-button" @click=${() => void this.handleShare()} title="Share">
            ${unsafeSVG(shareIcon)}
          </button>
          <button class="toolbar-button" @click=${this.handleCopyLink} title="Copy Link">
            ${unsafeSVG(linkIcon)}
          </button>
          <button class="close-button" @click=${this.handleClose} title="Close">
            ${unsafeSVG(closeIcon)}
          </button>
        </div>

        <div
          class="photo-container"
          @touchstart=${this.handleTouchStart}
          @touchmove=${this.handleTouchMove}
          @touchend=${this.handleTouchEnd}
        >
          <button class="nav-button prev" @click=${this.handlePrev}>‹</button>

          ${this.showLoadingScreen && !this.currentPhotoLoaded
            ? html`
                <!-- Show loading indicator (after grace period) -->
                <div class="photo-loading">
                  <div class="photo-loading-text">
                    Loading photo ${this.currentIndex + 1} of ${this.album.photos.length}...
                  </div>
                  <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${this.loadingProgress}%"></div>
                  </div>
                  <div class="progress-percentage">${this.loadingProgress}%</div>
                </div>
              `
            : ''}
          ${this.currentPhotoLoaded
            ? html`
                <!-- Show full image -->
                <img
                  src=${photoUrl}
                  alt=${this.currentPhoto.alt_text || this.currentPhoto.caption || 'Photo'}
                  style="transform: ${imageTransform}"
                />
              `
            : ''}

          <button class="nav-button next" @click=${this.handleNext}>›</button>
        </div>

        ${this.showExif && this.currentPhoto.exif
          ? html`
              <div class="exif-panel">
                <div class="exif-items">
                  ${this.currentPhoto.exif.camera
                    ? html`<span class="exif-item">${this.currentPhoto.exif.camera}</span>`
                    : ''}
                  ${this.currentPhoto.exif.lens
                    ? html`<span class="exif-item">${this.currentPhoto.exif.lens}</span>`
                    : ''}
                  ${this.currentPhoto.exif.focal_length
                    ? html`<span class="exif-item">${this.currentPhoto.exif.focal_length}</span>`
                    : ''}
                  ${this.currentPhoto.exif.aperture
                    ? html`<span class="exif-item">ƒ/${this.currentPhoto.exif.aperture}</span>`
                    : ''}
                  ${this.currentPhoto.exif.shutter_speed
                    ? html`<span class="exif-item">${this.currentPhoto.exif.shutter_speed}s</span>`
                    : ''}
                  ${this.currentPhoto.exif.iso
                    ? html`<span class="exif-item">ISO ${this.currentPhoto.exif.iso}</span>`
                    : ''}
                  ${this.currentPhoto.exif.date_taken
                    ? html`<span class="exif-item">${this.currentPhoto.exif.date_taken}</span>`
                    : ''}
                </div>
              </div>
            `
          : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'album-photo-page': AlbumPhotoPage;
  }
}
