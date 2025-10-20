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
  @property({ type: Boolean }) open = false;

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
      padding: 2rem;
    }

    .photo-container img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
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
    }

    .exif-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 0.5rem;
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
      this.currentIndex++;
    }
  }

  prev() {
    if (this.currentIndex > 0) {
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

        ${this.showExif && currentPhoto.exif ? this.renderExif(currentPhoto) : ''}
      </div>
    `;
  }

  private renderExif(photo: Photo) {
    if (!photo.exif) return '';

    const exif = photo.exif;
    const items = [];

    if (exif.camera) items.push({ label: 'Camera', value: exif.camera });
    if (exif.lens) items.push({ label: 'Lens', value: exif.lens });
    if (exif.iso) items.push({ label: 'ISO', value: exif.iso.toString() });
    if (exif.aperture) items.push({ label: 'Aperture', value: exif.aperture });
    if (exif.shutter_speed) items.push({ label: 'Shutter', value: exif.shutter_speed });
    if (exif.focal_length) items.push({ label: 'Focal Length', value: exif.focal_length });

    return html`
      <div class="exif-panel">
        <div class="exif-grid">
          ${items.map(
            (item) => html`
              <div class="exif-item">
                <span class="exif-label">${item.label}:</span>
                <span class="exif-value">${item.value}</span>
              </div>
            `
          )}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'photo-lightbox': PhotoLightbox;
  }
}
