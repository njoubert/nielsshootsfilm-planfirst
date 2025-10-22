/**
 * Admin header component - consistent header for all admin pages.
 * Shows site title (links to public site), navigation tabs, and logout button.
 */

import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { logout } from '../utils/admin-api';
import { themeManager } from '../utils/theme-manager';

@customElement('admin-header')
export class AdminHeader extends LitElement {
  static styles = css`
    :host {
      display: block;
      background: var(--color-surface, white);
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .header {
      padding: 1rem 2rem 0;
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .site-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-text-primary, #333);
      text-decoration: none;
      transition: color 0.2s;
      text-transform: uppercase;
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

    .header-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .theme-toggle-btn {
      padding: 0.5rem;
      background: var(--color-border, #ddd);
      color: var(--color-text-primary, #333);
      border: none;
      border-radius: 4px;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      filter: grayscale(100%);
      width: 2rem;
      height: 2rem;
      flex-shrink: 0;
    }

    .theme-toggle-btn:hover {
      background: var(--color-border, #ccc);
      transform: scale(1.05);
    }

    .theme-toggle-btn:active {
      transform: scale(0.95);
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
      transition: all 0.2s;
      height: 2rem;
      display: flex;
      align-items: center;
    }

    .logout-btn:hover {
      background: var(--color-border, #ccc);
      transform: scale(1.05);
    }

    .logout-btn:active {
      transform: scale(0.95);
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

  @state()
  private currentTheme: 'light' | 'dark' = 'light';

  @state()
  private themeMode: 'system' | 'light' | 'dark' = 'system';

  connectedCallback() {
    super.connectedCallback();
    // Subscribe to theme changes from the theme manager
    this.currentTheme = themeManager.getCurrentTheme();
    this.themeMode = themeManager.getMode();

    themeManager.subscribe((theme) => {
      this.currentTheme = theme;
      this.themeMode = themeManager.getMode();
    });
  }

  private toggleTheme() {
    // Toggle through: system -> light -> dark -> system
    const currentMode = themeManager.getMode();
    console.log('Current theme mode:', currentMode, 'Current theme:', this.currentTheme);

    if (currentMode === 'system') {
      // Override system with opposite of current theme
      const newMode = this.currentTheme === 'light' ? 'dark' : 'light';
      console.log('Setting mode from system to:', newMode);
      themeManager.setMode(newMode);
    } else if (currentMode === 'light') {
      console.log('Setting mode from light to dark');
      themeManager.setMode('dark');
    } else {
      // dark -> back to system
      console.log('Setting mode from dark to system');
      themeManager.setMode('system');
    }

    console.log(
      'After toggle - mode:',
      themeManager.getMode(),
      'theme:',
      themeManager.getCurrentTheme()
    );
  }

  private getThemeIcon(): string {
    if (this.themeMode === 'system') {
      return '🌓'; // System (auto)
    }
    return this.currentTheme === 'dark' ? '☀️' : '🌙';
  }

  private getThemeTooltip(): string {
    if (this.themeMode === 'system') {
      return `System theme (currently ${this.currentTheme})`;
    }
    return `Switch to ${this.currentTheme === 'light' ? 'dark' : 'light'} mode`;
  }

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
          <div class="header-actions">
            <button
              class="theme-toggle-btn"
              @click=${() => this.toggleTheme()}
              title="${this.getThemeTooltip()}"
            >
              ${this.getThemeIcon()}
            </button>
            <button class="logout-btn" @click=${() => this.handleLogout()}>Logout</button>
          </div>
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
