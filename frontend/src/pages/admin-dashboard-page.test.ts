import { expect, fixture, html } from '@open-wc/testing';
import { afterEach, beforeEach, describe, it } from 'vitest';
import './admin-dashboard-page';
import type { AdminDashboardPage } from './admin-dashboard-page';

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should render the component', async () => {
    const el = await fixture<AdminDashboardPage>(
      html`<admin-dashboard-page></admin-dashboard-page>`
    );

    expect(el).to.exist;
    expect(el.tagName.toLowerCase()).to.equal('admin-dashboard-page');
  });

  // Note: Testing API calls requires module mocking that's incompatible with current test setup.
  // The fetchAllAlbums() and fetchSiteConfig() functions are tested in api.test.ts and admin-api.test.ts

  it('should render admin header with site title', async () => {
    const el = await fixture<AdminDashboardPage>(
      html`<admin-dashboard-page></admin-dashboard-page>`
    );
    await el.updateComplete;
    await new Promise((resolve) => setTimeout(resolve, 100));

    const header = el.shadowRoot?.querySelector('admin-header');
    expect(header).to.exist;
    expect(header?.getAttribute('currentPage')).to.equal('dashboard');
  });
});
