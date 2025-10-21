import { expect, fixture, html } from '@open-wc/testing';
import * as sinon from 'sinon';
import { afterEach, beforeEach, describe, it } from 'vitest';
import type { Album, SiteConfig } from '../types/data-models';
import * as adminApi from '../utils/admin-api';
import * as api from '../utils/api';
import './admin-dashboard-page';
import type { AdminDashboardPage } from './admin-dashboard-page';

describe('AdminDashboardPage', () => {
  let fetchAllAlbumsStub: sinon.SinonStub;
  let fetchSiteConfigStub: sinon.SinonStub;
  let mockAlbums: Album[];
  let mockConfig: SiteConfig;

  beforeEach(() => {
    mockAlbums = [
      {
        id: 'album-1',
        slug: 'album-1',
        title: 'Public Album',
        subtitle: '',
        description: '',
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
        visibility: 'public',
        allow_downloads: true,
        is_portfolio_album: false,
        order: 0,
        photos: [
          {
            id: 'photo-1',
            filename_original: 'test1.jpg',
            url_original: '/originals/test1.jpg',
            url_display: '/display/test1.jpg',
            url_thumbnail: '/thumbnails/test1.jpg',
            order: 0,
            width: 1920,
            height: 1080,
            file_size_original: 2048000,
            file_size_display: 1024000,
            file_size_thumbnail: 102400,
            uploaded_at: '2025-01-01T00:00:00Z',
          },
        ],
      },
      {
        id: 'album-2',
        slug: 'album-2',
        title: 'Private Album',
        subtitle: '',
        description: '',
        created_at: '2025-01-02',
        updated_at: '2025-01-02',
        visibility: 'unlisted',
        allow_downloads: false,
        is_portfolio_album: false,
        order: 1,
        photos: [
          {
            id: 'photo-2',
            filename_original: 'test2.jpg',
            url_original: '/originals/test2.jpg',
            url_display: '/display/test2.jpg',
            url_thumbnail: '/thumbnails/test2.jpg',
            order: 0,
            width: 1920,
            height: 1080,
            file_size_original: 2048000,
            file_size_display: 1024000,
            file_size_thumbnail: 102400,
            uploaded_at: '2025-01-02T00:00:00Z',
          },
        ],
      },
    ];

    mockConfig = {
      version: '1.0',
      last_updated: '2025-01-01',
      site: {
        title: 'Test Portfolio',
        tagline: 'Photography',
        description: 'Test',
        language: 'en',
        timezone: 'UTC',
      },
      owner: {
        name: 'Test Photographer',
        bio: 'Bio',
        email: 'test@example.com',
      },
      social: {},
      branding: {
        primary_color: '#000000',
        secondary_color: '#ffffff',
        accent_color: '#ff0000',
        theme: {
          mode: 'system',
          light: {
            background: '#fff',
            surface: '#fff',
            text_primary: '#000',
            text_secondary: '#666',
            border: '#ccc',
          },
          dark: {
            background: '#000',
            surface: '#111',
            text_primary: '#fff',
            text_secondary: '#aaa',
            border: '#333',
          },
        },
      },
      portfolio: {
        main_album_id: '',
        show_exif_data: false,
        enable_lightbox: true,
      },
      navigation: {
        show_home: true,
        show_albums: true,
        show_about: true,
        show_contact: true,
      },
      features: {},
    };

    fetchAllAlbumsStub = sinon.stub(adminApi, 'fetchAllAlbums').resolves(mockAlbums);
    fetchSiteConfigStub = sinon.stub(api, 'fetchSiteConfig').resolves(mockConfig);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should render the component', async () => {
    const el = await fixture<AdminDashboardPage>(
      html`<admin-dashboard-page></admin-dashboard-page>`
    );

    expect(el).to.exist;
    expect(el.tagName.toLowerCase()).to.equal('admin-dashboard-page');
  });

  it('should load albums and config on mount', async () => {
    await fixture<AdminDashboardPage>(html`<admin-dashboard-page></admin-dashboard-page>`);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(fetchAllAlbumsStub).to.have.been.called;
    expect(fetchSiteConfigStub).to.have.been.called;
  });

  it('should render admin header with site title', async () => {
    const el = await fixture<AdminDashboardPage>(
      html`<admin-dashboard-page></admin-dashboard-page>`
    );
    await new Promise((resolve) => setTimeout(resolve, 50));

    const header = el.shadowRoot?.querySelector('admin-header');
    expect(header).to.exist;
    expect(header?.getAttribute('activeTab')).to.equal('dashboard');
  });
});
