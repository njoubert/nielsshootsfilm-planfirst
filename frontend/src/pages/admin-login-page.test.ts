import { expect, fixture, html, waitUntil } from '@open-wc/testing';
import * as sinon from 'sinon';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import * as adminApi from '../utils/admin-api';
import './admin-login-page';
import type { AdminLoginPage } from './admin-login-page';

describe('AdminLoginPage', () => {
  let loginStub: sinon.SinonStub;

  beforeEach(() => {
    vi.clearAllMocks();
    loginStub = sinon.stub(adminApi, 'login');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should render the component', async () => {
    const el = await fixture<AdminLoginPage>(html`<admin-login-page></admin-login-page>`);

    expect(el).to.exist;
    expect(el.tagName.toLowerCase()).to.equal('admin-login-page');
  });

  it('should render login form', async () => {
    const el = await fixture<AdminLoginPage>(html`<admin-login-page></admin-login-page>`);

    const form = el.shadowRoot?.querySelector('form');
    const usernameInput = el.shadowRoot?.querySelector('input[name="username"]');
    const passwordInput = el.shadowRoot?.querySelector('input[name="password"]');
    const submitButton = el.shadowRoot?.querySelector('button[type="submit"]');

    expect(form).to.exist;
    expect(usernameInput).to.exist;
    expect(passwordInput).to.exist;
    expect(submitButton).to.exist;
  });

  it('should render page title and subtitle', async () => {
    const el = await fixture<AdminLoginPage>(html`<admin-login-page></admin-login-page>`);

    const heading = el.shadowRoot?.querySelector('h1');
    const subtitle = el.shadowRoot?.querySelector('.subtitle');

    expect(heading).to.exist;
    expect(heading?.textContent).to.include('Admin Login');
    expect(subtitle).to.exist;
  });

  it('should update input values on user input', async () => {
    const el = await fixture<AdminLoginPage>(html`<admin-login-page></admin-login-page>`);

    const usernameInput = el.shadowRoot!.querySelector(
      'input[name="username"]'
    ) as HTMLInputElement;
    const passwordInput = el.shadowRoot!.querySelector(
      'input[name="password"]'
    ) as HTMLInputElement;

    usernameInput.value = 'testuser';
    passwordInput.value = 'testpass'; // pragma: allowlist secret
    usernameInput.dispatchEvent(new Event('input'));
    passwordInput.dispatchEvent(new Event('input'));
    await el.updateComplete;

    expect(el['username']).to.equal('testuser');
    expect(el['password']).to.equal('testpass'); // pragma: allowlist secret
  });
  it('should handle successful login', async () => {
    loginStub.resolves({ message: 'Login successful' });
    const locationHrefSpy = sinon.stub();
    Object.defineProperty(window, 'location', {
      value: { href: locationHrefSpy },
      writable: true,
    });

    const el = await fixture<AdminLoginPage>(html`<admin-login-page></admin-login-page>`);

    // Fill in credentials
    const usernameInput = el.shadowRoot?.querySelector(
      'input[name="username"]'
    ) as HTMLInputElement;
    const passwordInput = el.shadowRoot?.querySelector(
      'input[name="password"]'
    ) as HTMLInputElement;

    usernameInput.value = 'admin';
    usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
    passwordInput.value = 'test123';
    passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
    await el.updateComplete;

    // Submit form
    const form = el.shadowRoot?.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await el.updateComplete;

    // Wait for async operations
    await waitUntil(() => loginStub.called, 'login should be called');

    expect(loginStub).to.have.been.calledWith({
      username: 'admin',
      password: 'test123', // pragma: allowlist secret
    });
  });

  it('should display error message on login failure', async () => {
    loginStub.rejects(new Error('Invalid credentials'));

    const el = await fixture<AdminLoginPage>(html`<admin-login-page></admin-login-page>`);

    const usernameInput = el.shadowRoot?.querySelector(
      'input[name="username"]'
    ) as HTMLInputElement;
    const passwordInput = el.shadowRoot?.querySelector(
      'input[name="password"]'
    ) as HTMLInputElement;

    usernameInput.value = 'admin';
    usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
    passwordInput.value = 'wrongpass';
    passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
    await el.updateComplete;

    const form = el.shadowRoot?.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await el.updateComplete;

    // Wait for error to be set
    await waitUntil(() => el['error'] !== '', 'error should be set');

    expect(el['error']).to.equal('Invalid credentials');

    const errorMessage = el.shadowRoot?.querySelector('.error-message');
    expect(errorMessage).to.exist;
    expect(errorMessage?.textContent).to.include('Invalid credentials');
  });

  it('should disable inputs and button during login', async () => {
    // Make login slow so we can check loading state
    loginStub.returns(new Promise((resolve) => setTimeout(resolve, 100)));

    const el = await fixture<AdminLoginPage>(html`<admin-login-page></admin-login-page>`);

    const usernameInput = el.shadowRoot?.querySelector(
      'input[name="username"]'
    ) as HTMLInputElement;
    const passwordInput = el.shadowRoot?.querySelector(
      'input[name="password"]'
    ) as HTMLInputElement;
    const submitButton = el.shadowRoot?.querySelector('button[type="submit"]') as HTMLButtonElement;

    usernameInput.value = 'admin';
    usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
    passwordInput.value = 'test123';
    passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
    await el.updateComplete;

    const form = el.shadowRoot?.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await el.updateComplete;

    // Check loading state
    await waitUntil(() => el['loading'] === true, 'should be in loading state');

    expect(usernameInput.disabled).to.be.true;
    expect(passwordInput.disabled).to.be.true;
    expect(submitButton.disabled).to.be.true;
  });

  it('should show success message after successful login', async () => {
    loginStub.resolves({ message: 'Login successful' });

    const el = await fixture<AdminLoginPage>(html`<admin-login-page></admin-login-page>`);

    const usernameInput = el.shadowRoot?.querySelector(
      'input[name="username"]'
    ) as HTMLInputElement;
    const passwordInput = el.shadowRoot?.querySelector(
      'input[name="password"]'
    ) as HTMLInputElement;

    usernameInput.value = 'admin';
    usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
    passwordInput.value = 'test123';
    passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
    await el.updateComplete;

    const form = el.shadowRoot?.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await el.updateComplete;

    await waitUntil(() => el['success'] === true, 'success should be set');

    const successMessage = el.shadowRoot?.querySelector('.success-message');
    expect(successMessage).to.exist;
  });

  it('should have correct input types and attributes', async () => {
    const el = await fixture<AdminLoginPage>(html`<admin-login-page></admin-login-page>`);

    const usernameInput = el.shadowRoot?.querySelector(
      'input[name="username"]'
    ) as HTMLInputElement;
    const passwordInput = el.shadowRoot?.querySelector(
      'input[name="password"]'
    ) as HTMLInputElement;

    expect(usernameInput.type).to.equal('text');
    expect(usernameInput.required).to.be.true;
    expect(usernameInput.autocomplete).to.equal('username');

    expect(passwordInput.type).to.equal('password');
    expect(passwordInput.required).to.be.true;
    expect(passwordInput.autocomplete).to.equal('current-password');
  });

  it('should prevent default form submission', async () => {
    loginStub.resolves({ message: 'Login successful' });

    const el = await fixture<AdminLoginPage>(html`<admin-login-page></admin-login-page>`);
    const form = el.shadowRoot?.querySelector('form') as HTMLFormElement;

    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    const preventDefaultSpy = sinon.spy(submitEvent, 'preventDefault');

    form.dispatchEvent(submitEvent);

    expect(preventDefaultSpy).to.have.been.called;
  });
});
