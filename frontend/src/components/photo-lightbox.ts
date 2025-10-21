import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { Photo } from '../types/data-models';

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
    }

    // Handle scroll and zoom when open state changes
    if (value !== oldValue) {
      this.disableBodyScroll(value);
      this.disableMobileZoom(value);
      this.requestUpdate('open', oldValue);
    }
  }

  @state() private touchStartX = 0;
  @state() private touchEndX = 0;
  @state() private touchStartTime = 0;

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
      padding: 3rem 0 4rem 0; /* Small buffer top, larger bottom like picture frames */
    }

    .toolbar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      background-color: var(--color-background);
      color: var(--color-text-primary);
      z-index: 10;
      height: 3rem;
      box-sizing: border-box;
    }

    .photo-counter {
      font-size: 0.9rem;
    }

    .close-button {
      background: none;
      border: none;
      color: var(--color-text-primary);
      font-size: 2rem;
      cursor: pointer;
      padding: 0;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-button:hover {
      opacity: 0.7;
    }

    .photo-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      position: relative;
    }

    .nav-button {
      flex: 1;
      background: none;
      border: none;
      color: var(--color-text-primary);
      font-size: 3rem;
      cursor: pointer;
      transition: opacity 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      align-self: stretch;
    }

    .nav-button:hover {
      opacity: 0.7;
    }

    .nav-button:disabled {
      opacity: 0.2;
      cursor: not-allowed;
    }

    .photo-container img {
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
      object-fit: contain;
      display: block;
      flex-shrink: 0;
    }

    .exif-panel {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 1rem 2rem;
      background-color: var(--color-background);
      color: var(--color-text-secondary);
      font-size: 9px;
      line-height: 1.4;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      white-space: nowrap;
      overflow-x: auto;
      z-index: 10;
      height: 4rem;
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
      // Disable user scaling
      viewport.setAttribute(
        'content',
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
      );
    } else {
      if (viewport) {
        // Re-enable user scaling
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
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

  private handleTouchStart = (e: TouchEvent) => {
    this.touchStartX = e.changedTouches[0].screenX;
    this.touchStartTime = Date.now();
  };

  private handleTouchEnd = (e: TouchEvent) => {
    this.touchEndX = e.changedTouches[0].screenX;
    this.handleSwipe();
  };

  private handleSwipe() {
    const swipeThreshold = 50;
    const diff = this.touchStartX - this.touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        this.next();
      } else {
        this.prev();
      }
    }
  }

  private handleImageTap = (e: TouchEvent) => {
    const touchDuration = Date.now() - this.touchStartTime;
    const touchDistance = Math.abs(this.touchStartX - e.changedTouches[0].screenX);

    // Only treat as tap if touch was quick and didn't move much (not a swipe)
    if (touchDuration < 300 && touchDistance < 10) {
      this.next();
    }
  };

  next() {
    this.hasNavigated = true;
    if (this.currentIndex < this.photos.length - 1) {
      this.currentIndex++;
    } else {
      this.currentIndex = 0; // Wrap to first image
    }
  }

  prev() {
    this.hasNavigated = true;
    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else {
      this.currentIndex = this.photos.length - 1; // Wrap to last image
    }
  }

  close() {
    this.open = false;
    this.dispatchEvent(new CustomEvent('close', { bubbles: true }));
  }

  render() {
    if (!this.open || this.photos.length === 0) return html``;

    const currentPhoto = this.photos[this.currentIndex];

    return html`
      <div class="lightbox">
        <div class="toolbar">
          <div class="photo-counter">${this.currentIndex + 1} / ${this.photos.length}</div>
          <button class="close-button" @click=${() => this.close()} aria-label="Close">×</button>
        </div>

        <div
          class="photo-container"
          @touchstart=${(e: TouchEvent) => this.handleTouchStart(e)}
          @touchend=${(e: TouchEvent) => this.handleTouchEnd(e)}
        >
          <button class="nav-button prev" @click=${() => this.prev()} aria-label="Previous photo">
            ‹
          </button>

          <img
            src="${currentPhoto.url_display}"
            alt="${currentPhoto.alt_text || currentPhoto.caption || 'Photo'}"
            @touchstart=${(e: TouchEvent) => this.handleTouchStart(e)}
            @touchend=${(e: TouchEvent) => this.handleImageTap(e)}
          />

          <button class="nav-button next" @click=${() => this.next()} aria-label="Next photo">
            ›
          </button>
        </div>

        ${this.showExif ? this.renderExif(currentPhoto) : ''}
      </div>
    `;
  }

  private renderExif(photo: Photo) {
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
        ${hasItems ? items.map((item) => html`<span class="exif-item">${item}</span>`) : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'photo-lightbox': PhotoLightbox;
  }
}
