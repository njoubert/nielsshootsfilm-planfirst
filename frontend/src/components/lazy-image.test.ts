import { expect, fixture, html } from '@open-wc/testing';
import * as sinon from 'sinon';
import { beforeEach, describe, it } from 'vitest';
import './lazy-image';
import type { LazyImage } from './lazy-image';

describe('LazyImage', () => {
  // Mock IntersectionObserver
  let mockObserve: sinon.SinonSpy;
  let mockDisconnect: sinon.SinonSpy;
  let mockCallback: IntersectionObserverCallback;

  beforeEach(() => {
    mockObserve = sinon.spy();
    mockDisconnect = sinon.spy();

    // Create IntersectionObserver mock
    global.IntersectionObserver = class MockIntersectionObserver {
      constructor(callback: IntersectionObserverCallback) {
        mockCallback = callback;
      }
      observe = mockObserve;
      disconnect = mockDisconnect;
      unobserve = sinon.spy();
      takeRecords = sinon.spy();
      root = null;
      rootMargin = '50px';
      thresholds = [0];
    } as unknown as typeof IntersectionObserver;
  });

  it('should render the component', async () => {
    const el = await fixture<LazyImage>(html`<lazy-image src="/test.jpg" alt="Test"></lazy-image>`);

    expect(el).to.exist;
    expect(el.tagName.toLowerCase()).to.equal('lazy-image');
  });

  it('should setup IntersectionObserver on mount', async () => {
    await fixture<LazyImage>(html`<lazy-image src="/test.jpg" alt="Test"></lazy-image>`);

    expect(mockObserve).to.have.been.called;
  });

  it('should render placeholder initially', async () => {
    const el = await fixture<LazyImage>(html`<lazy-image src="/test.jpg" alt="Test"></lazy-image>`);
    const placeholder = el.shadowRoot?.querySelector('.placeholder');

    expect(placeholder).to.exist;
  });

  it('should render image with loading class initially', async () => {
    const el = await fixture<LazyImage>(html`<lazy-image src="/test.jpg" alt="Test"></lazy-image>`);
    const img = el.shadowRoot?.querySelector('img');

    expect(img).to.exist;
    expect(img?.classList.contains('loading')).to.be.true;
    expect(img?.getAttribute('src')).to.equal('/test.jpg');
    expect(img?.getAttribute('alt')).to.equal('Test');
  });

  it('should apply custom aspect ratio', async () => {
    const el = await fixture<LazyImage>(
      html`<lazy-image src="/test.jpg" alt="Test" aspectRatio="4/3"></lazy-image>`
    );
    const container = el.shadowRoot?.querySelector('.container');
    const style = container?.getAttribute('style');

    expect(style).to.include('--aspect-ratio: 4/3');
  });

  it('should use default 16/9 aspect ratio', async () => {
    const el = await fixture<LazyImage>(html`<lazy-image src="/test.jpg" alt="Test"></lazy-image>`);
    const container = el.shadowRoot?.querySelector('.container');
    const style = container?.getAttribute('style');

    expect(style).to.include('--aspect-ratio: 16/9');
  });

  it('should trigger image load when intersecting', async () => {
    const el = await fixture<LazyImage>(html`<lazy-image src="/test.jpg" alt="Test"></lazy-image>`);

    // Simulate intersection
    mockCallback(
      [
        {
          isIntersecting: true,
          target: el,
          boundingClientRect: {} as DOMRectReadOnly,
          intersectionRatio: 1,
          intersectionRect: {} as DOMRectReadOnly,
          rootBounds: null,
          time: 0,
        } as IntersectionObserverEntry,
      ],
      {} as IntersectionObserver
    );

    // Give image time to attempt loading (it will fail in jsdom but we can check the attempt)
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Should have disconnected observer after intersecting
    expect(mockDisconnect).to.have.been.called;
  });

  it('should not trigger load when not intersecting', async () => {
    await fixture<LazyImage>(html`<lazy-image src="/test.jpg" alt="Test"></lazy-image>`);

    // Simulate non-intersection
    mockCallback(
      [
        {
          isIntersecting: false,
          target: document.createElement('div'),
          boundingClientRect: {} as DOMRectReadOnly,
          intersectionRatio: 0,
          intersectionRect: {} as DOMRectReadOnly,
          rootBounds: null,
          time: 0,
        } as IntersectionObserverEntry,
      ],
      {} as IntersectionObserver
    );

    // Should not disconnect observer
    expect(mockDisconnect).not.to.have.been.called;
  });

  it('should disconnect observer on unmount', async () => {
    const el = await fixture<LazyImage>(html`<lazy-image src="/test.jpg" alt="Test"></lazy-image>`);

    el.remove();

    expect(mockDisconnect).to.have.been.called;
  });

  it('should handle empty src', async () => {
    const el = await fixture<LazyImage>(html`<lazy-image src="" alt="Test"></lazy-image>`);
    const img = el.shadowRoot?.querySelector('img');

    expect(img).to.exist;
    expect(img?.getAttribute('src')).to.equal('');
  });

  it('should render container with correct structure', async () => {
    const el = await fixture<LazyImage>(html`<lazy-image src="/test.jpg" alt="Test"></lazy-image>`);
    const container = el.shadowRoot?.querySelector('.container');

    expect(container).to.exist;
    expect(container?.tagName.toLowerCase()).to.equal('div');
  });
});
