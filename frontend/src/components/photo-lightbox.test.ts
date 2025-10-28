import { expect, fixture, html } from '@open-wc/testing';
import sinon from 'sinon';
import { beforeEach, describe, it, vi } from 'vitest';
import type { Photo } from '../types/data-models';
import './photo-lightbox';
import type { PhotoLightbox } from './photo-lightbox';

describe('PhotoLightbox', () => {
  const mockPhotos: Photo[] = [
    {
      id: 'photo-1',
      filename_original: 'test1.jpg',
      url_original: '/originals/test1.jpg',
      url_display: '/display/test1.jpg',
      url_thumbnail: '/thumbnails/test1.jpg',
      caption: 'Test photo 1',
      alt_text: 'First test image',
      order: 0,
      width: 1920,
      height: 1080,
      file_size_original: 2048000,
      file_size_display: 1024000,
      file_size_thumbnail: 102400,
      uploaded_at: '2025-01-01T00:00:00Z',
      exif: {
        camera: 'Canon EOS R5',
        lens: 'RF 24-70mm f/2.8',
        iso: 400,
        aperture: 'f/2.8',
        shutter_speed: '1/125',
        focal_length: '50mm',
      },
    },
    {
      id: 'photo-2',
      filename_original: 'test2.jpg',
      url_original: '/originals/test2.jpg',
      url_display: '/display/test2.jpg',
      url_thumbnail: '/thumbnails/test2.jpg',
      caption: 'Test photo 2',
      alt_text: 'Second test image',
      order: 1,
      width: 1080,
      height: 1920,
      file_size_original: 2048000,
      file_size_display: 1024000,
      file_size_thumbnail: 102400,
      uploaded_at: '2025-01-02T00:00:00Z',
    },
    {
      id: 'photo-3',
      filename_original: 'test3.jpg',
      url_original: '/originals/test3.jpg',
      url_display: '/display/test3.jpg',
      url_thumbnail: '/thumbnails/test3.jpg',
      caption: 'Test photo 3',
      order: 2,
      width: 1920,
      height: 1280,
      file_size_original: 2048000,
      file_size_display: 1024000,
      file_size_thumbnail: 102400,
      uploaded_at: '2025-01-03T00:00:00Z',
    },
  ];

  beforeEach(() => {
    // Clean up any event listeners from previous tests
    vi.clearAllMocks();
  });

  it('should render the component', async () => {
    const el = await fixture<PhotoLightbox>(html`<photo-lightbox></photo-lightbox>`);

    expect(el).to.exist;
    expect(el.tagName.toLowerCase()).to.equal('photo-lightbox');
  });

  it('should not render when closed', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${mockPhotos}></photo-lightbox>`
    );
    const lightbox = el.shadowRoot?.querySelector('.lightbox');

    expect(lightbox).to.not.exist;
  });

  it('should render when open', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${mockPhotos} open></photo-lightbox>`
    );
    const lightbox = el.shadowRoot?.querySelector('.lightbox');

    expect(lightbox).to.exist;
  });

  it('should not render when no photos', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${[]} open></photo-lightbox>`
    );
    const lightbox = el.shadowRoot?.querySelector('.lightbox');

    expect(lightbox).to.not.exist;
  });

  it('should display current photo', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${mockPhotos} open></photo-lightbox>`
    );
    const img = el.shadowRoot?.querySelector('img');

    expect(img?.getAttribute('src')).to.equal('/display/test1.jpg');
    expect(img?.getAttribute('alt')).to.equal('First test image');
  });

  it('should display photo counter', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${mockPhotos} open currentIndex=${1}></photo-lightbox>`
    );
    const counter = el.shadowRoot?.querySelector('.photo-counter');

    expect(counter?.textContent).to.equal('2 / 3');
  });

  it('should render close button', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${mockPhotos} open></photo-lightbox>`
    );
    const closeButton = el.shadowRoot?.querySelector('.close-button');

    expect(closeButton).to.exist;
    expect(closeButton?.textContent).to.equal('×');
  });

  it('should close when close button clicked', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${mockPhotos} open></photo-lightbox>`
    );
    const closeButton = el.shadowRoot?.querySelector('.close-button') as HTMLButtonElement;

    closeButton.click();
    await el.updateComplete;

    expect(el.open).to.be.false;
  });

  it('should dispatch close event when closing', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${mockPhotos} open></photo-lightbox>`
    );

    let eventFired = false;
    el.addEventListener('close', () => {
      eventFired = true;
    });

    el.close();

    expect(eventFired).to.be.true;
  });

  it('should render prev and next buttons', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${mockPhotos} open currentIndex=${1}></photo-lightbox>`
    );
    const prevButton = el.shadowRoot?.querySelector('.nav-button.prev');
    const nextButton = el.shadowRoot?.querySelector('.nav-button.next');

    expect(prevButton).to.exist;
    expect(nextButton).to.exist;
  });

  it('should disable prev button on first photo', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${mockPhotos} open currentIndex=${0}></photo-lightbox>`
    );
    const prevButton = el.shadowRoot?.querySelector('.nav-button.prev') as HTMLButtonElement;

    expect(prevButton.disabled).to.be.true;
  });

  it('should disable next button on last photo', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${mockPhotos} open currentIndex=${2}></photo-lightbox>`
    );
    const nextButton = el.shadowRoot?.querySelector('.nav-button.next') as HTMLButtonElement;

    expect(nextButton.disabled).to.be.true;
  });

  it('should navigate to next photo', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${mockPhotos} open currentIndex=${0}></photo-lightbox>`
    );

    el.next();
    await el.updateComplete;

    expect(el.currentIndex).to.equal(1);
  });

  it('should navigate to previous photo', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${mockPhotos} open currentIndex=${1}></photo-lightbox>`
    );

    el.prev();
    await el.updateComplete;

    expect(el.currentIndex).to.equal(0);
  });

  it('should not go beyond first photo', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${mockPhotos} open currentIndex=${0}></photo-lightbox>`
    );

    el.prev();
    await el.updateComplete;

    expect(el.currentIndex).to.equal(0);
  });

  it('should not go beyond last photo', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${mockPhotos} open currentIndex=${2}></photo-lightbox>`
    );

    el.next();
    await el.updateComplete;

    expect(el.currentIndex).to.equal(2);
  });

  it('should handle keyboard Escape to close', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${mockPhotos} open></photo-lightbox>`
    );

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(event);
    await el.updateComplete;

    expect(el.open).to.be.false;
  });

  it('should handle keyboard ArrowLeft for previous', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${mockPhotos} open currentIndex=${1}></photo-lightbox>`
    );

    const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
    document.dispatchEvent(event);
    await el.updateComplete;

    expect(el.currentIndex).to.equal(0);
  });

  it('should handle keyboard ArrowRight for next', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${mockPhotos} open currentIndex=${0}></photo-lightbox>`
    );

    const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    document.dispatchEvent(event);
    await el.updateComplete;

    expect(el.currentIndex).to.equal(1);
  });

  it('should not handle keyboard when closed', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${mockPhotos} currentIndex=${0}></photo-lightbox>`
    );

    const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    document.dispatchEvent(event);
    await el.updateComplete;

    expect(el.currentIndex).to.equal(0);
  });

  it('should not render EXIF panel by default', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${mockPhotos} open></photo-lightbox>`
    );
    const exifPanel = el.shadowRoot?.querySelector('.exif-panel');

    expect(exifPanel).to.not.exist;
  });

  it('should render EXIF panel when showExif is true', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${mockPhotos} open showExif></photo-lightbox>`
    );
    const exifPanel = el.shadowRoot?.querySelector('.exif-panel');

    expect(exifPanel).to.exist;
  });

  it('should display EXIF data', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${mockPhotos} open showExif></photo-lightbox>`
    );
    const exifItems = el.shadowRoot?.querySelectorAll('.exif-item');

    expect(exifItems?.length).to.be.greaterThan(0);
  });

  it('should reserve EXIF space when photo has no EXIF data', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${mockPhotos} open showExif currentIndex=${1}></photo-lightbox>`
    );
    const exifPanel = el.shadowRoot?.querySelector('.exif-panel');

    expect(exifPanel).to.exist;
    expect(exifPanel?.classList.contains('empty')).to.be.true;
    expect(exifPanel?.textContent?.trim()).to.equal('');
  });

  it('should fallback to caption when no alt_text', async () => {
    const photoWithoutAlt = { ...mockPhotos[1], alt_text: undefined };
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${[photoWithoutAlt]} open></photo-lightbox>`
    );
    const img = el.shadowRoot?.querySelector('img');

    expect(img?.getAttribute('alt')).to.equal('Test photo 2');
  });

  it('should fallback to "Photo" when no alt_text or caption', async () => {
    const photoWithoutText = { ...mockPhotos[0], alt_text: undefined, caption: undefined };
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${[photoWithoutText]} open></photo-lightbox>`
    );
    const img = el.shadowRoot?.querySelector('img');

    expect(img?.getAttribute('alt')).to.equal('Photo');
  });

  it('should handle touch swipe left for next', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${mockPhotos} open currentIndex=${0}></photo-lightbox>`
    );
    const container = el.shadowRoot?.querySelector('.photo-container') as HTMLElement;

    // Simulate swipe left (touchStartX > touchEndX)
    const touchStart = new TouchEvent('touchstart', {
      changedTouches: [{ screenX: 200 } as Touch],
    });
    const touchEnd = new TouchEvent('touchend', {
      changedTouches: [{ screenX: 100 } as Touch],
    });

    container.dispatchEvent(touchStart);
    container.dispatchEvent(touchEnd);
    await el.updateComplete;

    expect(el.currentIndex).to.equal(1);
  });

  it('should handle touch swipe right for previous', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${mockPhotos} open currentIndex=${1}></photo-lightbox>`
    );
    const container = el.shadowRoot?.querySelector('.photo-container') as HTMLElement;

    // Simulate swipe right (touchStartX < touchEndX)
    const touchStart = new TouchEvent('touchstart', {
      changedTouches: [{ screenX: 100 } as Touch],
    });
    const touchEnd = new TouchEvent('touchend', {
      changedTouches: [{ screenX: 200 } as Touch],
    });

    container.dispatchEvent(touchStart);
    container.dispatchEvent(touchEnd);
    await el.updateComplete;

    expect(el.currentIndex).to.equal(0);
  });

  it('should ignore small touch movements', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${mockPhotos} open currentIndex=${1}></photo-lightbox>`
    );
    const container = el.shadowRoot?.querySelector('.photo-container') as HTMLElement;

    // Simulate small swipe (less than threshold)
    const touchStart = new TouchEvent('touchstart', {
      changedTouches: [{ screenX: 100 } as Touch],
    });
    const touchEnd = new TouchEvent('touchend', {
      changedTouches: [{ screenX: 120 } as Touch],
    });

    container.dispatchEvent(touchStart);
    container.dispatchEvent(touchEnd);
    await el.updateComplete;

    expect(el.currentIndex).to.equal(1);
  });

  it('should not navigate on multi-touch swipe', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${mockPhotos} open currentIndex=${1}></photo-lightbox>`
    );
    const container = el.shadowRoot?.querySelector('.photo-container') as HTMLElement;

    // Create proper TouchList mocks
    const createTouchList = (touches: Touch[]): TouchList => {
      return Object.assign(touches, {
        item: (index: number) => touches[index],
      }) as unknown as TouchList;
    };

    // Simulate multi-touch start (pinch gesture with 2 fingers)
    const touchStart = new TouchEvent('touchstart', {
      touches: createTouchList([{ screenX: 100 } as Touch, { screenX: 200 } as Touch]),
      changedTouches: createTouchList([{ screenX: 100 } as Touch]),
    } as unknown as TouchEventInit);

    // Simulate multi-touch end (still has one finger down)
    const touchEnd = new TouchEvent('touchend', {
      touches: createTouchList([{ screenX: 150 } as Touch]),
      changedTouches: createTouchList([{ screenX: 50 } as Touch]),
    } as unknown as TouchEventInit);

    container.dispatchEvent(touchStart);
    container.dispatchEvent(touchEnd);
    await el.updateComplete;

    // Index should not change - multi-touch should be ignored
    expect(el.currentIndex).to.equal(1);
  });

  it('should ignore multi-touch on image tap', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${mockPhotos} open currentIndex=${1}></photo-lightbox>`
    );
    const img = el.shadowRoot?.querySelector('img') as HTMLElement;

    // Create proper TouchList mocks
    const createTouchList = (touches: Touch[]): TouchList => {
      return Object.assign(touches, {
        item: (index: number) => touches[index],
      }) as unknown as TouchList;
    };

    // Simulate multi-touch start
    const touchStart = new TouchEvent('touchstart', {
      touches: createTouchList([{ screenX: 100 } as Touch, { screenX: 200 } as Touch]),
      changedTouches: createTouchList([{ screenX: 100 } as Touch]),
    } as unknown as TouchEventInit);

    // Simulate multi-touch end with quick tap timing
    const touchEnd = new TouchEvent('touchend', {
      touches: createTouchList([{ screenX: 150 } as Touch]),
      changedTouches: createTouchList([{ screenX: 101 } as Touch]), // Very close to start
    } as unknown as TouchEventInit);

    img.dispatchEvent(touchStart);
    // Simulate quick tap (less than 300ms)
    await new Promise((resolve) => setTimeout(resolve, 50));
    img.dispatchEvent(touchEnd);
    await el.updateComplete;

    // Index should not change - multi-touch should be ignored
    expect(el.currentIndex).to.equal(1);
  });

  it('should update image when currentIndex changes', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${mockPhotos} open currentIndex=${0}></photo-lightbox>`
    );

    el.currentIndex = 1;
    await el.updateComplete;

    const img = el.shadowRoot?.querySelector('img');
    expect(img?.getAttribute('src')).to.equal('/display/test2.jpg');
  });

  it('should clean up keyboard listener on disconnect', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${mockPhotos} open></photo-lightbox>`
    );

    const removeEventListenerSpy = sinon.spy(document, 'removeEventListener');

    el.disconnectedCallback();

    expect(removeEventListenerSpy).to.have.been.calledOnce;

    removeEventListenerSpy.restore();
  });

  it('should disable body scroll when opened', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${mockPhotos}></photo-lightbox>`
    );

    // Initially closed, body should have normal overflow
    expect(document.body.style.overflow).to.equal('');

    // Open the lightbox
    el.open = true;
    await el.updateComplete;

    // Body should have overflow hidden
    expect(document.body.style.overflow).to.equal('hidden');
  });

  it('should re-enable body scroll when closed', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${mockPhotos} open></photo-lightbox>`
    );

    // Should start with overflow hidden when open
    expect(document.body.style.overflow).to.equal('hidden');

    // Close the lightbox
    el.open = false;
    await el.updateComplete;

    // Body should have normal overflow restored
    expect(document.body.style.overflow).to.equal('');
  });

  it('should disable mobile zoom when opened', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${mockPhotos}></photo-lightbox>`
    );

    // Open the lightbox
    el.open = true;
    await el.updateComplete;

    // Viewport meta should disable zoom
    const viewport = document.querySelector('meta[name="viewport"]');
    expect(viewport).to.exist;
    const content = viewport?.getAttribute('content');
    expect(content).to.include('user-scalable=no');
    expect(content).to.include('maximum-scale=1.0');
  });

  it('should re-enable mobile zoom when closed', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${mockPhotos} open></photo-lightbox>`
    );

    // Close the lightbox
    el.open = false;
    await el.updateComplete;

    // Viewport meta should re-enable zoom
    const viewport = document.querySelector('meta[name="viewport"]');
    const content = viewport?.getAttribute('content');
    expect(content).to.not.include('user-scalable=no');
    expect(content).to.not.include('maximum-scale=1.0');
  });

  it('should clean up body styles on disconnect when open', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${mockPhotos} open></photo-lightbox>`
    );

    // Body should have overflow hidden when open
    expect(document.body.style.overflow).to.equal('hidden');

    // Disconnect the component while it's open
    el.disconnectedCallback();

    // Body overflow should be restored
    expect(document.body.style.overflow).to.equal('');
  });
});
