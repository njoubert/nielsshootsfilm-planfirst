import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * Loading spinner component.
 * Simple animated spinner for loading states.
 */
@customElement('loading-spinner')
export class LoadingSpinner extends LitElement {
  @property({ type: String }) size: 'small' | 'default' | 'large' = 'default';

  static styles = css`
    :host {
      display: inline-block;
    }

    .spinner-container {
      width: 40px;
      height: 40px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      overflow: hidden;
    }

    .spinner-container.small {
      width: 20px;
      height: 20px;
    }

    .spinner-container.large {
      width: 60px;
      height: 60px;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid var(--color-surface, #f3f3f3);
      border-top: 4px solid var(--color-text-primary, #333);
      border-radius: 50%;
      animation: spin 2s linear infinite;
      will-change: transform;
      transform-origin: center center;
      flex-shrink: 0;
      box-sizing: border-box;
    }

    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    .spinner.small {
      width: 20px;
      height: 20px;
      border-width: 2px;
    }

    .spinner.large {
      width: 60px;
      height: 60px;
      border-width: 4px;
      margin: -10px;
    }
  `;

  render() {
    const sizeClass = this.size === 'default' ? '' : this.size;
    return html`
      <div class="spinner-container ${sizeClass}">
        <div class="spinner ${sizeClass}"></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'loading-spinner': LoadingSpinner;
  }
}
