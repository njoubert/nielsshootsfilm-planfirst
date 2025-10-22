/**
 * Admin album editor page - create or edit an album.
 */

import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '../components/admin-header';
import '../components/toast-notification';
import type { Album, SiteConfig } from '../types/data-models';
import {
  createAlbum,
  deletePhoto,
  fetchAlbumById,
  reorderPhotos,
  setCoverPhoto,
  updateAlbum,
  uploadPhotos,
} from '../utils/admin-api';
import { fetchSiteConfig } from '../utils/api';

@customElement('admin-album-editor-page')
export class AdminAlbumEditorPage extends LitElement {
  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      background: var(--color-background, #f5f5f5);
    }

    .page-header {
      background: var(--color-surface, white);
      border-bottom: 1px solid var(--color-border, #ddd);
      padding: 1.5rem 2rem;
      margin-bottom: 0;
    }

    .page-title {
      font-family: 'Raleway', sans-serif;
      margin: 0;
      font-size: 32px;
      font-weight: 600;
      color: var(--color-text-primary, #333);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 0;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
      display: inline-block;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .btn-primary {
      background: var(--color-primary, #007bff);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--color-primary-hover, #0056b3);
    }

    .btn-secondary {
      background: var(--color-border, #ddd);
      color: var(--color-text-primary, #333);
    }

    .btn-secondary:hover {
      background: var(--color-border, #ccc);
    }

    .btn-danger {
      background: var(--color-danger, #dc3545);
      color: white;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
    }

    .loading,
    .error {
      text-align: center;
      padding: 3rem 1rem;
    }

    .error {
      color: var(--color-danger, #dc3545);
    }

    .form-section {
      background: var(--color-surface, white);
      border-radius: 0;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: var(--shadow-sm);
    }

    .form-section h2 {
      font-family: 'Raleway', sans-serif;
      margin: 0 0 1rem;
      font-size: 1rem;
      color: var(--color-text-primary, #333);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      color: var(--color-text-primary, #333);
      font-weight: 500;
      font-size: 0.875rem;
    }

    input,
    textarea,
    select {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid var(--color-border, #ddd);
      border-radius: 0;
      font-size: 0.875rem;
      font-family: inherit;
      box-sizing: border-box;
    }

    textarea {
      min-height: 100px;
      resize: vertical;
    }

    .checkbox-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .checkbox-group input[type='checkbox'] {
      width: auto;
      margin: 0;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .photo-upload {
      margin-top: 1rem;
    }

    .upload-area {
      border: 2px dashed var(--color-border, #ddd);
      border-radius: 0;
      padding: 2rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .upload-area:hover {
      border-color: var(--color-primary, #007bff);
      background: var(--color-background, #f8f9fa);
    }

    .upload-area.dragging {
      border-color: var(--color-primary, #007bff);
      background: var(--color-background, #e7f3ff);
    }

    .upload-area.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      border-color: var(--color-danger, #dc3545);
      background: var(--color-danger-bg, #f8d7da);
    }

    .upload-area.disabled:hover {
      border-color: var(--color-danger, #dc3545);
      background: var(--color-danger-bg, #f8d7da);
    }

    .upload-progress {
      margin-top: 1rem;
      padding: 0.75rem;
      background: var(--color-info-bg, #e7f3ff);
      border-radius: 0;
      color: var(--color-info-text, #004085);
    }

    .upload-warning {
      margin-bottom: 1rem;
      padding: 0.75rem;
      background: var(--color-danger-bg, #f8d7da);
      border: 1px solid var(--color-danger, #f5c6cb);
      border-radius: 0;
      color: var(--color-danger-text, #721c24);
      font-size: 0.875rem;
    }

    .photos-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-top: 1rem;
    }

    .photo-item {
      position: relative;
      border-radius: 0;
      overflow: hidden;
      background: var(--color-background);
      aspect-ratio: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.45rem;
      cursor: move;
      transition:
        transform 0.2s,
        box-shadow 0.2s;
    }

    .photo-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }

    .photo-item.dragging {
      opacity: 0;
    }

    .photo-item.drag-over {
      border: 2px solid var(--color-primary, #007bff);
      box-shadow: 0 0 10px rgba(0, 123, 255, 0.3);
      background: rgba(0, 123, 255, 0.05);
    }

    .photo-item img {
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
      object-fit: contain;
      display: block;
    }

    .photo-overlay {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      opacity: 0;
      transition: opacity 0.2s;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 0.5rem;
    }

    .photo-item:hover .photo-overlay {
      opacity: 1;
    }

    .photo-overlay button {
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
      flex-shrink: 0;
    }

    .cover-badge {
      position: absolute;
      top: 0.5rem;
      left: 0.5rem;
      background: rgba(0, 123, 255, 0.9);
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 0;
      font-size: 0.625rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  `;

  @property({ type: String })
  albumId: string | null = null;

  @state()
  private album: Partial<Album> = {
    title: '',
    subtitle: '',
    description: '',
    visibility: 'public',
    allow_downloads: true,
    order: 0,
    photos: [],
  };

  @state()
  private loading = true;

  @state()
  private saving = false;

  @state()
  private uploading = false;

  @state()
  private error = '';

  @state()
  private success = '';

  @state()
  private dragging = false;

  @state()
  private draggedPhotoId: string | null = null;

  @state()
  private dragOverPhotoId: string | null = null;

  @state()
  private siteConfig: SiteConfig | null = null;

  @state()
  private availableSpace: number | null = null;

  @state()
  private totalSpace: number | null = null;

  @state()
  private usagePercent: number | null = null;

  connectedCallback() {
    super.connectedCallback();
    void this.loadData();
  }

  private async loadData() {
    await Promise.all([this.loadSiteConfig(), this.loadAlbumIfNeeded(), this.loadStorageStats()]);
  }

  private async loadSiteConfig() {
    try {
      this.siteConfig = await fetchSiteConfig();
    } catch (err) {
      console.error('Failed to load site config:', err);
    }
  }

  private async loadStorageStats() {
    try {
      const response = await fetch('/api/admin/storage/stats', {
        credentials: 'include',
      });

      // Retry if auth not ready yet
      if (response.status === 401 || response.status === 403) {
        console.debug('Album editor: storage stats auth not ready, will retry in 1s');
        setTimeout(() => void this.loadStorageStats(), 1000);
        return;
      }

      if (response.ok) {
        const stats = (await response.json()) as {
          available_bytes: number;
          total_bytes: number;
          usage_percent: number;
        };
        this.availableSpace = stats.available_bytes;
        this.totalSpace = stats.total_bytes;
        this.usagePercent = stats.usage_percent;
      }
    } catch (err) {
      console.error('Failed to load storage stats:', err);
    }
  }

  private async loadAlbumIfNeeded() {
    if (this.albumId && this.albumId !== 'new') {
      await this.loadAlbum();
    } else {
      this.loading = false;
    }
  }

  private async loadAlbum() {
    if (!this.albumId || this.albumId === 'new') return;

    this.loading = true;
    this.error = '';

    try {
      this.album = await fetchAlbumById(this.albumId);
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to load album';
    } finally {
      this.loading = false;
    }
  }

  private async handleSubmit(e: Event) {
    e.preventDefault();
    this.saving = true;
    this.error = '';
    this.success = '';

    try {
      if (this.albumId && this.albumId !== 'new') {
        // Update existing album
        await updateAlbum(this.albumId, this.album);

        this.success = 'Album updated successfully';
      } else {
        // Create new album
        const newAlbum = await createAlbum({
          title: this.album.title!,
          subtitle: this.album.subtitle,
          description: this.album.description,
          visibility: this.album.visibility!,
          allow_downloads: this.album.allow_downloads,
          order: this.album.order,
        });

        // Redirect to edit page to upload photos
        window.location.href = `/admin/albums/${newAlbum.id}/edit`;
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to save album';
    } finally {
      this.saving = false;
    }
  }

  private handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      void this.uploadFiles(Array.from(input.files));
    }
  }

  private handleDragOver(e: DragEvent) {
    e.preventDefault();
    this.dragging = true;
  }

  private handleDragLeave() {
    this.dragging = false;
  }

  private handleDrop(e: DragEvent) {
    e.preventDefault();
    this.dragging = false;

    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      void this.uploadFiles(Array.from(e.dataTransfer.files));
    }
  }

  private async uploadFiles(files: File[]) {
    if (!this.albumId || this.albumId === 'new') {
      this.error = 'Please save the album first before uploading photos';
      return;
    }

    // Validate file sizes before uploading
    const maxSizeMB = this.siteConfig?.storage?.max_image_size_mb || 50;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const oversizedFiles = files.filter((file) => file.size > maxSizeBytes);

    if (oversizedFiles.length > 0) {
      const fileList = oversizedFiles
        .map((f) => `${f.name} (${this.formatBytes(f.size)})`)
        .join(', ');
      this.error = `${oversizedFiles.length} file(s) exceed the maximum size of ${maxSizeMB}MB: ${fileList}`;
      return;
    }

    this.uploading = true;
    this.error = '';
    this.success = '';

    try {
      const result = await uploadPhotos(this.albumId, files);

      // Reload album to show new photos and refresh storage stats
      await Promise.all([this.loadAlbum(), this.loadStorageStats()]);

      // Handle results based on success/failure counts
      const uploadedCount = result.uploaded.length;
      const errorCount = result.errors.length;
      const totalFiles = uploadedCount + errorCount;

      if (uploadedCount === 0 && errorCount > 0) {
        // All uploads failed
        this.error = `All ${errorCount} upload(s) failed:\n${result.errors.join('\n')}`;
      } else if (uploadedCount > 0 && errorCount > 0) {
        // Partial success
        this.success = `Uploaded ${uploadedCount} of ${totalFiles} photo(s)`;
        this.error = `${errorCount} upload(s) failed:\n${result.errors.join('\n')}`;
      } else if (uploadedCount > 0) {
        // All succeeded
        this.success = `Successfully uploaded ${uploadedCount} photo(s)`;
      } else {
        // No files processed (shouldn't happen)
        this.error = 'No files were processed';
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Upload failed';
    } finally {
      this.uploading = false;
    }
  }

  private async handleDeletePhoto(photoId: string) {
    if (!this.albumId || !confirm('Delete this photo?')) return;

    try {
      await deletePhoto(this.albumId, photoId);
      await this.loadAlbum();
      this.success = 'Photo deleted';
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to delete photo';
    }
  }

  private async handleSetCover(photoId: string) {
    if (!this.albumId) return;

    try {
      await setCoverPhoto(this.albumId, photoId);
      await this.loadAlbum();
      this.success = 'Cover photo updated';
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to set cover';
    }
  }

  // Drag-and-drop handlers for photo reordering
  private handlePhotoDragStart(e: DragEvent, photoId: string) {
    // Stop propagation to prevent file upload drag handler from triggering
    e.stopPropagation();

    this.draggedPhotoId = photoId;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', photoId);
    }
  }

  private handlePhotoDragEnd(e: DragEvent) {
    e.stopPropagation();
    this.draggedPhotoId = null;
    this.dragOverPhotoId = null;
  }

  private handlePhotoDragOver(e: DragEvent, photoId: string) {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }

    if (this.draggedPhotoId && this.draggedPhotoId !== photoId) {
      this.dragOverPhotoId = photoId;
    }
  }

  private handlePhotoDragLeave(e: DragEvent, photoId: string) {
    e.stopPropagation();

    if (this.dragOverPhotoId === photoId) {
      this.dragOverPhotoId = null;
    }
  }

  private async handlePhotoDrop(e: DragEvent, targetPhotoId: string) {
    e.preventDefault();
    e.stopPropagation();

    this.dragOverPhotoId = null;

    if (!this.draggedPhotoId || !this.albumId || this.draggedPhotoId === targetPhotoId) {
      return;
    }

    const draggedId = this.draggedPhotoId;
    this.draggedPhotoId = null;

    // Find the indices of the dragged and target photos
    const photos = this.album.photos || [];
    const draggedIndex = photos.findIndex((p) => p.id === draggedId);
    const targetIndex = photos.findIndex((p) => p.id === targetPhotoId);

    if (draggedIndex === -1 || targetIndex === -1) {
      return;
    }

    // Reorder photos array
    const newPhotos = [...photos];
    const [draggedPhoto] = newPhotos.splice(draggedIndex, 1);
    newPhotos.splice(targetIndex, 0, draggedPhoto);

    // Update local state immediately for responsive UX
    this.album = { ...this.album, photos: newPhotos };

    // Save to backend
    try {
      const photoIds = newPhotos.map((p) => p.id);
      await reorderPhotos(this.albumId, photoIds);
      this.success = 'Photos reordered';

      // Clear success message after 2 seconds
      setTimeout(() => {
        this.success = '';
      }, 2000);
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to reorder photos';
      // Reload album to revert to saved state
      await this.loadAlbum();
    }
  }

  private updateField<K extends keyof Album>(field: K, value: Album[K]) {
    this.album = { ...this.album, [field]: value };
  }

  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  private isUploadDisabled(): boolean {
    if (
      this.usagePercent === null ||
      this.siteConfig === null ||
      this.siteConfig.storage === undefined
    ) {
      return false; // Don't disable if we don't have the data yet
    }

    const maxPercent = this.siteConfig.storage.max_disk_usage_percent || 80;
    return this.usagePercent >= maxPercent;
  }

  private getUploadDisabledMessage(): string | null {
    if (!this.isUploadDisabled()) return null;

    const maxPercent = this.siteConfig?.storage?.max_disk_usage_percent || 80;
    return `Uploads disabled: Disk usage is at ${this.usagePercent?.toFixed(
      1
    )}%, exceeding the ${maxPercent}% limit. Please free up space or increase the limit in settings.`;
  }

  render() {
    const siteTitle = this.siteConfig?.site?.title || 'Photography Portfolio';

    if (this.loading) {
      return html`
        <admin-header .siteTitle=${siteTitle} currentPage="albums"></admin-header>
        <div class="container"><div class="loading">Loading...</div></div>
      `;
    }

    const isNew = this.albumId === 'new' || !this.albumId;

    return html`
      <admin-header .siteTitle=${siteTitle} currentPage="albums"></admin-header>

      <div class="page-header">
        <h1 class="page-title">${isNew ? 'Create Album' : 'Edit Album'}</h1>
      </div>

      <div class="container">
        <form @submit=${(e: Event) => this.handleSubmit(e)}>
          <div class="form-section">
            <h2>Album Details</h2>

            <div class="form-group">
              <label for="title">Title *</label>
              <input
                type="text"
                id="title"
                .value=${this.album.title || ''}
                @input=${(e: Event) =>
                  this.updateField('title', (e.target as HTMLInputElement).value)}
                required
              />
            </div>

            <div class="form-group">
              <label for="subtitle">Subtitle</label>
              <input
                type="text"
                id="subtitle"
                .value=${this.album.subtitle || ''}
                @input=${(e: Event) =>
                  this.updateField('subtitle', (e.target as HTMLInputElement).value)}
              />
            </div>

            <div class="form-group">
              <label for="description">Description</label>
              <textarea
                id="description"
                .value=${this.album.description || ''}
                @input=${(e: Event) =>
                  this.updateField('description', (e.target as HTMLTextAreaElement).value)}
              ></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="visibility">Visibility</label>
                <select
                  id="visibility"
                  .value=${this.album.visibility || 'public'}
                  @change=${(e: Event) => {
                    const select = e.target as HTMLSelectElement;
                    const value = select.value as 'public' | 'unlisted' | 'password_protected';
                    this.updateField('visibility', value);
                  }}
                >
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="password_protected">Password Protected</option>
                </select>
              </div>

              <div class="form-group">
                <label for="order">Display Order</label>
                <input
                  type="number"
                  id="order"
                  .value=${String(this.album.order || 0)}
                  @input=${(e: Event) =>
                    this.updateField('order', Number((e.target as HTMLInputElement).value))}
                />
              </div>
            </div>

            <div class="form-group">
              <div class="checkbox-group">
                <input
                  type="checkbox"
                  id="allow_downloads"
                  .checked=${this.album.allow_downloads ?? true}
                  @change=${(e: Event) =>
                    this.updateField('allow_downloads', (e.target as HTMLInputElement).checked)}
                />
                <label for="allow_downloads">Allow downloads</label>
              </div>
            </div>
          </div>

          <div class="form-section">
            <button type="submit" class="btn btn-primary" ?disabled=${this.saving}>
              ${this.saving ? 'Saving...' : isNew ? 'Create Album' : 'Save Changes'}
            </button>
          </div>
        </form>

        ${!isNew
          ? html`
              <div class="form-section">
                <h2>Photos (${this.album.photos?.length || 0})</h2>

                ${this.getUploadDisabledMessage()
                  ? html`<div class="upload-warning">${this.getUploadDisabledMessage()}</div>`
                  : ''}

                <div class="photo-upload">
                  <div
                    class="upload-area ${this.dragging ? 'dragging' : ''} ${this.isUploadDisabled()
                      ? 'disabled'
                      : ''}"
                    @click=${() => {
                      if (this.isUploadDisabled()) return;
                      const input = this.shadowRoot?.querySelector(
                        'input[type="file"]'
                      ) as HTMLInputElement;
                      input?.click();
                    }}
                    @dragover=${(e: DragEvent) => {
                      if (this.isUploadDisabled()) {
                        e.preventDefault();
                        return;
                      }
                      this.handleDragOver(e);
                    }}
                    @dragleave=${() => this.handleDragLeave()}
                    @drop=${(e: DragEvent) => {
                      if (this.isUploadDisabled()) {
                        e.preventDefault();
                        return;
                      }
                      this.handleDrop(e);
                    }}
                  >
                    <p>Drag photos here or click to browse</p>
                    <p style="font-size: 0.875rem; color: var(--color-text-secondary, #666);">
                      Up to ${this.siteConfig?.storage?.max_image_size_mb || 50}MB each
                      ${this.availableSpace !== null
                        ? html` • ${this.formatBytes(this.availableSpace)} available`
                        : ''}
                    </p>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    style="display: none;"
                    ?disabled=${this.isUploadDisabled()}
                    @change=${(e: Event) => this.handleFileSelect(e)}
                  />
                </div>

                ${this.uploading
                  ? html`<div class="upload-progress">Uploading photos...</div>`
                  : ''}
                ${this.album.photos && this.album.photos.length > 0
                  ? html`
                      <div class="photos-grid">
                        ${this.album.photos.map(
                          (photo) => html`
                            <div
                              class="photo-item ${this.draggedPhotoId === photo.id
                                ? 'dragging'
                                : ''} ${this.dragOverPhotoId === photo.id ? 'drag-over' : ''}"
                              draggable="true"
                              @dragstart=${(e: DragEvent) => this.handlePhotoDragStart(e, photo.id)}
                              @dragend=${(e: DragEvent) => this.handlePhotoDragEnd(e)}
                              @dragover=${(e: DragEvent) => this.handlePhotoDragOver(e, photo.id)}
                              @dragleave=${(e: DragEvent) => this.handlePhotoDragLeave(e, photo.id)}
                              @drop=${(e: DragEvent) => this.handlePhotoDrop(e, photo.id)}
                            >
                              ${photo.id === this.album.cover_photo_id
                                ? html`<span class="cover-badge">COVER</span>`
                                : ''}
                              <img src=${photo.url_thumbnail} alt=${photo.alt_text || ''} />
                              <div class="photo-overlay">
                                ${photo.id !== this.album.cover_photo_id
                                  ? html`
                                      <button
                                        class="btn btn-primary"
                                        type="button"
                                        @click=${() => this.handleSetCover(photo.id)}
                                      >
                                        Set Cover
                                      </button>
                                    `
                                  : ''}
                                <button
                                  class="btn btn-danger"
                                  type="button"
                                  @click=${() => this.handleDeletePhoto(photo.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          `
                        )}
                      </div>
                    `
                  : ''}
              </div>
            `
          : ''}
      </div>

      <toast-notification
        .message=${this.success}
        .type=${'success'}
        .visible=${!!this.success}
        @toast-close=${() => {
          this.success = '';
        }}
      ></toast-notification>

      <toast-notification
        .message=${this.error}
        .type=${'error'}
        .visible=${!!this.error}
        @toast-close=${() => {
          this.error = '';
        }}
      ></toast-notification>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'admin-album-editor-page': AdminAlbumEditorPage;
  }
}
