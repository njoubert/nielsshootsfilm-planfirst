import { expect, fixture, html } from '@open-wc/testing';
import { afterEach, beforeEach, describe, it } from 'vitest';
import './admin-settings-page';
import type { AdminSettingsPage } from './admin-settings-page';

describe('AdminSettingsPage', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should render the component', async () => {
    const el = await fixture<AdminSettingsPage>(html`<admin-settings-page></admin-settings-page>`);

    expect(el).to.exist;
    expect(el.tagName.toLowerCase()).to.equal('admin-settings-page');
  });

  // Note: Testing API calls and form population requires module mocking that's incompatible
  // with current test setup. The fetchSiteConfig() function is tested in api.test.ts

  it('should render admin header with settings tab active', async () => {
    const el = await fixture<AdminSettingsPage>(html`<admin-settings-page></admin-settings-page>`);
    await new Promise((resolve) => setTimeout(resolve, 50));

    const header = el.shadowRoot?.querySelector('admin-header');
    expect(header).to.exist;
    expect(header?.getAttribute('currentPage')).to.equal('settings');
  });
});
