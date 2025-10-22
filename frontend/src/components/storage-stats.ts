/**
 * Storage stats component - displays disk usage information in the admin dashboard.
 * Shows total used space, breakdown by type, usage percentage with visual bar.
 * Displays warning banner if within 10% of max or over limit.
 */

import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface StorageStats {
  total_bytes: number;
  used_bytes: number;
  available_bytes: number;
  reserved_bytes: number;
  usable_bytes: number;
  reserved_percent: number;
  usage_percent: number;
  breakdown: {
    originals_bytes: number;
    display_bytes: number;
    thumbnails_bytes: number;
  };
  warning?: {
    level: string; // 'warning' | 'critical'
    message: string;
  };
}

@customElement('storage-stats')
export class StorageStatsComponent extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .stats-card {
      background: var(--color-surface, white);
      border: 1px solid var(--color-border, #ddd);
      border-radius: 8px;
      padding: 1.5rem;
    }

    .stats-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .stats-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--color-text-primary, #333);
    }

    .refresh-btn {
      padding: 0.5rem 1rem;
      background: var(--color-border, #ddd);
      color: var(--color-text-primary, #333);
      border: none;
      border-radius: 4px;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .refresh-btn:hover {
      background: var(--color-border, #ccc);
      transform: scale(1.05);
    }

    .refresh-btn:active {
      transform: scale(0.98);
    }

    .warning-banner {
      padding: 1rem;
      margin-bottom: 1rem;
      border-radius: 4px;
      font-size: 0.875rem;
      line-height: 1.4;
    }

    .warning-banner.warning {
      background: #fff3cd;
      border: 1px solid #ffc107;
      color: #856404;
    }

    .warning-banner.critical {
      background: #f8d7da;
      border: 1px solid #dc3545;
      color: #721c24;
    }

    .usage-bar-container {
      margin: 1rem 0;
    }

    .usage-bar-label {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
      color: var(--color-text-secondary, #666);
    }

    .usage-bar {
      width: 100%;
      height: 24px;
      background: var(--color-border, #e0e0e0);
      border-radius: 4px;
      overflow: hidden;
      position: relative;
      display: flex;
    }

    .usage-bar-fill {
      height: 100%;
      transition:
        width 0.3s ease,
        background-color 0.3s ease;
    }

    .usage-bar-reserved {
      height: 100%;
      margin-left: auto;
      background: repeating-linear-gradient(45deg, #d0d0d0, #d0d0d0 4px, #e8e8e8 4px, #e8e8e8 8px);
      border-left: 1px solid #b0b0b0;
    }

    .usage-bar-fill.low {
      background: linear-gradient(90deg, #28a745, #20c997);
    }

    .usage-bar-fill.medium {
      background: linear-gradient(90deg, #ffc107, #fd7e14);
    }

    .usage-bar-fill.high {
      background: linear-gradient(90deg, #dc3545, #c82333);
    }

    .storage-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-top: 1.5rem;
    }

    .detail-item {
      padding: 1rem;
      background: var(--color-background, #f8f9fa);
      border-radius: 4px;
    }

    .detail-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--color-text-secondary, #666);
      margin-bottom: 0.5rem;
    }

    .detail-value {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-text-primary, #333);
    }

    .detail-subtext {
      font-size: 0.75rem;
      color: var(--color-text-secondary, #666);
      margin-top: 0.25rem;
    }

    .loading {
      text-align: center;
      padding: 2rem;
      color: var(--color-text-secondary, #666);
    }

    .error {
      padding: 1rem;
      background: #f8d7da;
      border: 1px solid #dc3545;
      color: #721c24;
      border-radius: 4px;
      font-size: 0.875rem;
    }
  `;

  @state()
  private stats: StorageStats | null = null;

  @state()
  private loading = true;

  @state()
  private error: string | null = null;

  connectedCallback() {
    super.connectedCallback();
    void this.fetchStats();
  }

  private async fetchStats() {
    this.loading = true;
    this.error = null;

    try {
      const response = await fetch('/api/admin/storage/stats', {
        credentials: 'include',
      });

      // Check content type before reading body
      const contentType = response.headers.get('content-type');
      const isJson = contentType?.includes('application/json');

      // For auth errors, fail silently and retry after a delay
      // This handles the race condition where component mounts before auth is verified
      if (response.status === 401 || response.status === 403) {
        console.debug('Storage stats: auth not ready yet, will retry in 1s');
        this.loading = false;
        setTimeout(() => void this.fetchStats(), 1000);
        return;
      }

      // Read the response body once
      const text = await response.text();

      if (!response.ok) {
        console.error('Storage stats error response:', {
          status: response.status,
          statusText: response.statusText,
          contentType,
          body: text.substring(0, 200),
        });
        throw new Error(`Failed to load storage stats (${response.status})`);
      }

      // If response is not JSON, something went wrong
      if (!isJson) {
        console.error('Unexpected response type:', {
          contentType,
          body: text.substring(0, 200),
        });
        throw new Error('Server returned invalid response format');
      }

      // Parse the JSON
      try {
        this.stats = JSON.parse(text) as StorageStats;
      } catch (parseErr) {
        console.error('Failed to parse storage stats JSON:', {
          error: parseErr,
          body: text.substring(0, 200),
        });
        throw new Error('Invalid JSON response from server');
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to fetch storage stats';
      console.error('Error fetching storage stats:', err);
    } finally {
      this.loading = false;
    }
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

  private getUsageLevel(percent: number): string {
    if (percent >= 80) return 'high';
    if (percent >= 60) return 'medium';
    return 'low';
  }

  render() {
    if (this.loading) {
      return html`
        <div class="stats-card">
          <div class="loading">Loading storage statistics...</div>
        </div>
      `;
    }

    if (this.error) {
      return html`
        <div class="stats-card">
          <div class="error">Error: ${this.error}</div>
        </div>
      `;
    }

    if (!this.stats) {
      return html`<div class="stats-card"><div class="error">No data available</div></div>`;
    }

    const usageLevel = this.getUsageLevel(this.stats.usage_percent);

    return html`
      <div class="stats-card">
        <div class="stats-header">
          <h2 class="stats-title">Storage Usage</h2>
          <button class="refresh-btn" @click=${() => this.fetchStats()}>Refresh</button>
        </div>

        ${this.stats.warning
          ? html`
              <div class="warning-banner ${this.stats.warning.level}">
                ${this.stats.warning.message}
              </div>
            `
          : ''}

        <div class="usage-bar-container">
          <div class="usage-bar-label">
            <span>Disk Usage</span>
            <span><strong>${this.stats.usage_percent.toFixed(1)}%</strong></span>
          </div>
          <div class="usage-bar">
            <div
              class="usage-bar-fill ${usageLevel}"
              style="width: ${this.stats.usage_percent}%"
            ></div>
            <div
              class="usage-bar-reserved"
              style="width: ${this.stats.reserved_percent}%"
              title="Reserved space (${this.stats.reserved_percent}%)"
            ></div>
          </div>
        </div>

        <div class="storage-details">
          <div class="detail-item">
            <div class="detail-label">Total Used</div>
            <div class="detail-value">${this.formatBytes(this.stats.used_bytes)}</div>
            <div class="detail-subtext">Uploads directory</div>
          </div>

          <div class="detail-item">
            <div class="detail-label">Usable Space</div>
            <div class="detail-value">${this.formatBytes(this.stats.usable_bytes)}</div>
            <div class="detail-subtext">Available for uploads</div>
          </div>

          <div class="detail-item">
            <div class="detail-label">Reserved Space</div>
            <div class="detail-value">${this.formatBytes(this.stats.reserved_bytes)}</div>
            <div class="detail-subtext">${this.stats.reserved_percent}% kept in reserve</div>
          </div>

          <div class="detail-item">
            <div class="detail-label">Originals</div>
            <div class="detail-value">
              ${this.formatBytes(this.stats.breakdown.originals_bytes)}
            </div>
            <div class="detail-subtext">Full resolution files</div>
          </div>

          <div class="detail-item">
            <div class="detail-label">Display</div>
            <div class="detail-value">${this.formatBytes(this.stats.breakdown.display_bytes)}</div>
            <div class="detail-subtext">Web-optimized versions</div>
          </div>

          <div class="detail-item">
            <div class="detail-label">Thumbnails</div>
            <div class="detail-value">
              ${this.formatBytes(this.stats.breakdown.thumbnails_bytes)}
            </div>
            <div class="detail-subtext">Preview images</div>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'storage-stats': StorageStatsComponent;
  }
}
