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
      html`<photo-lightbox
        .photos=${mockPhotos}
        .showExif=${true}
        open
        currentIndex=${1}
      ></photo-lightbox>`
    );
    const counter = el.shadowRoot?.querySelector('.photo-counter');

    expect(counter?.textContent).to.equal('2 of 3');
  });

  it('should render close button', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${mockPhotos} open></photo-lightbox>`
    );
    const closeButton = el.shadowRoot?.querySelector('.close-button');

    expect(closeButton).to.exist;
    // Close button uses SVG icon, not text
    expect(closeButton?.querySelector('svg')).to.exist;
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

  it('should wrap to last photo when going prev from first', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${mockPhotos} open currentIndex=${0}></photo-lightbox>`
    );

    el.prev();
    await el.updateComplete;

    expect(el.currentIndex).to.equal(2); // Wraps to last photo
  });

  it('should wrap to first photo when going next from last', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${mockPhotos} open currentIndex=${2}></photo-lightbox>`
    );

    el.next();
    await el.updateComplete;

    expect(el.currentIndex).to.equal(0); // Wraps to first photo
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

  it('should not render EXIF panel when showExif is false', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${mockPhotos} open></photo-lightbox>`
    );
    const exifPanel = el.shadowRoot?.querySelector('.exif-panel');

    // No EXIF panel should be rendered when showExif is false
    expect(exifPanel).to.not.exist;
  });

  it('should render EXIF panel when showExif is true', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${mockPhotos} .showExif=${true} open></photo-lightbox>`
    );
    const exifPanel = el.shadowRoot?.querySelector('.exif-panel');
    const photoCounter = el.shadowRoot?.querySelector('.photo-counter');

    // Panel exists with photo counter
    expect(exifPanel).to.exist;
    expect(photoCounter).to.exist;
    expect(photoCounter?.textContent).to.include('1 of 3');
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

  it('should display EXIF data when showExif is true', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${mockPhotos} .showExif=${true} open></photo-lightbox>`
    );
    const exifPanel = el.shadowRoot?.querySelector('.exif-panel');
    const exifItems = el.shadowRoot?.querySelectorAll('.exif-item');

    // Panel exists and has EXIF items
    expect(exifPanel).to.exist;
    expect(exifItems?.length).to.be.greaterThan(0);
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

  it('should disable page zoom to prevent crashes when opened', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${mockPhotos}></photo-lightbox>`
    );

    // Open the lightbox
    el.open = true;
    await el.updateComplete;

    // Viewport meta should disable page-level zoom to prevent crashes
    // but image zoom is still enabled via CSS touch-action: pinch-zoom
    const viewport = document.querySelector('meta[name="viewport"]');
    expect(viewport).to.exist;
    const content = viewport?.getAttribute('content');
    expect(content).to.include('user-scalable=no');
    expect(content).to.include('maximum-scale=1.0');
  });

  it('should maintain zoom settings when closed', async () => {
    const el = await fixture<PhotoLightbox>(
      html`<photo-lightbox .photos=${mockPhotos} open></photo-lightbox>`
    );

    // Close the lightbox
    el.open = false;
    await el.updateComplete;

    // Viewport meta should still allow zoom
    const viewport = document.querySelector('meta[name="viewport"]');
    const content = viewport?.getAttribute('content');
    expect(content).to.include('user-scalable=yes');
    expect(content).to.include('maximum-scale=5.0');
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
