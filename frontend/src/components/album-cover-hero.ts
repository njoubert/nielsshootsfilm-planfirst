import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Photo } from '../types/data-models';

/**
 * Full-screen album cover hero section.
 */
@customElement('album-cover-hero')
export class AlbumCoverHero extends LitElement {
  @property({ type: Object }) coverPhoto?: Photo;
  @property({ type: String }) title = '';
  @property({ type: String }) subtitle = '';

  static styles = css`
    :host {
      display: block;
    }

    .hero {
      position: relative;
      height: 100vh;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .background {
      position: absolute;
      inset: 0;
      z-index: 0;
    }

    .background img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to bottom, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.5));
      z-index: 1;
    }

    .bottom-gradient {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 150px;
      background: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.7));
      z-index: 1;
    }

    .content {
      position: relative;
      z-index: 2;
      text-align: center;
      color: white;
      padding: 2rem;
      max-width: 800px;
    }

    .title {
      font-size: clamp(2rem, 5vw, 4rem);
      font-weight: 700;
      margin: 0 0 1rem 0;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
    }

    .subtitle {
      font-size: clamp(1rem, 2.5vw, 1.5rem);
      font-weight: 300;
      margin: 0;
      opacity: 0.9;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    }

    .scroll-indicator {
      position: absolute;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2;
      color: white;
      font-size: 2rem;
      animation: bounce 2s infinite;
    }

    @keyframes bounce {
      0%,
      20%,
      50%,
      80%,
      100% {
        transform: translateX(-50%) translateY(0);
      }
      40% {
        transform: translateX(-50%) translateY(-10px);
      }
      60% {
        transform: translateX(-50%) translateY(-5px);
      }
    }

    @media (max-width: 768px) {
      .hero {
        height: 70vh;
      }
    }
  `;

  render() {
    return html`
      <div class="hero">
        ${this.coverPhoto
          ? html`
              <div class="background">
                <img
                  src="${this.coverPhoto.url_display}"
                  alt="${this.coverPhoto.alt_text || this.title}"
                />
              </div>
              <div class="overlay"></div>
              <div class="bottom-gradient"></div>
            `
          : ''}
        <div class="content">
          <h1 class="title">${this.title}</h1>
          ${this.subtitle ? html`<p class="subtitle">${this.subtitle}</p>` : ''}
        </div>
        <div class="scroll-indicator">↓</div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'album-cover-hero': AlbumCoverHero;
  }
}
