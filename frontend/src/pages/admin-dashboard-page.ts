/**
 * Admin dashboard - landing page for admin section.
 * Shows overview stats and quick actions.
 */

import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import '../components/admin-header';
import type { Album, SiteConfig } from '../types/data-models';
import { fetchAllAlbums } from '../utils/admin-api';
import { fetchSiteConfig } from '../utils/api';

@customElement('admin-dashboard-page')
export class AdminDashboardPage extends LitElement {
  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      background: var(--color-background, #f5f5f5);
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .page-title {
      font-size: 1.75rem;
      font-weight: 600;
      color: var(--color-text-primary, #333);
      margin: 0 0 0.5rem;
    }

    .page-subtitle {
      font-size: 1rem;
      color: var(--color-text-secondary, #666);
      margin: 0;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: var(--color-surface, white);
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--color-text-secondary, #666);
      margin: 0 0 0.5rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--color-text-primary, #333);
      margin: 0;
    }

    .stat-meta {
      font-size: 0.75rem;
      color: var(--color-text-secondary, #999);
      margin: 0.5rem 0 0;
    }

    .quick-actions {
      background: var(--color-surface, white);
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .section-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--color-text-primary, #333);
      margin: 0 0 1rem;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }

    .action-card {
      padding: 1.5rem;
      border: 2px solid var(--color-border, #ddd);
      border-radius: 8px;
      text-decoration: none;
      color: var(--color-text-primary, #333);
      transition: all 0.2s;
      text-align: center;
    }

    .action-card:hover {
      border-color: var(--color-primary, #007bff);
      background: var(--color-background, #f8f9fa);
      transform: translateY(-2px);
    }

    .action-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .action-title {
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 0.25rem;
    }

    .action-description {
      font-size: 0.813rem;
      color: var(--color-text-secondary, #666);
      margin: 0;
    }

    .loading,
    .error {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--color-text-secondary, #666);
    }

    .error {
      color: #dc3545;
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }

      .actions-grid {
        grid-template-columns: 1fr;
      }
    }
  `;

  @state()
  private albums: Album[] = [];

  @state()
  private siteConfig: SiteConfig | null = null;

  @state()
  private loading = true;

  @state()
  private error = '';

  connectedCallback() {
    super.connectedCallback();
    void this.loadData();
  }

  private async loadData() {
    this.loading = true;
    this.error = '';

    try {
      [this.albums, this.siteConfig] = await Promise.all([fetchAllAlbums(), fetchSiteConfig()]);
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to load data';
    } finally {
      this.loading = false;
    }
  }

  private getStats() {
    const totalAlbums = this.albums.length;
    const publicAlbums = this.albums.filter((a) => a.visibility === 'public').length;
    const totalPhotos = this.albums.reduce((sum, album) => sum + (album.photos?.length || 0), 0);
    const portfolioAlbum = this.albums.find((a) => a.is_portfolio_album);

    return {
      totalAlbums,
      publicAlbums,
      totalPhotos,
      portfolioAlbum,
    };
  }

  render() {
    const siteTitle = this.siteConfig?.site?.title || 'Photography Portfolio';

    if (this.loading) {
      return html`
        <admin-header .siteTitle=${siteTitle} currentPage="dashboard"></admin-header>
        <div class="container">
          <div class="loading">Loading dashboard...</div>
        </div>
      `;
    }

    if (this.error) {
      return html`
        <admin-header .siteTitle=${siteTitle} currentPage="dashboard"></admin-header>
        <div class="container">
          <div class="error">${this.error}</div>
        </div>
      `;
    }

    const stats = this.getStats();

    return html`
      <admin-header .siteTitle=${siteTitle} currentPage="dashboard"></admin-header>

      <div class="container">
        <div class="page-header">
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">Welcome back! Here's an overview of your portfolio.</p>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <p class="stat-label">Total Albums</p>
            <p class="stat-value">${stats.totalAlbums}</p>
            <p class="stat-meta">${stats.publicAlbums} public</p>
          </div>

          <div class="stat-card">
            <p class="stat-label">Total Photos</p>
            <p class="stat-value">${stats.totalPhotos}</p>
            <p class="stat-meta">
              ${stats.totalAlbums > 0
                ? `Avg ${Math.round(stats.totalPhotos / stats.totalAlbums)} per album`
                : ''}
            </p>
          </div>

          <div class="stat-card">
            <p class="stat-label">Portfolio Album</p>
            <p class="stat-value">${stats.portfolioAlbum ? '✓' : '—'}</p>
            <p class="stat-meta">
              ${stats.portfolioAlbum ? stats.portfolioAlbum.title : 'No portfolio album set'}
            </p>
          </div>
        </div>

        <div class="quick-actions">
          <h2 class="section-title">Quick Actions</h2>
          <div class="actions-grid">
            <a href="/admin/albums/new" class="action-card">
              <div class="action-icon">📸</div>
              <h3 class="action-title">Create Album</h3>
              <p class="action-description">Start a new photo album</p>
            </a>

            <a href="/admin/albums" class="action-card">
              <div class="action-icon">📚</div>
              <h3 class="action-title">Manage Albums</h3>
              <p class="action-description">View and edit all albums</p>
            </a>

            <a href="/admin/settings" class="action-card">
              <div class="action-icon">⚙️</div>
              <h3 class="action-title">Settings</h3>
              <p class="action-description">Configure your site</p>
            </a>

            <a href="/" class="action-card" target="_blank">
              <div class="action-icon">🌐</div>
              <h3 class="action-title">View Site</h3>
              <p class="action-description">See your public portfolio</p>
            </a>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'admin-dashboard-page': AdminDashboardPage;
  }
}
