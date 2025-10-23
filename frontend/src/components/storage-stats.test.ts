/**
 * Tests for storage-stats component
 */

import { fixture, html } from '@open-wc/testing';
import sinon from 'sinon';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import './storage-stats';
import type { StorageStatsComponent } from './storage-stats';

describe('storage-stats', () => {
  let fetchStub: sinon.SinonStub;

  beforeEach(() => {
    fetchStub = sinon.stub(global, 'fetch');
  });

  afterEach(() => {
    fetchStub.restore();
  });

  it('should display loading state initially', async () => {
    // Set up fetch to never resolve (simulate loading)
    fetchStub.returns(new Promise(() => {}));

    const el = await fixture<StorageStatsComponent>(html`<storage-stats></storage-stats>`);
    await el.updateComplete;

    const text = el.shadowRoot?.textContent || '';
    expect(text).to.include('Loading storage statistics');
  });

  it('should fetch and display storage stats', async () => {
    const mockStats = {
      total_bytes: 1099511627776, // 1 TB
      used_bytes: 107374182400, // 100 GB
      available_bytes: 992137445376, // ~900 GB
      usage_percent: 9.77,
      breakdown: {
        originals_bytes: 53687091200, // 50 GB
        display_bytes: 32212254720, // 30 GB
        thumbnails_bytes: 21474836480, // 20 GB
      },
    };

    fetchStub.resolves(
      new Response(JSON.stringify(mockStats), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const el = await fixture<StorageStatsComponent>(html`<storage-stats></storage-stats>`);
    await el.updateComplete;

    // Wait for fetch to complete
    await new Promise((resolve) => setTimeout(resolve, 10));
    await el.updateComplete;

    const text = el.shadowRoot?.textContent || '';
    expect(text).to.include('Storage Usage');
    expect(text).to.include('9.8%'); // Usage percent
    expect(text).to.include('100.00 GB'); // Total used
  });

  it('should format bytes correctly', async () => {
    const mockStats = {
      total_bytes: 1073741824, // 1 GB
      used_bytes: 536870912, // 512 MB
      available_bytes: 536870912, // 512 MB
      usage_percent: 50.0,
      breakdown: {
        originals_bytes: 268435456, // 256 MB
        display_bytes: 268435456, // 256 MB
        thumbnails_bytes: 0,
      },
    };

    fetchStub.resolves(
      new Response(JSON.stringify(mockStats), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const el = await fixture<StorageStatsComponent>(html`<storage-stats></storage-stats>`);
    await el.updateComplete;
    await new Promise((resolve) => setTimeout(resolve, 10));
    await el.updateComplete;

    const text = el.shadowRoot?.textContent || '';
    expect(text).to.include('512.00 MB'); // Total used
    expect(text).to.include('256.00 MB'); // Originals
  });

  it('should display warning banner when provided', async () => {
    const mockStats = {
      total_bytes: 1073741824,
      used_bytes: 966367641, // 90%
      available_bytes: 107374182,
      usage_percent: 90.0,
      breakdown: {
        originals_bytes: 322122547,
        display_bytes: 322122547,
        thumbnails_bytes: 322122547,
      },
      warning: {
        level: 'warning',
        message: 'Disk usage is at 90.0%, approaching the limit of 80%',
      },
    };

    fetchStub.resolves(
      new Response(JSON.stringify(mockStats), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const el = await fixture<StorageStatsComponent>(html`<storage-stats></storage-stats>`);
    await el.updateComplete;
    await new Promise((resolve) => setTimeout(resolve, 10));
    await el.updateComplete;

    const warningBanner = el.shadowRoot?.querySelector('.warning-banner');
    expect(warningBanner).to.exist;
    expect(warningBanner?.textContent).to.include('Disk usage is at 90.0%');
    expect(warningBanner?.classList.contains('warning')).to.be.true;
  });

  it('should display critical warning banner', async () => {
    const mockStats = {
      total_bytes: 1073741824,
      used_bytes: 966367641, // 90%
      available_bytes: 107374182,
      usage_percent: 90.0,
      breakdown: {
        originals_bytes: 322122547,
        display_bytes: 322122547,
        thumbnails_bytes: 322122547,
      },
      warning: {
        level: 'critical',
        message: 'Disk usage is at 90.0%, exceeding the limit of 80%',
      },
    };

    fetchStub.resolves(
      new Response(JSON.stringify(mockStats), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const el = await fixture<StorageStatsComponent>(html`<storage-stats></storage-stats>`);
    await el.updateComplete;
    await new Promise((resolve) => setTimeout(resolve, 10));
    await el.updateComplete;

    const warningBanner = el.shadowRoot?.querySelector('.warning-banner');
    expect(warningBanner).to.exist;
    expect(warningBanner?.classList.contains('critical')).to.be.true;
  });

  it('should handle fetch error', async () => {
    fetchStub.resolves(
      new Response('Not Found', {
        status: 404,
        statusText: 'Not Found',
      })
    );

    const el = await fixture<StorageStatsComponent>(html`<storage-stats></storage-stats>`);
    await el.updateComplete;
    await new Promise((resolve) => setTimeout(resolve, 10));
    await el.updateComplete;

    const text = el.shadowRoot?.textContent || '';
    expect(text).to.include('Error');
    expect(text).to.include('404');
  });

  it('should handle invalid JSON response', async () => {
    fetchStub.resolves(
      new Response('<html>Not JSON</html>', {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      })
    );

    const el = await fixture<StorageStatsComponent>(html`<storage-stats></storage-stats>`);
    await el.updateComplete;
    await new Promise((resolve) => setTimeout(resolve, 10));
    await el.updateComplete;

    const text = el.shadowRoot?.textContent || '';
    expect(text).to.include('Error');
    expect(text).to.include('invalid response format');
  });

  it('should refresh stats when refresh button is clicked', async () => {
    const mockStats = {
      total_bytes: 1073741824,
      used_bytes: 536870912,
      available_bytes: 536870912,
      usage_percent: 50.0,
      breakdown: {
        originals_bytes: 268435456,
        display_bytes: 268435456,
        thumbnails_bytes: 0,
      },
    };

    fetchStub.resolves(
      new Response(JSON.stringify(mockStats), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const el = await fixture<StorageStatsComponent>(html`<storage-stats></storage-stats>`);
    await el.updateComplete;
    await new Promise((resolve) => setTimeout(resolve, 10));
    await el.updateComplete;

    // Reset stub and set new response
    fetchStub.resetHistory();
    const updatedStats = { ...mockStats, used_bytes: 644245094 }; // Updated usage
    fetchStub.resolves(
      new Response(JSON.stringify(updatedStats), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    // Click refresh button
    const refreshBtn = el.shadowRoot?.querySelector('.refresh-btn') as HTMLButtonElement;
    expect(refreshBtn).to.exist;
    refreshBtn?.click();

    await new Promise((resolve) => setTimeout(resolve, 10));
    await el.updateComplete;

    // Verify fetch was called again
    expect(fetchStub.callCount).to.equal(1);
  });

  it('should apply correct usage level classes', async () => {
    // Test low usage (< 60%)
    const lowUsageStats = {
      total_bytes: 1073741824,
      used_bytes: 536870912,
      available_bytes: 536870912,
      usage_percent: 50.0,
      breakdown: {
        originals_bytes: 268435456,
        display_bytes: 268435456,
        thumbnails_bytes: 0,
      },
    };

    fetchStub.resolves(
      new Response(JSON.stringify(lowUsageStats), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const el = await fixture<StorageStatsComponent>(html`<storage-stats></storage-stats>`);
    await el.updateComplete;
    await new Promise((resolve) => setTimeout(resolve, 10));
    await el.updateComplete;

    const usageBar = el.shadowRoot?.querySelector('.usage-bar-fill');
    expect(usageBar?.classList.contains('low')).to.be.true;
  });

  it('should show all breakdown categories', async () => {
    const mockStats = {
      total_bytes: 1073741824,
      used_bytes: 536870912,
      available_bytes: 536870912,
      usage_percent: 50.0,
      breakdown: {
        originals_bytes: 268435456,
        display_bytes: 214748364,
        thumbnails_bytes: 53687091,
      },
    };

    fetchStub.resolves(
      new Response(JSON.stringify(mockStats), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const el = await fixture<StorageStatsComponent>(html`<storage-stats></storage-stats>`);
    await el.updateComplete;
    await new Promise((resolve) => setTimeout(resolve, 10));
    await el.updateComplete;

    const text = el.shadowRoot?.textContent || '';
    expect(text).to.include('Originals');
    expect(text).to.include('Display');
    expect(text).to.include('Thumbnails');
    expect(text).to.include('Full resolution files');
    expect(text).to.include('Web-optimized versions');
    expect(text).to.include('Preview images');
  });

  it('should display reserved space with correct percentage', async () => {
    const mockStats = {
      total_bytes: 1000000000000, // 1 TB
      used_bytes: 100000000000, // 100 GB
      available_bytes: 900000000000, // 900 GB
      reserved_bytes: 200000000000, // 200 GB (20%)
      usable_bytes: 700000000000, // 700 GB
      reserved_percent: 20, // 20% reserved (80% max usage)
      usage_percent: 10.0,
      breakdown: {
        originals_bytes: 50000000000,
        display_bytes: 30000000000,
        thumbnails_bytes: 20000000000,
      },
      warning: undefined,
    };

    fetchStub.resolves(
      new Response(JSON.stringify(mockStats), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const el = await fixture<StorageStatsComponent>(html`<storage-stats></storage-stats>`);
    await el.updateComplete;
    await new Promise((resolve) => setTimeout(resolve, 10));
    await el.updateComplete;

    const text = el.shadowRoot?.textContent || '';

    // Should show reserved space section
    expect(text).to.include('RESERVED SPACE');
    expect(text).to.include('186.26 GB'); // 200 GB formatted
    expect(text).to.include('20% kept in reserve');

    // Should show usable space section
    expect(text).to.include('USABLE SPACE');
    expect(text).to.include('651.91 GB'); // 700 GB formatted
    expect(text).to.include('Available for uploads');
  });

  it('should display reserved space bar correctly', async () => {
    const mockStats = {
      total_bytes: 1000000000000,
      used_bytes: 100000000000,
      available_bytes: 900000000000,
      reserved_bytes: 200000000000,
      usable_bytes: 700000000000,
      reserved_percent: 20,
      usage_percent: 10.0,
      breakdown: {
        originals_bytes: 50000000000,
        display_bytes: 30000000000,
        thumbnails_bytes: 20000000000,
      },
    };

    fetchStub.resolves(
      new Response(JSON.stringify(mockStats), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const el = await fixture<StorageStatsComponent>(html`<storage-stats></storage-stats>`);
    await el.updateComplete;
    await new Promise((resolve) => setTimeout(resolve, 10));
    await el.updateComplete;

    const reservedBar = el.shadowRoot?.querySelector('.usage-bar-reserved') as HTMLElement;
    expect(reservedBar).to.exist;
    expect(reservedBar.style.width).to.equal('20%');
    expect(reservedBar.title).to.include('Reserved space');
    expect(reservedBar.title).to.include('20%');
  });

  it('should handle different reserved percentages', async () => {
    const testCases = [
      { reserved_percent: 5, max_usage: 95 },
      { reserved_percent: 20, max_usage: 80 },
      { reserved_percent: 50, max_usage: 50 },
    ];

    for (const testCase of testCases) {
      fetchStub.resetHistory();

      const mockStats = {
        total_bytes: 1000000000000,
        used_bytes: 100000000000,
        available_bytes: 900000000000,
        reserved_bytes: testCase.reserved_percent * 10000000000, // 10GB per percent
        usable_bytes: 900000000000 - testCase.reserved_percent * 10000000000,
        reserved_percent: testCase.reserved_percent,
        usage_percent: 10.0,
        breakdown: {
          originals_bytes: 50000000000,
          display_bytes: 30000000000,
          thumbnails_bytes: 20000000000,
        },
      };

      fetchStub.resolves(
        new Response(JSON.stringify(mockStats), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const el = await fixture<StorageStatsComponent>(html`<storage-stats></storage-stats>`);
      await el.updateComplete;
      await new Promise((resolve) => setTimeout(resolve, 10));
      await el.updateComplete;

      const text = el.shadowRoot?.textContent || '';
      expect(text).to.include(`${testCase.reserved_percent}% kept in reserve`);

      const reservedBar = el.shadowRoot?.querySelector('.usage-bar-reserved') as HTMLElement;
      expect(reservedBar?.style.width).to.equal(`${testCase.reserved_percent}%`);
    }
  });

  it('should show usable bytes as available minus reserved', async () => {
    const mockStats = {
      total_bytes: 1000000000000, // 1 TB
      used_bytes: 100000000000, // 100 GB used
      available_bytes: 900000000000, // 900 GB available
      reserved_bytes: 200000000000, // 200 GB reserved
      usable_bytes: 700000000000, // 700 GB usable (available - reserved)
      reserved_percent: 20,
      usage_percent: 10.0,
      breakdown: {
        originals_bytes: 50000000000,
        display_bytes: 30000000000,
        thumbnails_bytes: 20000000000,
      },
    };

    fetchStub.resolves(
      new Response(JSON.stringify(mockStats), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const el = await fixture<StorageStatsComponent>(html`<storage-stats></storage-stats>`);
    await el.updateComplete;
    await new Promise((resolve) => setTimeout(resolve, 10));
    await el.updateComplete;

    // Verify the calculation: usable should be available - reserved
    // 900 GB - 200 GB = 700 GB
    const text = el.shadowRoot?.textContent || '';
    expect(text).to.include('USABLE SPACE');
    expect(text).to.include('651.91 GB'); // 700 GB formatted
  });
});
