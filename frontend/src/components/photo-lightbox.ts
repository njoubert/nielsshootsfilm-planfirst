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

    .toolbar-button svg {
      width: 20px;
      height: 20px;
      fill: currentColor;
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
      opacity: 0.6;
      transition:
        color 0.2s,
        transform 0.2s;
      margin-left: 0.5rem;
    }

    .close-button:hover {
      opacity: 1;
      transform: scale(1.2);
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
    if (this.currentIndex < this.photos.length - 1) {
      this.currentIndex++;
    } else {
      this.currentIndex = 0; // Wrap to first image
    }
    this.dispatchPhotoChangeEvent();
  }

  prev() {
    this.hasNavigated = true;
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
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2C12.5523 2 13 2.44772 13 3V13.5858L16.2929 10.2929C16.6834 9.90237 17.3166 9.90237 17.7071 10.2929C18.0976 10.6834 18.0976 11.3166 17.7071 11.7071L12.7071 16.7071C12.3166 17.0976 11.6834 17.0976 11.2929 16.7071L6.29289 11.7071C5.90237 11.3166 5.90237 10.6834 6.29289 10.2929C6.68342 9.90237 7.31658 9.90237 7.70711 10.2929L11 13.5858V3C11 2.44772 11.4477 2 12 2ZM4 17C4.55228 17 5 17.4477 5 18V19C5 19.5523 5.44772 20 6 20H18C18.5523 20 19 19.5523 19 19V18C19 17.4477 19.4477 17 20 17C20.5523 17 21 17.4477 21 18V19C21 20.6569 19.6569 22 18 22H6C4.34315 22 3 20.6569 3 19V18C3 17.4477 3.44772 17 4 17Z"
              />
            </svg>
          </button>

          <button
            class="toolbar-button"
            @click=${() => this.handleCopyLink()}
            aria-label="Copy link"
            title="Copy link"
          >
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M13.0605 8.11073L14.4747 9.52494C17.2084 12.2586 17.2084 16.6908 14.4747 19.4244L14.1211 19.778C11.3875 22.5117 6.95531 22.5117 4.22164 19.778C1.48797 17.0443 1.48797 12.6122 4.22164 9.87849L5.63585 11.2927C3.68323 13.2453 3.68323 16.4112 5.63585 18.3638C7.58847 20.3164 10.7543 20.3164 12.7069 18.3638L13.0605 18.0102C15.0131 16.0576 15.0131 12.8918 13.0605 10.9392L11.6463 9.52494L13.0605 8.11073ZM19.778 14.1211L18.3638 12.7069C20.3164 10.7543 20.3164 7.58847 18.3638 5.63585C16.4112 3.68323 13.2453 3.68323 11.2927 5.63585L10.9392 5.98941C8.98653 7.94203 8.98653 11.1079 10.9392 13.0605L12.3534 14.4747L10.9392 15.8889L9.52494 14.4747C6.79127 11.741 6.79127 7.30886 9.52494 4.57519L9.87849 4.22164C12.6122 1.48797 17.0443 1.48797 19.778 4.22164C22.5117 6.95531 22.5117 11.3875 19.778 14.1211Z"
              />
            </svg>
          </button>

          <button
            class="toolbar-button"
            @click=${() => this.handleShare()}
            aria-label="Share"
            title="Share"
          >
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M13.5756 3.97566C13.5 3.58114 13.5 3.0828 13.5 2.08614C13.5 1.5827 13.5 1.33098 13.581 1.17422C13.6514 1.03658 13.7696 0.931236 13.9124 0.876178C14.0761 0.813231 14.2888 0.866011 14.7142 0.971572L22.5475 3.0382C22.9389 3.13554 23.1346 3.18422 23.2742 3.29472C23.3973 3.39234 23.4882 3.52448 23.5346 3.6742C23.5875 3.8442 23.5589 4.04474 23.5018 4.44582L21.4351 18.7792C21.3839 19.1298 21.3583 19.3051 21.2743 19.4388C21.2008 19.5562 21.0963 19.65 20.9734 19.7094C20.833 19.7777 20.6586 19.7839 20.3098 19.7963C19.7668 19.8149 19.495 19.8243 19.2744 19.7482C19.0776 19.6807 18.9048 19.5562 18.7766 19.3897C18.6328 19.2024 18.5627 18.9468 18.4227 18.4356L16.1406 10.0921C16.0543 9.77607 16.0111 9.61806 15.9311 9.48611C15.8603 9.36957 15.7696 9.26753 15.6632 9.18486C15.5432 9.09191 15.3967 9.03135 15.1037 8.91024L6.74328 5.41877C6.19642 5.18781 5.923 5.07233 5.71585 4.8844C5.53166 4.71807 5.39182 4.50959 5.30908 4.27657C5.21509 4.01353 5.21506 3.71154 5.21501 3.10756C5.21501 2.38496 5.21501 2.02366 5.31939 1.76764C5.41092 1.54222 5.56758 1.35039 5.76863 1.21729C5.99754 1.06485 6.31224 1.02224 6.94166 0.937031L13.5756 3.97566ZM13.5756 3.97566L6.23056 7.64816M6.23056 7.64816L2.55806 18.8982C2.36336 19.4556 2.26602 19.7343 2.28858 19.9343C2.30818 20.1096 2.38668 20.2732 2.51098 20.3975C2.65286 20.5393 2.90836 20.6174 3.41936 20.7736L5.14186 21.3111C5.65286 21.4674 5.90836 21.5455 6.13356 21.5229C6.33356 21.5033 6.52276 21.4248 6.67706 21.2981C6.85166 21.1539 6.96716 20.9051 7.19816 20.4076L10.8707 11.1576M6.23056 7.64816L10.8707 11.1576M10.8707 11.1576L13.5756 3.97566"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>

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

        ${this.renderExif(currentPhoto)}
      </div>
    `;
  }

  private renderExif(photo: Photo) {
    const exif = photo.exif;
    const items = [];

    if (this.showExif && exif) {
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
