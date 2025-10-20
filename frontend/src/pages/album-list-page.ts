import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import '../components/album-card';
import '../components/loading-spinner';
import type { Album } from '../types/data-models';
import { fetchPublicAlbums } from '../utils/api';

/**
 * Album listing page showing all public albums.
 */
@customElement('album-list-page')
export class AlbumListPage extends LitElement {
  @state() private albums: Album[] = [];
  @state() private loading = true;
  @state() private error = '';

  static styles = css`
    :host {
      display: block;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 4rem 2rem;
    }

    .header {
      margin-bottom: 3rem;
      text-align: center;
    }

    .title {
      font-size: 2.5rem;
      font-weight: 700;
      margin: 0 0 1rem 0;
      color: var(--color-text-primary);
    }

    .subtitle {
      font-size: 1.1rem;
      color: var(--color-text-secondary);
      margin: 0;
    }

    .loading-container,
    .error-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 50vh;
    }

    .error-container {
      color: var(--color-text-secondary);
      text-align: center;
    }

    .albums-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 2rem;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: var(--color-text-secondary);
    }

    @media (max-width: 768px) {
      .container {
        padding: 2rem 1rem;
      }

      .title {
        font-size: 2rem;
      }

      .albums-grid {
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1.5rem;
      }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    void this.loadAlbums();
  }

  private async loadAlbums() {
    try {
      this.loading = true;
      this.albums = await fetchPublicAlbums();
    } catch (err) {
      this.error = 'Failed to load albums';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  render() {
    if (this.loading) {
      return html`
        <div class="loading-container">
          <loading-spinner></loading-spinner>
        </div>
      `;
    }

    if (this.error) {
      return html`
        <div class="error-container">
          <p>${this.error}</p>
        </div>
      `;
    }

    return html`
      <div class="container">
        <div class="header">
          <h1 class="title">Albums</h1>
          <p class="subtitle">Explore the collection</p>
        </div>

        ${this.albums.length > 0
          ? html`
              <div class="albums-grid">
                ${this.albums.map(
                  (album) => html`
                    <album-card
                      .album=${album}
                      @album-click=${() => this.handleAlbumClick(album)}
                    ></album-card>
                  `
                )}
              </div>
            `
          : html`
              <div class="empty-state">
                <p>No public albums available at this time.</p>
              </div>
            `}
      </div>
    `;
  }

  private handleAlbumClick(album: Album) {
    window.location.href = `/albums/${album.slug}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'album-list-page': AlbumListPage;
  }
}
