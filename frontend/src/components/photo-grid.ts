import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Photo } from '../types/data-models';
import './lazy-image';

/**
 * Photo grid component with masonry layout.
 * Emits 'photo-click' event when a photo is clicked.
 */
@customElement('photo-grid')
export class PhotoGrid extends LitElement {
  @property({ type: Array }) photos: Photo[] = [];
  @property({ type: String }) layout: 'masonry' | 'grid' | 'justified' = 'masonry';

  static styles = css`
    :host {
      display: block;
    }

    .grid {
      display: grid;
      gap: 1rem;
      padding: 1rem;
    }

    /* Masonry layout using CSS Grid */
    .grid.masonry {
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      grid-auto-rows: 10px;
    }

    .grid.masonry .photo-item {
      grid-row-end: span var(--row-span);
    }

    /* Standard grid layout */
    .grid.standard {
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    }

    .photo-item {
      cursor: pointer;
      overflow: hidden;
      border-radius: 4px;
      transition:
        transform 0.2s,
        box-shadow 0.2s;
    }

    .photo-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .photo-item lazy-image {
      width: 100%;
      height: 100%;
    }

    @media (max-width: 768px) {
      .grid {
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 0.5rem;
        padding: 0.5rem;
      }
    }
  `;

  render() {
    const gridClass = this.layout === 'masonry' ? 'masonry' : 'standard';

    return html`
      <div class="grid ${gridClass}">
        ${this.photos.map((photo, index) => this.renderPhoto(photo, index))}
      </div>
    `;
  }

  private renderPhoto(photo: Photo, index: number) {
    const aspectRatio = `${photo.width}/${photo.height}`;

    // Calculate row span for masonry layout
    let rowSpan = 20; // Default
    if (this.layout === 'masonry') {
      const ratio = photo.height / photo.width;
      rowSpan = Math.ceil(ratio * 30); // Adjust multiplier as needed
    }

    return html`
      <div
        class="photo-item"
        style="--row-span: ${rowSpan}"
        @click=${() => this.handlePhotoClick(photo, index)}
      >
        <lazy-image
          src="${photo.url_thumbnail}"
          alt="${photo.alt_text || photo.caption || `Photo ${index + 1}`}"
          aspectRatio="${aspectRatio}"
        ></lazy-image>
      </div>
    `;
  }

  private handlePhotoClick(photo: Photo, index: number) {
    this.dispatchEvent(
      new CustomEvent('photo-click', {
        detail: { photo, index },
        bubbles: true,
        composed: true,
      })
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'photo-grid': PhotoGrid;
  }
}
