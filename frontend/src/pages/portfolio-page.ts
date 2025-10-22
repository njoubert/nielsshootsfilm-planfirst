import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import '../components/album-cover-hero';
import '../components/loading-spinner';
import '../components/photo-grid';
import '../components/photo-lightbox';
import type { Album, SiteConfig } from '../types/data-models';
import { fetchMainPortfolioAlbum, fetchSiteConfig } from '../utils/api';

/**
 * Landing/Portfolio page showing the main portfolio album.
 */
@customElement('portfolio-page')
export class PortfolioPage extends LitElement {
  @state() private album?: Album;
  @state() private siteConfig?: SiteConfig;
  @state() private loading = true;
  @state() private error = '';
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

    .about-section {
      max-width: 800px;
      margin: 4rem auto;
      padding: 0 2rem;
    }

    .about-title {
      font-family: 'Raleway', sans-serif;
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 1rem;
      color: var(--color-text-primary);
      text-transform: uppercase;
    }

    .about-bio {
      line-height: 1.8;
      color: var(--color-text-secondary);
      margin-bottom: 1rem;
    }

    .about-location {
      color: var(--color-text-secondary);
      font-style: italic;
    }

    .photos-section {
      padding: 0 0 2rem 0;
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
    // Check for photo parameter after album loads
    if (changedProperties.has('album') && this.album) {
      this.checkPhotoParameter();
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

  private async loadData() {
    try {
      this.loading = true;
      const [album, siteConfig] = await Promise.all([fetchMainPortfolioAlbum(), fetchSiteConfig()]);

      this.album = album ?? undefined;
      this.siteConfig = siteConfig;

      if (!this.album) {
        this.error = 'No portfolio album found';
      }
    } catch (err) {
      this.error = 'Failed to load portfolio';
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

    if (this.error || !this.album) {
      return html`
        <div class="error-container">
          <p>${this.error || 'Album not found'}</p>
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

      ${this.siteConfig?.owner ? this.renderAbout() : ''}

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
      ></photo-lightbox>
    `;
  }

  private renderAbout() {
    if (!this.siteConfig?.owner) return '';

    const { name, bio, location } = this.siteConfig.owner;

    return html`
      <div class="about-section">
        ${name ? html`<h2 class="about-title">${name}</h2>` : ''}
        ${bio ? html`<p class="about-bio">${bio}</p>` : ''}
        ${location ? html`<p class="about-location">${location}</p>` : ''}
      </div>
    `;
  }

  private handlePhotoClick(e: CustomEvent) {
    if (!this.album) return;
    const { index } = e.detail as { index: number };
    const photo = this.album.photos[index];
    if (!photo) return;

    this.lightboxIndex = index;
    this.lightboxOpen = true;
    this.updateURLWithPhoto(photo.id);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'portfolio-page': PortfolioPage;
  }
}
