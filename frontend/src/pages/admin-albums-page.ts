/**
 * Admin albums list page - main dashboard for managing albums.
 */

import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import '../components/admin-header';
import type { Album, SiteConfig } from '../types/data-models';
import { deleteAlbum, fetchAllAlbums } from '../utils/admin-api';
import { fetchSiteConfig } from '../utils/api';

@customElement('admin-albums-page')
export class AdminAlbumsPage extends LitElement {
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
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .page-title {
      font-family: 'Raleway', sans-serif;
      font-size: 52px;
      font-weight: 600;
      color: var(--color-text-primary, #333);
      margin: 0;
      text-transform: uppercase;
    }

    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
      display: inline-block;
    }

    .btn-primary {
      background: var(--color-primary, #007bff);
      color: white;
    }

    .btn-primary:hover {
      background: var(--color-primary-hover, #0056b3);
    }

    .btn-secondary {
      background: var(--color-border, #ddd);
      color: var(--color-text-primary, #333);
    }

    .btn-secondary:hover {
      background: #ccc;
    }

    .btn-danger {
      background: #dc3545;
      color: white;
    }

    .btn-danger:hover {
      background: #c82333;
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

    .albums-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-top: 1.5rem;
    }

    .album-card {
      background: var(--color-surface, white);
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: box-shadow 0.2s;
    }

    .album-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .album-thumbnail {
      width: 100%;
      height: 200px;
      background: var(--color-border, #ddd);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-text-secondary, #666);
      font-size: 0.875rem;
      position: relative;
      overflow: hidden;
    }

    .album-thumbnail img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .album-info {
      padding: 1rem;
    }

    .album-title {
      font-family: 'Raleway', sans-serif;
      margin: 0 0 0.25rem;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--color-text-primary, #333);
      text-transform: uppercase;
    }

    .album-subtitle {
      margin: 0 0 0.5rem;
      font-size: 0.875rem;
      color: var(--color-text-secondary, #666);
    }

    .album-meta {
      display: flex;
      gap: 1rem;
      margin: 0.75rem 0;
      font-size: 0.75rem;
      color: var(--color-text-secondary, #666);
    }

    .album-meta span {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .visibility-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .visibility-public {
      background: #d4edda;
      color: #155724;
    }

    .visibility-unlisted {
      background: #fff3cd;
      color: #856404;
    }

    .visibility-password_protected {
      background: #f8d7da;
      color: #721c24;
    }

    .album-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--color-border, #eee);
    }

    .album-actions button {
      flex: 1;
    }

    .btn-small {
      padding: 0.375rem 0.75rem;
      font-size: 0.813rem;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
    }

    .empty-state h2 {
      font-family: 'Raleway', sans-serif;
      margin: 0 0 0.5rem;
      color: var(--color-text-primary, #333);
      text-transform: uppercase;
    }

    .empty-state p {
      margin: 0 0 1.5rem;
      color: var(--color-text-secondary, #666);
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {
      background: var(--color-surface, white);
      border-radius: 8px;
      padding: 2rem;
      max-width: 400px;
      width: 90%;
    }

    .modal h2 {
      font-family: 'Raleway', sans-serif;
      margin: 0 0 1rem;
      font-size: 1.25rem;
      text-transform: uppercase;
    }

    .modal p {
      margin: 0 0 1.5rem;
      color: var(--color-text-secondary, #666);
    }

    .modal-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
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

  @state()
  private deleteConfirm: { show: boolean; album: Album | null } = {
    show: false,
    album: null,
  };

  connectedCallback() {
    super.connectedCallback();
    void this.loadData();
  }

  private async loadData() {
    await Promise.all([this.loadAlbums(), this.loadSiteConfig()]);
  }

  private async loadSiteConfig() {
    try {
      this.siteConfig = await fetchSiteConfig();
    } catch (err) {
      console.error('Failed to load site config:', err);
    }
  }

  private async loadAlbums() {
    this.loading = true;
    this.error = '';

    try {
      this.albums = await fetchAllAlbums();
      // Sort by order
      this.albums.sort((a, b) => a.order - b.order);
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to load albums';
    } finally {
      this.loading = false;
    }
  }

  private showDeleteConfirm(album: Album) {
    this.deleteConfirm = { show: true, album };
  }

  private hideDeleteConfirm() {
    this.deleteConfirm = { show: false, album: null };
  }

  private async handleDelete() {
    if (!this.deleteConfirm.album) return;

    try {
      await deleteAlbum(this.deleteConfirm.album.id);
      this.hideDeleteConfirm();
      void this.loadAlbums(); // Reload the list
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to delete album';
      this.hideDeleteConfirm();
    }
  }

  private getCoverThumbnail(album: Album): string | null {
    // Handle albums with no photos
    if (!album.photos || album.photos.length === 0) {
      return null;
    }

    if (album.cover_photo_id) {
      const coverPhoto = album.photos.find((p) => p.id === album.cover_photo_id);
      return coverPhoto?.url_thumbnail || null;
    }
    return album.photos[0]?.url_thumbnail || null;
  }

  private formatVisibility(visibility: string): string {
    return visibility.replace('_', ' ');
  }

  render() {
    const siteTitle = this.siteConfig?.site?.title || 'Photography Portfolio';

    if (this.loading) {
      return html`
        <admin-header .siteTitle=${siteTitle} currentPage="albums"></admin-header>
        <div class="container">
          <div class="loading">Loading albums...</div>
        </div>
      `;
    }

    if (this.error) {
      return html`
        <admin-header .siteTitle=${siteTitle} currentPage="albums"></admin-header>
        <div class="container">
          <div class="error">${this.error}</div>
          <div style="text-align: center; margin-top: 1rem;">
            <button class="btn btn-primary" @click=${() => this.loadAlbums()}>Retry</button>
          </div>
        </div>
      `;
    }

    return html`
      <admin-header .siteTitle=${siteTitle} currentPage="albums"></admin-header>

      <div class="container">
        <div class="page-header">
          <h1 class="page-title">Albums (${this.albums.length})</h1>
          <a href="/admin/albums/new" class="btn btn-primary">New Album</a>
        </div>
        ${this.albums.length === 0
          ? html`
              <div class="empty-state">
                <h2>No albums yet</h2>
                <p>Create your first album to get started</p>
                <a href="/admin/albums/new" class="btn btn-primary"> Create Album </a>
              </div>
            `
          : html`
              <div class="albums-grid">
                ${this.albums.map(
                  (album) => html`
                    <div class="album-card">
                      <div class="album-thumbnail">
                        ${this.getCoverThumbnail(album)
                          ? html`<img src=${this.getCoverThumbnail(album)!} alt=${album.title} />`
                          : html`<span>No photos</span>`}
                      </div>
                      <div class="album-info">
                        <h3 class="album-title">${album.title}</h3>
                        ${album.subtitle
                          ? html`<p class="album-subtitle">${album.subtitle}</p>`
                          : ''}

                        <div class="album-meta">
                          <span>📷 ${album.photos?.length || 0} photos</span>
                          <span class="visibility-badge visibility-${album.visibility}">
                            ${this.formatVisibility(album.visibility)}
                          </span>
                        </div>

                        <div class="album-actions">
                          <a
                            href="/admin/albums/${album.id}/edit"
                            class="btn btn-primary btn-small"
                          >
                            Edit
                          </a>
                          <a
                            href="/albums/${album.slug}"
                            class="btn btn-secondary btn-small"
                            target="_blank"
                          >
                            View
                          </a>
                          <button
                            class="btn btn-danger btn-small"
                            @click=${() => this.showDeleteConfirm(album)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  `
                )}
              </div>
            `}
      </div>

      ${this.deleteConfirm.show
        ? html`
            <div class="modal-overlay" @click=${() => this.hideDeleteConfirm()}>
              <div class="modal" @click=${(e: Event) => e.stopPropagation()}>
                <h2>Delete Album?</h2>
                <p>
                  Are you sure you want to delete
                  <strong>${this.deleteConfirm.album?.title}</strong>? This action cannot be undone.
                </p>
                <div class="modal-actions">
                  <button class="btn btn-secondary" @click=${() => this.hideDeleteConfirm()}>
                    Cancel
                  </button>
                  <button class="btn btn-danger" @click=${() => this.handleDelete()}>
                    Delete Album
                  </button>
                </div>
              </div>
            </div>
          `
        : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'admin-albums-page': AdminAlbumsPage;
  }
}
