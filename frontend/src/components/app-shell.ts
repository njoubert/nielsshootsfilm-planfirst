import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { SiteConfig } from '../types/data-models';
import { checkAuth } from '../utils/admin-api';
import { fetchSiteConfig } from '../utils/api';
import { Router } from '../utils/router';
import { themeManager } from '../utils/theme-manager';

// Import all public components
import '../pages/album-detail-page';
import '../pages/album-list-page';
import '../pages/portfolio-page';

// Import admin components
import '../pages/admin-album-editor-page';
import '../pages/admin-albums-page';
import '../pages/admin-dashboard-page';
import '../pages/admin-login-page';
import '../pages/admin-settings-page';

import './app-footer';
import './app-nav';
import './loading-spinner';

/**
 * Root application shell component.
 * Manages routing, global state, and layout.
 */
@customElement('app-shell')
export class AppShell extends LitElement {
  @state() private config?: SiteConfig;
  @state() private currentPath = '/';
  @state() private loading = true;

  private router?: Router;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .nav-wrapper {
      position: relative;
      z-index: 10;
    }

    .nav-wrapper.sticky-nav {
      position: sticky;
      top: 0;
    }

    .nav-wrapper.below-fold {
      position: absolute;
      top: 100vh;
      left: 0;
      right: 0;
    }

    main {
      flex: 1;
      width: 100%;
    }

    main.with-hero {
      padding-top: 0;
    }

    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 50vh;
    }

    .error {
      padding: 2rem;
      text-align: center;
      color: var(--color-text-secondary);
    }
  `;

  connectedCallback() {
    super.connectedCallback();

    // Initialize async without making connectedCallback async
    void this.initialize();
  }

  private async initialize() {
    // Load site configuration
    try {
      this.config = await fetchSiteConfig();
    } catch (error) {
      console.error('Failed to load site config:', error);
    }

    // Initialize router with admin routes
    this.router = new Router([
      // Public routes
      { path: '/', component: 'portfolio-page' },
      { path: '/albums', component: 'album-list-page' },
      { path: '/albums/:slug', component: 'album-detail-page' },

      // Admin routes (with auth guard)
      { path: '/admin/login', component: 'admin-login-page' },
      { path: '/admin', component: 'admin-dashboard-page', guard: checkAuth },
      { path: '/admin/albums', component: 'admin-albums-page', guard: checkAuth },
      { path: '/admin/albums/new', component: 'admin-album-editor-page', guard: checkAuth },
      { path: '/admin/albums/:id/edit', component: 'admin-album-editor-page', guard: checkAuth },
      { path: '/admin/settings', component: 'admin-settings-page', guard: checkAuth },

      // Fallback
      { path: '*', component: 'portfolio-page' },
    ]);

    // Set initial path from browser location
    // The router navigate() is async and voided in constructor, so we use window.location directly
    this.currentPath = window.location.pathname;

    // Subscribe to route changes
    this.router.subscribe((path) => {
      this.currentPath = path;
      this.requestUpdate();
    });

    // Initialize theme
    themeManager.subscribe(() => {
      this.requestUpdate();
    });

    this.loading = false;
  }

  render() {
    if (this.loading) {
      return html`
        <div class="loading">
          <loading-spinner></loading-spinner>
        </div>
      `;
    }

    // Admin pages don't need header/footer
    if (this.currentPath.startsWith('/admin')) {
      return html`<main>${this.renderPage()}</main>`;
    }

    if (!this.config) {
      return html`
        <div class="error">
          <p>Failed to load site configuration.</p>
        </div>
      `;
    }

    // Check if we're on an album detail page - use router match to determine
    const match = this.router?.getCurrentRoute();
    const isAlbumDetailPage = match?.route.path === '/albums/:slug';
    const navClass = isAlbumDetailPage ? 'below-fold sticky-nav' : '';
    const mainClass = isAlbumDetailPage ? 'with-hero' : '';

    return html`
      <div class="nav-wrapper ${navClass}">
        <app-nav .config=${this.config.navigation} .siteTitle=${this.config.site.title}></app-nav>
      </div>

      <main class="${mainClass}">${this.renderPage()}</main>

      <app-footer
        .social=${this.config.social}
        .owner=${this.config.owner}
        .siteTitle=${this.config.site.title}
      ></app-footer>
    `;
  }

  private renderPage() {
    const match = this.router?.getCurrentRoute();
    if (!match) {
      return html`<portfolio-page></portfolio-page>`;
    }

    const { route, params } = match;

    switch (route.component) {
      case 'portfolio-page':
        return html`<portfolio-page></portfolio-page>`;
      case 'album-list-page':
        return html`<album-list-page></album-list-page>`;
      case 'album-detail-page':
        return html`<album-detail-page .slug=${params.slug || ''}></album-detail-page>`;

      // Admin pages
      case 'admin-login-page':
        return html`<admin-login-page></admin-login-page>`;
      case 'admin-dashboard-page':
        return html`<admin-dashboard-page></admin-dashboard-page>`;
      case 'admin-albums-page':
        return html`<admin-albums-page></admin-albums-page>`;
      case 'admin-album-editor-page':
        return html`<admin-album-editor-page
          .albumId=${params.id || 'new'}
        ></admin-album-editor-page>`;
      case 'admin-settings-page':
        return html`<admin-settings-page></admin-settings-page>`;

      default:
        return html`<portfolio-page></portfolio-page>`;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-shell': AppShell;
  }
}
