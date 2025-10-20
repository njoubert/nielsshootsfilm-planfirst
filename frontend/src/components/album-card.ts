import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Album } from '../types/data-models';
import './lazy-image';

/**
 * Album preview card for album listings.
 */
@customElement('album-card')
export class AlbumCard extends LitElement {
  @property({ type: Object }) album?: Album;
  @property({ type: Boolean }) showPhotoCount = true;

  static styles = css`
    :host {
      display: block;
    }

    .card {
      cursor: pointer;
      border-radius: 8px;
      overflow: hidden;
      transition:
        transform 0.2s,
        box-shadow 0.2s;
      background-color: var(--color-surface);
    }

    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }

    .cover {
      aspect-ratio: 3/2;
      overflow: hidden;
    }

    .cover lazy-image {
      width: 100%;
      height: 100%;
    }

    .info {
      padding: 1rem;
    }

    .title {
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0 0 0.25rem 0;
      color: var(--color-text-primary);
    }

    .subtitle {
      font-size: 0.9rem;
      color: var(--color-text-secondary);
      margin: 0 0 0.5rem 0;
    }

    .meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.85rem;
      color: var(--color-text-secondary);
    }

    .photo-count {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .visibility-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      background-color: var(--color-border);
      color: var(--color-text-secondary);
    }

    .visibility-badge.password {
      background-color: rgba(255, 193, 7, 0.2);
      color: #f57c00;
    }
  `;

  render() {
    if (!this.album) return html``;

    const coverPhoto =
      this.album.photos.find((p) => p.id === this.album?.cover_photo_id) || this.album.photos[0];

    return html`
      <div class="card" @click=${() => this.handleClick()}>
        <div class="cover">
          ${coverPhoto
            ? html`<lazy-image
                src="${coverPhoto.url_thumbnail}"
                alt="${this.album.title}"
                aspectRatio="3/2"
              ></lazy-image>`
            : ''}
        </div>
        <div class="info">
          <h3 class="title">${this.album.title}</h3>
          ${this.album.subtitle ? html`<p class="subtitle">${this.album.subtitle}</p>` : ''}
          <div class="meta">
            ${this.showPhotoCount
              ? html`<div class="photo-count">
                  📷 ${this.album.photos.length}
                  ${this.album.photos.length === 1 ? 'photo' : 'photos'}
                </div>`
              : ''}
            ${this.album.visibility === 'password_protected'
              ? html`<span class="visibility-badge password">🔒 Protected</span>`
              : ''}
            ${this.album.visibility === 'unlisted'
              ? html`<span class="visibility-badge">Unlisted</span>`
              : ''}
          </div>
        </div>
      </div>
    `;
  }

  private handleClick() {
    this.dispatchEvent(
      new CustomEvent('album-click', {
        detail: { album: this.album },
        bubbles: true,
        composed: true,
      })
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'album-card': AlbumCard;
  }
}
