/**
 * Admin header component - consistent header for all admin pages.
 * Shows site title (links to public site), navigation tabs, and logout button.
 */

import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { logout } from '../utils/admin-api';

@customElement('admin-header')
export class AdminHeader extends LitElement {
  static styles = css`
    :host {
      display: block;
      background: var(--color-surface, white);
      border-bottom: 1px solid var(--color-border, #ddd);
    }

    .header {
      padding: 1rem 2rem;
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .site-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-text-primary, #333);
      text-decoration: none;
      transition: color 0.2s;
    }

    .site-title:hover {
      color: var(--color-primary, #007bff);
    }

    .admin-badge {
      display: inline-block;
      margin-left: 0.5rem;
      padding: 0.125rem 0.5rem;
      background: var(--color-primary, #007bff);
      color: white;
      font-size: 0.75rem;
      font-weight: 500;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .logout-btn {
      padding: 0.5rem 1rem;
      background: var(--color-border, #ddd);
      color: var(--color-text-primary, #333);
      border: none;
      border-radius: 4px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .logout-btn:hover {
      background: var(--color-border, #ccc);
    }

    .nav-tabs {
      display: flex;
      gap: 0.5rem;
      border-bottom: 2px solid var(--color-border, #ddd);
      margin: 0 -2rem;
      padding: 0 2rem;
    }

    .nav-tab {
      padding: 0.75rem 1rem;
      color: var(--color-text-secondary, #666);
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      transition: all 0.2s;
    }

    .nav-tab:hover {
      color: var(--color-text-primary, #333);
      background: var(--color-background, #f8f9fa);
    }

    .nav-tab.active {
      color: var(--color-primary, #007bff);
      border-bottom-color: var(--color-primary, #007bff);
    }

    @media (max-width: 768px) {
      .header {
        padding: 1rem;
      }

      .header-top {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .nav-tabs {
        margin: 0 -1rem;
        padding: 0 1rem;
        overflow-x: auto;
      }
    }
  `;

  @property({ type: String })
  siteTitle = 'Photography Portfolio';

  @property({ type: String })
  currentPage = '';

  private async handleLogout() {
    try {
      await logout();
      window.location.href = '/admin/login';
    } catch (err) {
      console.error('Logout failed:', err);
    }
  }

  render() {
    return html`
      <div class="header">
        <div class="header-top">
          <div>
            <a href="/" class="site-title">
              ${this.siteTitle}
              <span class="admin-badge">Admin</span>
            </a>
          </div>
          <button class="logout-btn" @click=${() => this.handleLogout()}>Logout</button>
        </div>

        <nav class="nav-tabs">
          <a href="/admin" class="nav-tab ${this.currentPage === 'dashboard' ? 'active' : ''}">
            Dashboard
          </a>
          <a href="/admin/albums" class="nav-tab ${this.currentPage === 'albums' ? 'active' : ''}">
            Albums
          </a>
          <a
            href="/admin/settings"
            class="nav-tab ${this.currentPage === 'settings' ? 'active' : ''}"
          >
            Settings
          </a>
        </nav>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'admin-header': AdminHeader;
  }
}
