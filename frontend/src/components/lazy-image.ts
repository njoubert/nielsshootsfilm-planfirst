import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

/**
 * Lazy-loading image component with blur placeholder.
 */
@customElement('lazy-image')
export class LazyImage extends LitElement {
  @property({ type: String }) src = '';
  @property({ type: String }) alt = '';
  @property({ type: String }) aspectRatio = '16/9';

  @state() private loaded = false;
  @state() private error = false;

  private observer?: IntersectionObserver;

  static styles = css`
    :host {
      display: block;
      position: relative;
      overflow: hidden;
    }

    .container {
      position: relative;
      width: 100%;
      aspect-ratio: var(--aspect-ratio);
      background-color: var(--color-surface, #f0f0f0);
    }

    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    img.loading {
      opacity: 0;
    }

    img.loaded {
      opacity: 1;
    }

    .placeholder {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        135deg,
        var(--color-surface, #f0f0f0) 0%,
        var(--color-background, #fff) 100%
      );
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }

    .error {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-text-secondary, #666);
      font-size: 0.875rem;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.setupIntersectionObserver();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.observer?.disconnect();
  }

  private setupIntersectionObserver() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.loadImage();
            this.observer?.disconnect();
          }
        });
      },
      { rootMargin: '50px' }
    );

    this.observer.observe(this);
  }

  private loadImage() {
    if (!this.src || this.loaded) return;

    const img = new Image();
    img.onload = () => {
      this.loaded = true;
      this.requestUpdate();
    };
    img.onerror = () => {
      this.error = true;
      this.requestUpdate();
    };
    img.src = this.src;
  }

  render() {
    const style = `--aspect-ratio: ${this.aspectRatio}`;

    return html`
      <div class="container" style="${style}">
        ${!this.loaded && !this.error ? html`<div class="placeholder"></div>` : ''}
        ${this.error
          ? html`<div class="error">Failed to load image</div>`
          : html`<img
              src="${this.src}"
              alt="${this.alt}"
              class="${this.loaded ? 'loaded' : 'loading'}"
            />`}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lazy-image': LazyImage;
  }
}
