import { expect, fixture, html } from '@open-wc/testing';
import { beforeEach, describe, it, vi } from 'vitest';
import './toast-notification';
import type { ToastNotification } from './toast-notification';

describe('ToastNotification', () => {
  beforeEach(() => {
    vi.clearAllTimers();
  });

  it('should render the component', async () => {
    const el = await fixture<ToastNotification>(
      html`<toast-notification message="Test message" .visible=${true}></toast-notification>`
    );

    expect(el).to.exist;
    expect(el.tagName.toLowerCase()).to.equal('toast-notification');
  });

  it('should display success toast', async () => {
    const el = await fixture<ToastNotification>(
      html`<toast-notification
        message="Success!"
        type="success"
        .visible=${true}
      ></toast-notification>`
    );

    const toast = el.shadowRoot?.querySelector('.toast.success');
    expect(toast).to.exist;
    expect(toast?.textContent).to.include('Success!');
  });

  it('should display error toast', async () => {
    const el = await fixture<ToastNotification>(
      html`<toast-notification
        message="Error occurred"
        type="error"
        .visible=${true}
      ></toast-notification>`
    );

    const toast = el.shadowRoot?.querySelector('.toast.error');
    expect(toast).to.exist;
    expect(toast?.textContent).to.include('Error occurred');
  });

  it('should display info toast', async () => {
    const el = await fixture<ToastNotification>(
      html`<toast-notification
        message="Info message"
        type="info"
        .visible=${true}
      ></toast-notification>`
    );

    const toast = el.shadowRoot?.querySelector('.toast.info');
    expect(toast).to.exist;
    expect(toast?.textContent).to.include('Info message');
  });

  it('should not render when visible is false', async () => {
    const el = await fixture<ToastNotification>(
      html`<toast-notification message="Test" .visible=${false}></toast-notification>`
    );

    const toast = el.shadowRoot?.querySelector('.toast');
    expect(toast).to.not.exist;
  });

  it('should not render when message is empty', async () => {
    const el = await fixture<ToastNotification>(
      html`<toast-notification message="" .visible=${true}></toast-notification>`
    );

    const toast = el.shadowRoot?.querySelector('.toast');
    expect(toast).to.not.exist;
  });

  it('should have close button', async () => {
    const el = await fixture<ToastNotification>(
      html`<toast-notification message="Test" .visible=${true}></toast-notification>`
    );

    const closeButton = el.shadowRoot?.querySelector('.toast-close');
    expect(closeButton).to.exist;
  });

  it('should close when close button is clicked', async () => {
    const el = await fixture<ToastNotification>(
      html`<toast-notification message="Test" .visible=${true} .duration=${0}></toast-notification>`
    );

    let eventFired = false;
    el.addEventListener('toast-close', () => {
      eventFired = true;
    });

    const closeButton = el.shadowRoot?.querySelector('.toast-close') as HTMLButtonElement;
    closeButton?.click();

    // Wait for animation
    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(eventFired).to.be.true;
    expect(el.visible).to.be.false;
  });

  it('should display correct icons', async () => {
    const successEl = await fixture<ToastNotification>(
      html`<toast-notification
        message="Success"
        type="success"
        .visible=${true}
      ></toast-notification>`
    );
    const successIcon = successEl.shadowRoot?.querySelector('.toast-icon');
    expect(successIcon?.textContent).to.equal('✓');

    const errorEl = await fixture<ToastNotification>(
      html`<toast-notification message="Error" type="error" .visible=${true}></toast-notification>`
    );
    const errorIcon = errorEl.shadowRoot?.querySelector('.toast-icon');
    expect(errorIcon?.textContent).to.equal('✕');

    const infoEl = await fixture<ToastNotification>(
      html`<toast-notification message="Info" type="info" .visible=${true}></toast-notification>`
    );
    const infoIcon = infoEl.shadowRoot?.querySelector('.toast-icon');
    expect(infoIcon?.textContent).to.equal('ℹ');
  });

  it('should handle multiline messages', async () => {
    const message = 'Line 1\nLine 2\nLine 3';
    const el = await fixture<ToastNotification>(
      html`<toast-notification .message=${message} .visible=${true}></toast-notification>`
    );

    const content = el.shadowRoot?.querySelector('.toast-content');
    expect(content?.textContent).to.equal(message);
  });
});
