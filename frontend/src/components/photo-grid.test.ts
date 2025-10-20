import { expect, fixture, html, oneEvent } from '@open-wc/testing';
import { beforeEach, describe, it, vi } from 'vitest';
import type { Photo } from '../types/data-models';
import './photo-grid';
import type { PhotoGrid } from './photo-grid';

describe('PhotoGrid', () => {
  beforeEach(() => {
    // Mock IntersectionObserver for lazy-image component
    const mockIntersectionObserver = vi.fn();
    mockIntersectionObserver.mockReturnValue({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    });
    vi.stubGlobal('IntersectionObserver', mockIntersectionObserver);
  });
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

  it('should render the component', async () => {
    const el = await fixture<PhotoGrid>(html`<photo-grid></photo-grid>`);

    expect(el).to.exist;
    expect(el.tagName.toLowerCase()).to.equal('photo-grid');
  });

  it('should render grid container', async () => {
    const el = await fixture<PhotoGrid>(html`<photo-grid></photo-grid>`);
    const grid = el.shadowRoot?.querySelector('.grid');

    expect(grid).to.exist;
  });

  it('should render photos in the grid', async () => {
    const el = await fixture<PhotoGrid>(html`<photo-grid .photos=${mockPhotos}></photo-grid>`);
    const photoItems = el.shadowRoot?.querySelectorAll('.photo-item');

    expect(photoItems).to.have.length(3);
  });

  it('should render lazy-image for each photo', async () => {
    const el = await fixture<PhotoGrid>(html`<photo-grid .photos=${mockPhotos}></photo-grid>`);
    const lazyImages = el.shadowRoot?.querySelectorAll('lazy-image');

    expect(lazyImages).to.have.length(3);
  });

  it('should use thumbnail URLs for images', async () => {
    const el = await fixture<PhotoGrid>(html`<photo-grid .photos=${mockPhotos}></photo-grid>`);
    const lazyImages = el.shadowRoot?.querySelectorAll('lazy-image');

    expect(lazyImages?.[0]?.getAttribute('src')).to.equal('/thumbnails/test1.jpg');
    expect(lazyImages?.[1]?.getAttribute('src')).to.equal('/thumbnails/test2.jpg');
    expect(lazyImages?.[2]?.getAttribute('src')).to.equal('/thumbnails/test3.jpg');
  });

  it('should use alt_text for image alt attribute', async () => {
    const el = await fixture<PhotoGrid>(html`<photo-grid .photos=${mockPhotos}></photo-grid>`);
    const lazyImages = el.shadowRoot?.querySelectorAll('lazy-image');

    expect(lazyImages?.[0]?.getAttribute('alt')).to.equal('First test image');
    expect(lazyImages?.[1]?.getAttribute('alt')).to.equal('Second test image');
  });

  it('should fallback to caption when no alt_text', async () => {
    const photoWithoutAlt = { ...mockPhotos[2], alt_text: undefined };
    const el = await fixture<PhotoGrid>(
      html`<photo-grid .photos=${[photoWithoutAlt]}></photo-grid>`
    );
    const lazyImage = el.shadowRoot?.querySelector('lazy-image');

    expect(lazyImage?.getAttribute('alt')).to.equal('Test photo 3');
  });

  it('should fallback to "Photo N" when no alt_text or caption', async () => {
    const photoWithoutText = { ...mockPhotos[0], alt_text: undefined, caption: undefined };
    const el = await fixture<PhotoGrid>(
      html`<photo-grid .photos=${[photoWithoutText]}></photo-grid>`
    );
    const lazyImage = el.shadowRoot?.querySelector('lazy-image');

    expect(lazyImage?.getAttribute('alt')).to.equal('Photo 1');
  });

  it('should apply masonry layout by default', async () => {
    const el = await fixture<PhotoGrid>(html`<photo-grid .photos=${mockPhotos}></photo-grid>`);
    const grid = el.shadowRoot?.querySelector('.grid');

    expect(grid?.classList.contains('masonry')).to.be.true;
    expect(grid?.classList.contains('standard')).to.be.false;
  });

  it('should apply standard layout when layout="grid"', async () => {
    const el = await fixture<PhotoGrid>(
      html`<photo-grid .photos=${mockPhotos} layout="grid"></photo-grid>`
    );
    const grid = el.shadowRoot?.querySelector('.grid');

    expect(grid?.classList.contains('standard')).to.be.true;
    expect(grid?.classList.contains('masonry')).to.be.false;
  });

  it('should apply masonry layout when layout="masonry"', async () => {
    const el = await fixture<PhotoGrid>(
      html`<photo-grid .photos=${mockPhotos} layout="masonry"></photo-grid>`
    );
    const grid = el.shadowRoot?.querySelector('.grid');

    expect(grid?.classList.contains('masonry')).to.be.true;
  });

  it('should set aspect ratio on lazy-image', async () => {
    const el = await fixture<PhotoGrid>(html`<photo-grid .photos=${mockPhotos}></photo-grid>`);
    const lazyImages = el.shadowRoot?.querySelectorAll('lazy-image');

    expect(lazyImages?.[0]?.getAttribute('aspectRatio')).to.equal('1920/1080');
    expect(lazyImages?.[1]?.getAttribute('aspectRatio')).to.equal('1080/1920');
    expect(lazyImages?.[2]?.getAttribute('aspectRatio')).to.equal('1920/1280');
  });

  it('should emit photo-click event when photo is clicked', async () => {
    const el = await fixture<PhotoGrid>(html`<photo-grid .photos=${mockPhotos}></photo-grid>`);
    const photoItem = el.shadowRoot?.querySelectorAll('.photo-item')?.[0] as HTMLElement;

    setTimeout(() => photoItem.click());
    const event: CustomEvent<{ photo: Photo; index: number }> = await oneEvent(el, 'photo-click');

    expect(event).to.exist;
    expect(event.detail.photo).to.deep.equal(mockPhotos[0]);
    expect(event.detail.index).to.equal(0);
  });

  it('should emit correct index when second photo is clicked', async () => {
    const el = await fixture<PhotoGrid>(html`<photo-grid .photos=${mockPhotos}></photo-grid>`);
    const photoItem = el.shadowRoot?.querySelectorAll('.photo-item')?.[1] as HTMLElement;

    setTimeout(() => photoItem.click());
    const event: CustomEvent<{ photo: Photo; index: number }> = await oneEvent(el, 'photo-click');

    expect(event.detail.photo).to.deep.equal(mockPhotos[1]);
    expect(event.detail.index).to.equal(1);
  });

  it('should set composed and bubbles on photo-click event', async () => {
    const el = await fixture<PhotoGrid>(html`<photo-grid .photos=${mockPhotos}></photo-grid>`);
    const photoItem = el.shadowRoot?.querySelectorAll('.photo-item')?.[0] as HTMLElement;

    setTimeout(() => photoItem.click());
    const event = await oneEvent(el, 'photo-click');

    expect(event.bubbles).to.be.true;
    expect(event.composed).to.be.true;
  });

  it('should calculate row span for masonry layout', async () => {
    const el = await fixture<PhotoGrid>(
      html`<photo-grid .photos=${mockPhotos} layout="masonry"></photo-grid>`
    );
    const photoItems = el.shadowRoot?.querySelectorAll('.photo-item');

    // Portrait photo (1080x1920) should have larger row span than landscape (1920x1080)
    const portraitSpan = (photoItems?.[1] as HTMLElement).style.getPropertyValue('--row-span');
    const landscapeSpan = (photoItems?.[0] as HTMLElement).style.getPropertyValue('--row-span');

    expect(parseInt(portraitSpan)).to.be.greaterThan(parseInt(landscapeSpan));
  });

  it('should render empty grid when no photos', async () => {
    const el = await fixture<PhotoGrid>(html`<photo-grid .photos=${[]}></photo-grid>`);
    const photoItems = el.shadowRoot?.querySelectorAll('.photo-item');

    expect(photoItems).to.have.length(0);
  });

  it('should handle single photo', async () => {
    const el = await fixture<PhotoGrid>(html`<photo-grid .photos=${[mockPhotos[0]]}></photo-grid>`);
    const photoItems = el.shadowRoot?.querySelectorAll('.photo-item');

    expect(photoItems).to.have.length(1);
  });
});
