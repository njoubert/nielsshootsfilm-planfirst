import { expect, fixture, html } from '@open-wc/testing';
import { describe, it } from 'vitest';
import type { Photo } from '../types/data-models';
import './album-cover-hero';
import type { AlbumCoverHero } from './album-cover-hero';

describe('AlbumCoverHero', () => {
  const mockPhoto: Photo = {
    id: 'photo-1',
    filename_original: 'test.jpg',
    url_original: '/originals/test.jpg',
    url_display: '/display/test.jpg',
    url_thumbnail: '/thumbnails/test.jpg',
    caption: 'Test photo',
    alt_text: 'A test image',
    order: 0,
    width: 1920,
    height: 1080,
    file_size_original: 2048000,
    file_size_display: 1024000,
    file_size_thumbnail: 102400,
    uploaded_at: '2025-01-01T00:00:00Z',
  };

  it('should render the component', async () => {
    const el = await fixture<AlbumCoverHero>(html`<album-cover-hero></album-cover-hero>`);

    expect(el).to.exist;
    expect(el.tagName.toLowerCase()).to.equal('album-cover-hero');
  });

  it('should render title', async () => {
    const el = await fixture<AlbumCoverHero>(
      html`<album-cover-hero title="Test Album"></album-cover-hero>`
    );
    const title = el.shadowRoot?.querySelector('.title');

    expect(title).to.exist;
    expect(title?.textContent).to.equal('Test Album');
  });

  it('should render subtitle when provided', async () => {
    const el = await fixture<AlbumCoverHero>(
      html`<album-cover-hero title="Test" subtitle="Test Subtitle"></album-cover-hero>`
    );
    const subtitle = el.shadowRoot?.querySelector('.subtitle');

    expect(subtitle).to.exist;
    expect(subtitle?.textContent).to.equal('Test Subtitle');
  });

  it('should not render subtitle when not provided', async () => {
    const el = await fixture<AlbumCoverHero>(
      html`<album-cover-hero title="Test"></album-cover-hero>`
    );
    const subtitle = el.shadowRoot?.querySelector('.subtitle');

    expect(subtitle).to.not.exist;
  });

  it('should render cover photo when provided', async () => {
    const el = await fixture<AlbumCoverHero>(
      html`<album-cover-hero title="Test" .coverPhoto=${mockPhoto}></album-cover-hero>`
    );
    const background = el.shadowRoot?.querySelector('.background');
    const img = el.shadowRoot?.querySelector('.background img');

    expect(background).to.exist;
    expect(img).to.exist;
    expect(img?.getAttribute('src')).to.equal('/display/test.jpg');
  });

  it('should use photo alt_text for img alt attribute', async () => {
    const el = await fixture<AlbumCoverHero>(
      html`<album-cover-hero title="Test" .coverPhoto=${mockPhoto}></album-cover-hero>`
    );
    const img = el.shadowRoot?.querySelector('.background img');

    expect(img?.getAttribute('alt')).to.equal('A test image');
  });

  it('should fallback to title for img alt when no alt_text', async () => {
    const photoWithoutAlt = { ...mockPhoto, alt_text: undefined };
    const el = await fixture<AlbumCoverHero>(
      html`<album-cover-hero title="Album Title" .coverPhoto=${photoWithoutAlt}></album-cover-hero>`
    );
    const img = el.shadowRoot?.querySelector('.background img');

    expect(img?.getAttribute('alt')).to.equal('Album Title');
  });

  it('should render overlay when photo is present', async () => {
    const el = await fixture<AlbumCoverHero>(
      html`<album-cover-hero title="Test" .coverPhoto=${mockPhoto}></album-cover-hero>`
    );
    const overlay = el.shadowRoot?.querySelector('.overlay');

    expect(overlay).to.exist;
  });

  it('should not render background when no photo provided', async () => {
    const el = await fixture<AlbumCoverHero>(
      html`<album-cover-hero title="Test"></album-cover-hero>`
    );
    const background = el.shadowRoot?.querySelector('.background');
    const overlay = el.shadowRoot?.querySelector('.overlay');

    expect(background).to.not.exist;
    expect(overlay).to.not.exist;
  });

  it('should render scroll indicator', async () => {
    const el = await fixture<AlbumCoverHero>(
      html`<album-cover-hero title="Test"></album-cover-hero>`
    );
    const scrollIndicator = el.shadowRoot?.querySelector('.scroll-indicator');

    expect(scrollIndicator).to.exist;
    expect(scrollIndicator?.textContent).to.equal('↓');
  });

  it('should render hero container', async () => {
    const el = await fixture<AlbumCoverHero>(
      html`<album-cover-hero title="Test"></album-cover-hero>`
    );
    const hero = el.shadowRoot?.querySelector('.hero');

    expect(hero).to.exist;
  });

  it('should render content section', async () => {
    const el = await fixture<AlbumCoverHero>(
      html`<album-cover-hero title="Test"></album-cover-hero>`
    );
    const content = el.shadowRoot?.querySelector('.content');

    expect(content).to.exist;
  });

  it('should render with both title and subtitle', async () => {
    const el = await fixture<AlbumCoverHero>(
      html`<album-cover-hero
        title="Portfolio"
        subtitle="My Best Work"
        .coverPhoto=${mockPhoto}
      ></album-cover-hero>`
    );
    const title = el.shadowRoot?.querySelector('.title');
    const subtitle = el.shadowRoot?.querySelector('.subtitle');
    const img = el.shadowRoot?.querySelector('.background img');

    expect(title?.textContent).to.equal('Portfolio');
    expect(subtitle?.textContent).to.equal('My Best Work');
    expect(img).to.exist;
  });

  it('should use url_display for image source', async () => {
    const el = await fixture<AlbumCoverHero>(
      html`<album-cover-hero title="Test" .coverPhoto=${mockPhoto}></album-cover-hero>`
    );
    const img = el.shadowRoot?.querySelector('.background img');

    expect(img?.getAttribute('src')).to.equal('/display/test.jpg');
    expect(img?.getAttribute('src')).to.not.equal('/thumbnails/test.jpg');
    expect(img?.getAttribute('src')).to.not.equal('/originals/test.jpg');
  });
});
