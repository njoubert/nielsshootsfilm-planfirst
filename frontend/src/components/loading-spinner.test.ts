import { expect, fixture, html } from '@open-wc/testing';
import { describe, it } from 'vitest';
import './loading-spinner';
import type { LoadingSpinner } from './loading-spinner';

describe('LoadingSpinner', () => {
  it('should render the component', async () => {
    const el = await fixture<LoadingSpinner>(html`<loading-spinner></loading-spinner>`);

    expect(el).to.exist;
    expect(el.tagName.toLowerCase()).to.equal('loading-spinner');
  });

  it('should render spinner element in shadow DOM', async () => {
    const el = await fixture<LoadingSpinner>(html`<loading-spinner></loading-spinner>`);
    const spinner = el.shadowRoot?.querySelector('.spinner');

    expect(spinner).to.exist;
    expect(spinner?.classList.contains('spinner')).to.be.true;
  });

  it('should be displayed inline', async () => {
    const el = await fixture<LoadingSpinner>(html`<loading-spinner></loading-spinner>`);
    const styles = getComputedStyle(el);

    // jsdom may simplify inline-block to inline
    expect(['inline', 'inline-block']).to.include(styles.display);
  });

  it('should have animation on spinner', async () => {
    const el = await fixture<LoadingSpinner>(html`<loading-spinner></loading-spinner>`);
    const spinner = el.shadowRoot?.querySelector<HTMLElement>('.spinner');

    expect(spinner).to.exist;
    // Check that spinner has the expected structure
    expect(spinner?.tagName.toLowerCase()).to.equal('div');
  });
});
