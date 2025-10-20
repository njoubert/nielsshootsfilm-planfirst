import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

/**
 * Loading spinner component.
 * Simple animated spinner for loading states.
 */
@customElement('loading-spinner')
export class LoadingSpinner extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid var(--color-surface, #f3f3f3);
      border-top: 4px solid var(--color-text-primary, #333);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
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
      border-width: 6px;
    }
  `;

  render() {
    return html`<div class="spinner"></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'loading-spinner': LoadingSpinner;
  }
}
