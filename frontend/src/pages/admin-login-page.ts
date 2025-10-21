/**
 * Admin login page.
 */

import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { login } from '../utils/admin-api';

@customElement('admin-login-page')
export class AdminLoginPage extends LitElement {
  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-background, #f5f5f5);
    }

    .login-container {
      width: 100%;
      max-width: 400px;
      padding: 2rem;
    }

    .login-card {
      background: var(--color-surface, white);
      border-radius: 8px;
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    h1 {
      font-family: 'Raleway', sans-serif;
      margin: 0 0 0.5rem;
      font-size: 1.75rem;
      color: var(--color-text-primary, #333);
      text-align: center;
      text-transform: uppercase;
    }

    .subtitle {
      font-family: 'Raleway', sans-serif;
      margin: 0 0 2rem;
      color: var(--color-text-secondary, #666);
      text-align: center;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      color: var(--color-text-primary, #333);
      font-weight: 500;
      font-size: 0.875rem;
    }

    input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--color-border, #ddd);
      border-radius: 4px;
      font-size: 1rem;
      font-family: inherit;
      box-sizing: border-box;
      transition: border-color 0.2s;
    }

    input:focus {
      outline: none;
      border-color: var(--color-primary, #007bff);
    }

    .error-message {
      margin-top: 1rem;
      padding: 0.75rem;
      background: #fee;
      border: 1px solid #fcc;
      border-radius: 4px;
      color: #c00;
      font-size: 0.875rem;
    }

    .success-message {
      margin-top: 1rem;
      padding: 0.75rem;
      background: #efe;
      border: 1px solid #cfc;
      border-radius: 4px;
      color: #060;
      font-size: 0.875rem;
    }

    button {
      width: 100%;
      padding: 0.875rem;
      background: var(--color-primary, #007bff);
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    button:hover:not(:disabled) {
      background: var(--color-primary-hover, #0056b3);
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .loading {
      opacity: 0.6;
    }
  `;

  @state()
  private username = '';

  @state()
  private password = '';

  @state()
  private loading = false;

  @state()
  private error = '';

  @state()
  private success = false;

  private handleSubmit(e: Event) {
    e.preventDefault();
    void this.performLogin();
  }

  private async performLogin() {
    this.error = '';
    this.loading = true;

    try {
      await login({
        username: this.username,
        password: this.password,
      });

      this.success = true;

      // Redirect to admin dashboard after short delay
      setTimeout(() => {
        window.location.href = '/admin';
      }, 500);
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Login failed';
      this.loading = false;
    }
  }

  render() {
    return html`
      <div class="login-container">
        <div class="login-card">
          <h1>Admin Login</h1>
          <p class="subtitle">Photography Portfolio Admin</p>

          <form @submit=${(e: Event) => this.handleSubmit(e)}>
            <div class="form-group">
              <label for="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                .value=${this.username}
                @input=${(e: Event) => (this.username = (e.target as HTMLInputElement).value)}
                required
                autocomplete="username"
                ?disabled=${this.loading}
              />
            </div>

            <div class="form-group">
              <label for="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                .value=${this.password}
                @input=${(e: Event) => (this.password = (e.target as HTMLInputElement).value)}
                required
                autocomplete="current-password"
                ?disabled=${this.loading}
              />
            </div>

            ${this.error ? html`<div class="error-message">${this.error}</div>` : ''}
            ${this.success
              ? html`<div class="success-message">Login successful! Redirecting...</div>`
              : ''}

            <button type="submit" ?disabled=${this.loading} class=${this.loading ? 'loading' : ''}>
              ${this.loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'admin-login-page': AdminLoginPage;
  }
}
