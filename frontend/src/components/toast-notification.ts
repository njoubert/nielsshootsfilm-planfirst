import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * Toast notification component that appears in the bottom-right corner.
 * Auto-dismisses after a timeout and can be manually closed.
 */
@customElement('toast-notification')
export class ToastNotification extends LitElement {
  @property({ type: String }) message = '';
  @property({ type: String }) type: 'success' | 'error' | 'info' = 'info';
  @property({ type: Boolean }) visible = false;
  @property({ type: Number }) duration = 5000; // 5 seconds default

  private timeoutId: number | null = null;

  static styles = css`
    :host {
      display: block;
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      z-index: 9999;
      max-width: 400px;
      min-width: 300px;
    }

    .toast {
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      animation: slideIn 0.3s ease-out;
      position: relative;
    }

    .toast.hiding {
      animation: slideOut 0.3s ease-out forwards;
    }

    @keyframes slideIn {
      from {
        transform: translateX(120%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(120%);
        opacity: 0;
      }
    }

    .toast.success {
      background: var(--color-success-bg, #d4edda);
      border: 1px solid var(--color-success, #c3e6cb);
      color: var(--color-success-text, #155724);
    }

    .toast.error {
      background: var(--color-danger-bg, #f8d7da);
      border: 1px solid var(--color-danger, #f5c6cb);
      color: var(--color-danger-text, #721c24);
    }

    .toast.info {
      background: var(--color-info-bg, #e7f3ff);
      border: 1px solid var(--color-info, #b3d9ff);
      color: var(--color-info-text, #004085);
    }

    .toast-icon {
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .toast-content {
      flex: 1;
      white-space: pre-wrap;
      word-break: break-word;
      font-size: 0.875rem;
      line-height: 1.4;
    }

    .toast-close {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      font-size: 1.25rem;
      line-height: 1;
      opacity: 0.5;
      transition: opacity 0.2s;
      flex-shrink: 0;
      color: inherit;
    }

    .toast-close:hover {
      opacity: 1;
    }

    @media (max-width: 768px) {
      :host {
        bottom: 1rem;
        right: 1rem;
        left: 1rem;
        max-width: none;
        min-width: 0;
      }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    if (this.visible) {
      this.startTimer();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.clearTimer();
  }

  updated(changedProperties: Map<string | number | symbol, unknown>) {
    if (changedProperties.has('visible')) {
      if (this.visible) {
        this.startTimer();
      } else {
        this.clearTimer();
      }
    }
  }

  private startTimer() {
    this.clearTimer();
    if (this.duration > 0) {
      this.timeoutId = window.setTimeout(() => {
        this.hide();
      }, this.duration);
    }
  }

  private clearTimer() {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  private hide() {
    // Add hiding class for animation
    const toast = this.shadowRoot?.querySelector('.toast');
    if (toast) {
      toast.classList.add('hiding');
      // Wait for animation to complete before hiding
      setTimeout(() => {
        this.visible = false;
        this.dispatchEvent(new CustomEvent('toast-close'));
      }, 300);
    }
  }

  private handleClose = () => {
    this.hide();
  };

  render() {
    if (!this.visible || !this.message) {
      return html``;
    }

    const icon = this.type === 'success' ? '✓' : this.type === 'error' ? '✕' : 'ℹ';

    return html`
      <div class="toast ${this.type}">
        <span class="toast-icon">${icon}</span>
        <div class="toast-content">${this.message}</div>
        <button class="toast-close" @click=${this.handleClose} aria-label="Close">×</button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'toast-notification': ToastNotification;
  }
}
