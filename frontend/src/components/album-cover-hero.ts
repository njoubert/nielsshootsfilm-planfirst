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

  private handleScrollDown() {
    // Scroll by exactly the hero height (100vh) with custom easing
    const heroHeight = window.innerHeight;
    const startPosition = window.scrollY;
    const targetPosition = heroHeight;
    const distance = targetPosition - startPosition;
    const duration = 800; // 800ms for smooth scroll
    let startTime: number | null = null;

    // Ease-in-out cubic easing function
    const easeInOutCubic = (t: number): number => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const animation = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      const ease = easeInOutCubic(progress);

      window.scrollTo(0, startPosition + distance * ease);

      if (progress < 1) {
        requestAnimationFrame(animation);
      }
    };

    requestAnimationFrame(animation);
  }

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
      background: linear-gradient(to bottom, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.2));
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
      font-family: 'Raleway', sans-serif;
      font-size: 52px;
      font-weight: 700;
      margin: 0 0 1rem 0;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
      text-transform: uppercase;
      cursor: pointer;
    }

    .subtitle {
      font-family: 'Raleway', sans-serif;
      font-size: 14px;
      font-weight: 400;
      margin: 0;
      opacity: 0.9;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
      text-transform: uppercase;
      letter-spacing: 2px;
      cursor: pointer;
    }

    .scroll-indicator {
      position: absolute;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2;
      color: white;
      font-size: 2rem;
      cursor: pointer;
      animation: bounce 2s infinite;
      transition: opacity 0.2s;
    }

    .scroll-indicator:hover {
      opacity: 0.7;
      animation-play-state: paused;
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
        <div class="scroll-indicator" @click=${() => this.handleScrollDown()}>↓</div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'album-cover-hero': AlbumCoverHero;
  }
}
