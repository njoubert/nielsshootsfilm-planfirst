import { expect, fixture, html } from '@open-wc/testing';
import * as sinon from 'sinon';
import { afterEach, beforeEach, describe, it } from 'vitest';
import * as adminApi from '../utils/admin-api';
import './admin-header';
import type { AdminHeader } from './admin-header';

describe('AdminHeader', () => {
  let logoutStub: sinon.SinonStub;

  beforeEach(() => {
    logoutStub = sinon.stub(adminApi, 'logout').resolves();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should render the component', async () => {
    const el = await fixture<AdminHeader>(
      html`<admin-header siteTitle="Test Site"></admin-header>`
    );

    expect(el).to.exist;
    expect(el.tagName.toLowerCase()).to.equal('admin-header');
  });

  it('should render site title with link to homepage', async () => {
    const el = await fixture<AdminHeader>(
      html`<admin-header siteTitle="My Portfolio"></admin-header>`
    );
    const titleLink = el.shadowRoot?.querySelector('.site-title a') as HTMLAnchorElement;

    expect(titleLink).to.exist;
    expect(titleLink.textContent).to.equal('My Portfolio');
    expect(titleLink.getAttribute('href')).to.equal('/');
  });

  it('should render navigation tabs', async () => {
    const el = await fixture<AdminHeader>(
      html`<admin-header siteTitle="Test" activeTab="dashboard"></admin-header>`
    );
    const tabs = el.shadowRoot?.querySelectorAll('.nav-tabs a');

    expect(tabs).to.have.length(3);
    expect(tabs?.[0].textContent).to.equal('Dashboard');
    expect(tabs?.[1].textContent).to.equal('Albums');
    expect(tabs?.[2].textContent).to.equal('Settings');
  });

  it('should highlight active tab', async () => {
    const el = await fixture<AdminHeader>(
      html`<admin-header siteTitle="Test" activeTab="albums"></admin-header>`
    );
    const tabs = el.shadowRoot?.querySelectorAll('.nav-tabs a');

    expect(tabs?.[0].classList.contains('active')).to.be.false;
    expect(tabs?.[1].classList.contains('active')).to.be.true; // Albums tab
    expect(tabs?.[2].classList.contains('active')).to.be.false;
  });

  it('should render logout button', async () => {
    const el = await fixture<AdminHeader>(html`<admin-header siteTitle="Test"></admin-header>`);
    const logoutBtn = el.shadowRoot?.querySelector('.logout-btn') as HTMLButtonElement;

    expect(logoutBtn).to.exist;
    expect(logoutBtn.textContent?.trim()).to.equal('Logout');
  });

  it('should call logout API when logout button is clicked', async () => {
    const el = await fixture<AdminHeader>(html`<admin-header siteTitle="Test"></admin-header>`);
    const logoutBtn = el.shadowRoot?.querySelector('.logout-btn') as HTMLButtonElement;

    logoutBtn.click();
    await new Promise((resolve) => setTimeout(resolve, 10)); // Wait for async operation

    expect(logoutStub).to.have.been.calledOnce;
  });
});
