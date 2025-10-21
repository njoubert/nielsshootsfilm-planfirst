import { expect, fixture, html } from '@open-wc/testing';
import * as sinon from 'sinon';
import { afterEach, beforeEach, describe, it } from 'vitest';
import type { Album, SiteConfig } from '../types/data-models';
import * as adminApi from '../utils/admin-api';
import * as api from '../utils/api';
import './admin-settings-page';
import type { AdminSettingsPage } from './admin-settings-page';

describe('AdminSettingsPage', () => {
  let fetchSiteConfigStub: sinon.SinonStub;
  let mockConfig: SiteConfig;
  let mockAlbums: Album[];

  beforeEach(() => {
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
      social: {
        instagram: 'testuser',
        youtube: '@testchannel',
      },
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
        main_album_id: 'album-1',
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

    mockAlbums = [
      {
        id: 'album-1',
        slug: 'album-1',
        title: 'Portfolio Album',
        subtitle: '',
        description: '',
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
        visibility: 'public',
        allow_downloads: true,
        is_portfolio_album: false,
        order: 0,
        photos: [],
      },
    ];

    fetchSiteConfigStub = sinon.stub(api, 'fetchSiteConfig').resolves(mockConfig);
    sinon.stub(adminApi, 'updateSiteConfig').resolves(mockConfig);
    sinon.stub(adminApi, 'changePassword').resolves();
    sinon.stub(adminApi, 'fetchAllAlbums').resolves(mockAlbums);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should render the component', async () => {
    const el = await fixture<AdminSettingsPage>(html`<admin-settings-page></admin-settings-page>`);

    expect(el).to.exist;
    expect(el.tagName.toLowerCase()).to.equal('admin-settings-page');
  });

  it('should load site config on mount', async () => {
    await fixture<AdminSettingsPage>(html`<admin-settings-page></admin-settings-page>`);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(fetchSiteConfigStub).to.have.been.called;
  });

  it('should display site title in form', async () => {
    const el = await fixture<AdminSettingsPage>(html`<admin-settings-page></admin-settings-page>`);
    await new Promise((resolve) => setTimeout(resolve, 50));

    const titleInput = el.shadowRoot?.querySelector('input[name="site.title"]') as HTMLInputElement;
    expect(titleInput).to.exist;
    expect(titleInput.value).to.equal('Test Portfolio');
  });

  it('should display social media fields', async () => {
    const el = await fixture<AdminSettingsPage>(html`<admin-settings-page></admin-settings-page>`);
    await new Promise((resolve) => setTimeout(resolve, 50));

    const instagramInput = el.shadowRoot?.querySelector(
      'input[name="social.instagram"]'
    ) as HTMLInputElement;
    expect(instagramInput).to.exist;
    expect(instagramInput.value).to.equal('testuser');
  });

  it('should render admin header with settings tab active', async () => {
    const el = await fixture<AdminSettingsPage>(html`<admin-settings-page></admin-settings-page>`);
    await new Promise((resolve) => setTimeout(resolve, 50));

    const header = el.shadowRoot?.querySelector('admin-header');
    expect(header).to.exist;
    expect(header?.getAttribute('activeTab')).to.equal('settings');
  });
});
