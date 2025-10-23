import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '../components/album-cover-hero';
import '../components/loading-spinner';
import '../components/photo-grid';
import '../components/photo-lightbox';
import type { Album, SiteConfig } from '../types/data-models';
import { fetchAlbumBySlug, fetchSiteConfig, hasAlbumAccess } from '../utils/api';
import './password-form';

/**
 * Album detail page showing a single album.
 */
@customElement('album-detail-page')
export class AlbumDetailPage extends LitElement {
  @property({ type: String }) slug = '';

  @state() private album?: Album;
  @state() private siteConfig?: SiteConfig;
  @state() private loading = true;
  @state() private error = '';
  @state() private needsPassword = false;
  @state() private lightboxOpen = false;
  @state() private lightboxIndex = 0;

  static styles = css`
    :host {
      display: block;
    }

    .loading-container,
    .error-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 50vh;
      padding: 2rem;
    }

    .error-container {
      color: var(--color-text-secondary);
      text-align: center;
    }

    .description-section {
      max-width: 800px;
      margin: 2rem auto;
      padding: 0 2rem;
    }

    .description {
      line-height: 1.8;
      color: var(--color-text-secondary);
    }

    .photos-section {
      padding: 0 0 2rem 0;
    }

    .password-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 50vh;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    void this.loadData();
    window.addEventListener('popstate', this.handlePopState);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('popstate', this.handlePopState);
  }

  updated(changedProperties: Map<string | number | symbol, unknown>) {
    if (changedProperties.has('slug')) {
      void this.loadData();
    }
    // Check for photo parameter after album loads
    if (changedProperties.has('album') && this.album) {
      this.checkPhotoParameter();
    }
  }

  private async loadData() {
    try {
      this.loading = true;
      this.needsPassword = false;
      this.error = '';

      const [album, siteConfig] = await Promise.all([
        fetchAlbumBySlug(this.slug),
        fetchSiteConfig(),
      ]);

      this.album = album ?? undefined;
      this.siteConfig = siteConfig;

      if (!this.album) {
        this.error = 'Album not found';
        return;
      }

      // Check if password is required
      if (this.album.visibility === 'password_protected' && !hasAlbumAccess(this.album.id)) {
        this.needsPassword = true;
      }
    } catch (err) {
      this.error = 'Failed to load album';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  private handlePopState = () => {
    // Handle browser back/forward
    this.checkPhotoParameter();
  };

  private checkPhotoParameter() {
    const params = new URLSearchParams(window.location.search);
    const photoId = params.get('photo');

    if (photoId && this.album) {
      const index = this.album.photos.findIndex((p) => p.id === photoId);
      if (index !== -1) {
        this.lightboxIndex = index;
        this.lightboxOpen = true;
      }
    } else if (this.lightboxOpen) {
      // No photo param, close lightbox
      this.lightboxOpen = false;
    }
  }

  private updateURLWithPhoto(photoId: string) {
    const url = new URL(window.location.href);
    url.searchParams.set('photo', photoId);
    window.history.pushState({}, '', url.toString());
  }

  private clearPhotoFromURL() {
    const url = new URL(window.location.href);
    url.searchParams.delete('photo');
    window.history.pushState({}, '', url.toString());
  }

  private handlePhotoChange(e: CustomEvent<{ photoId: string; index: number }>) {
    const { photoId } = e.detail;
    this.updateURLWithPhoto(photoId);
  }

  private handleLightboxClose() {
    this.lightboxOpen = false;
    this.clearPhotoFromURL();
  }

  render() {
    if (this.loading) {
      return html`
        <div class="loading-container">
          <loading-spinner></loading-spinner>
        </div>
      `;
    }

    if (this.error || !this.album) {
      return html`
        <div class="error-container">
          <p>${this.error || 'Album not found'}</p>
        </div>
      `;
    }

    if (this.needsPassword) {
      return html`
        <div class="password-container">
          <password-form
            .albumId=${this.album.id}
            .albumTitle=${this.album.title}
            .passwordHash=${this.album.password_hash || ''}
            @password-success=${() => this.handlePasswordSuccess()}
          ></password-form>
        </div>
      `;
    }

    const coverPhoto =
      this.album.photos.find((p) => p.id === this.album?.cover_photo_id) || this.album.photos[0];

    return html`
      <album-cover-hero
        .coverPhoto=${coverPhoto}
        .title=${this.album.title}
        .subtitle=${this.album.subtitle || ''}
      ></album-cover-hero>

      ${this.album.description ? this.renderDescription() : ''}

      <div class="photos-section">
        <photo-grid
          .photos=${this.album.photos}
          .layout=${(this.siteConfig?.portfolio.default_photo_layout || 'masonry') as
            | 'masonry'
            | 'grid'
            | 'justified'
            | 'square'}
          @photo-click=${(e: CustomEvent) => this.handlePhotoClick(e)}
        ></photo-grid>
      </div>

      <photo-lightbox
        .photos=${this.album.photos}
        .currentIndex=${this.lightboxIndex}
        .showExif=${this.siteConfig?.portfolio.show_exif_data || false}
        ?open=${this.lightboxOpen}
        @photo-change=${(e: CustomEvent<{ photoId: string; index: number }>) =>
          this.handlePhotoChange(e)}
        @lightbox-close=${() => this.handleLightboxClose()}
        @close=${() => this.handleLightboxClose()}
      ></photo-lightbox>
    `;
  }

  private renderDescription() {
    return html`
      <div class="description-section">
        <p class="description">${this.album?.description}</p>
      </div>
    `;
  }

  private handlePhotoClick(e: CustomEvent) {
    const { index } = e.detail as { index: number };
    this.lightboxIndex = index;
    this.lightboxOpen = true;
    // Update URL with photo ID
    if (this.album) {
      const photoId = this.album.photos[index].id;
      this.updateURLWithPhoto(photoId);
    }
  }

  private handlePasswordSuccess() {
    this.needsPassword = false;
    this.requestUpdate();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'album-detail-page': AlbumDetailPage;
  }
}
