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
      background-color: rgba(0, 0, 0, 0.95);
      z-index: 9999;
      display: flex;
      flex-direction: column;
    }

    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      background-color: rgba(0, 0, 0, 0.5);
      color: white;
    }

    .photo-counter {
      font-size: 0.9rem;
    }

    .close-button {
      background: none;
      border: none;
      color: white;
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
      position: relative;
      padding: 3rem;
      overflow: hidden;
      min-height: 0; /* Important for flex children */
    }

    .photo-container img {
      max-width: calc(100% - 8rem); /* Account for nav buttons */
      max-height: 100%;
      width: auto;
      height: auto;
      object-fit: contain;
      display: block;
    }

    .nav-button {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: white;
      font-size: 2rem;
      cursor: pointer;
      padding: 1rem;
      border-radius: 4px;
      transition: background-color 0.2s;
    }

    .nav-button:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .nav-button:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .nav-button.prev {
      left: 2rem;
    }

    .nav-button.next {
      right: 2rem;
    }

    .exif-panel {
      padding: 1rem 2rem;
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
      font-size: 0.85rem;
      line-height: 1.6;
      min-height: 96px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 0.5rem;
    }

    .exif-panel.with-data {
      justify-content: flex-start;
    }

    .exif-panel.empty {
      align-items: center;
    }

    .exif-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 0.5rem;
      width: 100%;
    }

    .exif-item {
      display: flex;
      gap: 0.5rem;
    }

    .exif-label {
      opacity: 0.7;
    }

    @media (max-width: 768px) {
      .toolbar,
      .photo-container {
        padding: 1rem;
      }

      .photo-container img {
        max-width: calc(100% - 4rem); /* Account for smaller nav buttons on mobile */
      }

      .nav-button {
        padding: 0.5rem;
        font-size: 1.5rem;
      }

      .nav-button.prev {
        left: 0.5rem;
      }

      .nav-button.next {
        right: 0.5rem;
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

  next() {
    if (this.currentIndex < this.photos.length - 1) {
      this.hasNavigated = true;
      this.currentIndex++;
    }
  }

  prev() {
    if (this.currentIndex > 0) {
      this.hasNavigated = true;
      this.currentIndex--;
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
          <button
            class="nav-button prev"
            @click=${() => this.prev()}
            ?disabled=${this.currentIndex === 0}
            aria-label="Previous photo"
          >
            ‹
          </button>

          <img
            src="${currentPhoto.url_display}"
            alt="${currentPhoto.alt_text || currentPhoto.caption || 'Photo'}"
          />

          <button
            class="nav-button next"
            @click=${() => this.next()}
            ?disabled=${this.currentIndex === this.photos.length - 1}
            aria-label="Next photo"
          >
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
      if (exif.camera) items.push({ label: 'Camera', value: exif.camera });
      if (exif.lens) items.push({ label: 'Lens', value: exif.lens });
      if (exif.iso) items.push({ label: 'ISO', value: exif.iso.toString() });
      if (exif.aperture) items.push({ label: 'Aperture', value: exif.aperture });
      if (exif.shutter_speed) items.push({ label: 'Shutter', value: exif.shutter_speed });
      if (exif.focal_length) items.push({ label: 'Focal Length', value: exif.focal_length });
    }

    const hasItems = items.length > 0;

    return html`
      <div class="exif-panel ${hasItems ? 'with-data' : 'empty'}">
        ${hasItems
          ? html`<div class="exif-grid">
              ${items.map(
                (item) => html`
                  <div class="exif-item">
                    <span class="exif-label">${item.label}:</span>
                    <span class="exif-value">${item.value}</span>
                  </div>
                `
              )}
            </div>`
          : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'photo-lightbox': PhotoLightbox;
  }
}
