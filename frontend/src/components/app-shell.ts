import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { SiteConfig } from '../types/data-models';
import { Router } from '../utils/router';
import { fetchSiteConfig } from '../utils/api';
import { themeManager } from '../utils/theme-manager';

// Import all components
import './app-nav';
import './app-footer';
import './loading-spinner';
import '../pages/portfolio-page';
import '../pages/album-list-page';
import '../pages/album-detail-page';

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

    main {
      flex: 1;
      width: 100%;
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

    // Initialize router
    this.router = new Router([
      { path: '/', component: 'portfolio-page' },
      { path: '/albums', component: 'album-list-page' },
      { path: '/albums/:slug', component: 'album-detail-page' },
      { path: '*', component: 'portfolio-page' }, // 404 fallback to home
    ]);

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

    if (!this.config) {
      return html`
        <div class="error">
          <p>Failed to load site configuration.</p>
        </div>
      `;
    }

    return html`
      <app-nav .config=${this.config.navigation} .siteTitle=${this.config.site.title}></app-nav>

      <main>${this.renderPage()}</main>

      <app-footer
        .social=${this.config.social}
        .owner=${this.config.owner}
        .siteTitle=${this.config.site.title}
      ></app-footer>
    `;
  }

  private renderPage() {
    const route = this.router?.getCurrentRoute();
    if (!route) {
      return html`<portfolio-page></portfolio-page>`;
    }

    switch (route.component) {
      case 'portfolio-page':
        return html`<portfolio-page></portfolio-page>`;
      case 'album-list-page':
        return html`<album-list-page></album-list-page>`;
      case 'album-detail-page':
        return html`<album-detail-page .slug=${this.extractSlug()}></album-detail-page>`;
      default:
        return html`<portfolio-page></portfolio-page>`;
    }
  }

  private extractSlug(): string {
    // Extract slug from /albums/:slug pattern
    const match = this.currentPath.match(/^\/albums\/([^/]+)$/);
    return match ? match[1] : '';
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-shell': AppShell;
  }
}
