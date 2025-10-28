import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import type { Photo } from '../types/data-models';

// Import icons
import downloadIcon from '../assets/icons/download-simple.svg?raw';
import linkIcon from '../assets/icons/link.svg?raw';
import shareIcon from '../assets/icons/share-fat.svg?raw';
import closeIcon from '../assets/icons/x-circle.svg?raw';

/**
 * Full-screen photo lightbox with keyboard and touch support.
 */
@customElement('photo-lightbox')
export class PhotoLightbox extends LitElement {
  @property({ type: Array }) photos: Photo[] = [];
  @property({ type: Number }) currentIndex = 0;
  @property({ type: Boolean }) showExif = false;

  private _open = false;
  @state() private hasNavigated = false;
  @state() private imageScale = 1;
  @state() private imageTranslateX = 0;
  @state() private imageTranslateY = 0;

  // Touch state for pinch zoom
  private lastTouchDistance = 0;
  private initialScale = 1;
  private lastTouchMidpoint = { x: 0, y: 0 };
  private isPinching = false;

  @property({ type: Boolean })
  get open() {
    return this._open;
  }

  set open(value: boolean) {
    const oldValue = this._open;
    this._open = value;

    // Reset navigation state when opening
    if (value && !oldValue) {
      this.hasNavigated = false;
      this.dispatchPhotoChangeEvent();
    }

    // Dispatch close event
    if (!value && oldValue) {
      this.dispatchEvent(new CustomEvent('lightbox-close', { bubbles: true }));
    }

    // Handle scroll and zoom when open state changes
    if (value !== oldValue) {
      this.disableBodyScroll(value);
      this.disableMobileZoom(value);
      this.requestUpdate('open', oldValue);
    }
  }

  static styles = css`
    :host {
      display: none;
    }

    :host([open]) {
      display: block;
    }

    .lightbox {
      position: fixed;
      inset: 0;
      background-color: var(--color-background);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      /* Prevent all touch gestures from affecting the page */
      touch-action: none;
      /* Prevent content from being selectable */
      -webkit-user-select: none;
      user-select: none;
    }

    .lightbox-toolbar {
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
      /* Prevent all touch manipulation to avoid page crashes */
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
      /* Prevent touch manipulation on image to avoid crashes */
      touch-action: none;
      /* Prevent default touch behavior */
      -webkit-user-select: none;
      user-select: none;
      /* Transform origin at center for zoom */
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

    .photo-counter {
      font-size: 9px;
      margin-left: auto;
      flex-shrink: 0;
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
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this.handleKeyDown);
    // Clean up body styles if component is removed while open
    if (this.open) {
      this.disableBodyScroll(false);
      this.disableMobileZoom(false);
    }
  }

  private resetZoom() {
    this.imageScale = 1;
    this.imageTranslateX = 0;
    this.imageTranslateY = 0;
  }

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

  private handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      this.isPinching = true;
      this.lastTouchDistance = this.getTouchDistance(e.touches);
      this.initialScale = this.imageScale;
      this.lastTouchMidpoint = this.getTouchMidpoint(e.touches);
    }
  };

  private handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 2 && this.isPinching) {
      e.preventDefault();

      const currentDistance = this.getTouchDistance(e.touches);
      const currentMidpoint = this.getTouchMidpoint(e.touches);

      // Calculate new scale
      const scaleDelta = currentDistance / this.lastTouchDistance;
      let newScale = this.initialScale * scaleDelta;

      // Constrain scale between 1 (fit to screen) and 4 (max zoom)
      newScale = Math.max(1, Math.min(4, newScale));

      // If trying to zoom below 1, snap to 1 with a little resistance
      if (newScale <= 1.05) {
        newScale = 1;
        this.imageTranslateX = 0;
        this.imageTranslateY = 0;
      } else if (this.imageScale > 1) {
        // Handle panning when zoomed in
        const deltaX = currentMidpoint.x - this.lastTouchMidpoint.x;
        const deltaY = currentMidpoint.y - this.lastTouchMidpoint.y;
        this.imageTranslateX += deltaX;
        this.imageTranslateY += deltaY;
      }

      this.imageScale = newScale;
      this.lastTouchMidpoint = currentMidpoint;
      this.requestUpdate();
    }
  };

  private handleTouchEnd = (e: TouchEvent) => {
    if (e.touches.length < 2) {
      this.isPinching = false;
      this.lastTouchDistance = 0;

      // Snap to scale 1 if very close
      if (this.imageScale < 1.05) {
        this.resetZoom();
        this.requestUpdate();
      }
    }
  };

  private disableBodyScroll(disable: boolean) {
    if (disable) {
      // Store original overflow style to restore later
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  private disableMobileZoom(disable: boolean) {
    // Find or create viewport meta tag
    let viewport = document.querySelector('meta[name="viewport"]');

    if (disable) {
      if (!viewport) {
        viewport = document.createElement('meta');
        viewport.setAttribute('name', 'viewport');
        document.head.appendChild(viewport);
      }
      // Store original content to restore later
      if (!viewport.hasAttribute('data-original-content')) {
        viewport.setAttribute('data-original-content', viewport.getAttribute('content') || '');
      }
      // Prevent page zoom/reload by keeping viewport fixed, but allow pinch zoom on the image
      viewport.setAttribute(
        'content',
        'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no'
      );
    } else {
      if (viewport) {
        // Restore original viewport settings
        const original = viewport.getAttribute('data-original-content');
        if (original) {
          viewport.setAttribute('content', original);
          viewport.removeAttribute('data-original-content');
        } else {
          // Standard mobile viewport settings
          viewport.setAttribute(
            'content',
            'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes'
          );
        }
      }
    }
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (!this.open) return;

    switch (e.key) {
      case 'Escape':
        this.close();
        break;
      case 'ArrowLeft':
        this.prev();
        break;
      case 'ArrowRight':
        this.next();
        break;
    }
  };

  private dispatchPhotoChangeEvent() {
    if (this.open && this.photos[this.currentIndex]) {
      const photoId = this.photos[this.currentIndex].id;
      this.dispatchEvent(
        new CustomEvent('photo-change', {
          bubbles: true,
          detail: { photoId, index: this.currentIndex },
        })
      );
    }
  }

  next() {
    this.hasNavigated = true;
    this.resetZoom();
    if (this.currentIndex < this.photos.length - 1) {
      this.currentIndex++;
    } else {
      this.currentIndex = 0; // Wrap to first image
    }
    this.dispatchPhotoChangeEvent();
  }

  prev() {
    this.hasNavigated = true;
    this.resetZoom();
    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else {
      this.currentIndex = this.photos.length - 1; // Wrap to last image
    }
    this.dispatchPhotoChangeEvent();
  }

  close() {
    this.open = false;
    this.dispatchEvent(new CustomEvent('close', { bubbles: true }));
  }

  private async handleDownload() {
    const currentPhoto = this.photos[this.currentIndex];
    if (!currentPhoto) return;

    try {
      // Fetch the original image
      const response = await fetch(currentPhoto.url_original);
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentPhoto.filename_original || `photo-${currentPhoto.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download photo:', err);
    }
  }

  private async handleCopyLink() {
    const currentPhoto = this.photos[this.currentIndex];
    if (!currentPhoto) return;

    try {
      // Get the current URL with the photo parameter
      const url = new URL(window.location.href);
      url.searchParams.set('photo', currentPhoto.id);

      await navigator.clipboard.writeText(url.toString());

      // Optional: Could add a toast notification here
      console.log('Link copied to clipboard');
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  }

  private async handleShare() {
    const currentPhoto = this.photos[this.currentIndex];
    if (!currentPhoto) return;

    // Check if Web Share API is available
    if (navigator.share) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('photo', currentPhoto.id);

        await navigator.share({
          title: currentPhoto.caption || 'Photo',
          text: currentPhoto.caption || '',
          url: url.toString(),
        });
      } catch (err) {
        // User cancelled or error occurred
        if ((err as Error).name !== 'AbortError') {
          console.error('Failed to share:', err);
        }
      }
    } else {
      // Fallback: copy link if share not available
      await this.handleCopyLink();
    }
  }

  render() {
    if (!this.open || this.photos.length === 0) return html``;

    const currentPhoto = this.photos[this.currentIndex];

    return html`
      <div class="lightbox">
        <div class="lightbox-toolbar">
          <button
            class="toolbar-button"
            @click=${() => this.handleDownload()}
            aria-label="Download original"
            title="Download original"
          >
            ${unsafeSVG(downloadIcon)}
          </button>

          <button
            class="toolbar-button"
            @click=${() => this.handleCopyLink()}
            aria-label="Copy link"
            title="Copy link"
          >
            ${unsafeSVG(linkIcon)}
          </button>

          <button
            class="toolbar-button"
            @click=${() => this.handleShare()}
            aria-label="Share"
            title="Share"
          >
            ${unsafeSVG(shareIcon)}
          </button>

          <button
            class="close-button"
            @click=${() => this.close()}
            aria-label="Close"
            title="Close"
          >
            ${unsafeSVG(closeIcon)}
          </button>
        </div>

        <div
          class="photo-container"
          @touchstart=${this.handleTouchStart}
          @touchmove=${this.handleTouchMove}
          @touchend=${this.handleTouchEnd}
        >
          <button class="nav-button prev" @click=${() => this.prev()} aria-label="Previous photo">
            ‹
          </button>

          <img
            src="${currentPhoto.url_display}"
            alt="${currentPhoto.alt_text || currentPhoto.caption || 'Photo'}"
            style="transform: translate(${this.imageTranslateX}px, ${this
              .imageTranslateY}px) scale(${this.imageScale})"
          />

          <button class="nav-button next" @click=${() => this.next()} aria-label="Next photo">
            ›
          </button>
        </div>

        ${this.renderExif(currentPhoto)}
      </div>
    `;
  }

  private renderExif(photo: Photo) {
    if (!this.showExif) {
      return '';
    }

    const exif = photo.exif;
    const items = [];

    if (exif) {
      if (exif.camera) items.push(`${exif.camera}`);
      if (exif.lens) items.push(`${exif.lens}`);
      if (exif.iso) items.push(`ISO ${exif.iso}`);
      if (exif.aperture) items.push(`${exif.aperture}`);
      if (exif.shutter_speed) items.push(`${exif.shutter_speed}`);
      if (exif.focal_length) items.push(`${exif.focal_length}`);
    }

    const hasItems = items.length > 0;

    return html`
      <div class="exif-panel">
        <div class="exif-items">
          ${hasItems ? items.map((item) => html`<span class="exif-item">${item}</span>`) : ''}
        </div>
        <div class="photo-counter">${this.currentIndex + 1} of ${this.photos.length}</div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'photo-lightbox': PhotoLightbox;
  }
}
