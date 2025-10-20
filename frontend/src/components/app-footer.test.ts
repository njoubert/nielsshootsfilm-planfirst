import { expect, fixture, html } from '@open-wc/testing';
import { describe, it } from 'vitest';
import './app-footer';
import type { AppFooter } from './app-footer';
import type { OwnerInfo, SocialLinks } from '../types/data-models';

describe('AppFooter', () => {
  it('should render the component', async () => {
    const el = await fixture<AppFooter>(html`<app-footer></app-footer>`);

    expect(el).to.exist;
    expect(el.tagName.toLowerCase()).to.equal('app-footer');
  });

  it('should render copyright with current year', async () => {
    const el = await fixture<AppFooter>(html`<app-footer siteTitle="My Portfolio"></app-footer>`);
    const copyright = el.shadowRoot?.querySelector('.copyright');
    const currentYear = new Date().getFullYear();

    expect(copyright).to.exist;
    expect(copyright?.textContent).to.include(currentYear.toString());
    expect(copyright?.textContent).to.include('My Portfolio');
  });

  it('should render copyright with owner name when no site title', async () => {
    const owner: OwnerInfo = {
      name: 'John Doe',
    };
    const el = await fixture<AppFooter>(html`<app-footer .owner=${owner}></app-footer>`);
    const copyright = el.shadowRoot?.querySelector('.copyright');

    expect(copyright?.textContent).to.include('John Doe');
  });

  it('should prefer site title over owner name in copyright', async () => {
    const owner: OwnerInfo = {
      name: 'John Doe',
    };
    const el = await fixture<AppFooter>(
      html`<app-footer siteTitle="Portfolio" .owner=${owner}></app-footer>`
    );
    const copyright = el.shadowRoot?.querySelector('.copyright');

    expect(copyright?.textContent).to.include('Portfolio');
    expect(copyright?.textContent).to.not.include('John Doe');
  });

  it('should render Instagram social link', async () => {
    const social: SocialLinks = {
      instagram: 'testuser',
    };
    const el = await fixture<AppFooter>(html`<app-footer .social=${social}></app-footer>`);
    const socialLinks = el.shadowRoot?.querySelectorAll('.social-links a');

    expect(socialLinks).to.have.length(1);
    expect(socialLinks?.[0]?.textContent).to.equal('Instagram');
    expect(socialLinks?.[0]?.getAttribute('href')).to.equal('https://instagram.com/testuser');
    expect(socialLinks?.[0]?.getAttribute('target')).to.equal('_blank');
    expect(socialLinks?.[0]?.getAttribute('rel')).to.equal('noopener noreferrer');
  });

  it('should render multiple social links', async () => {
    const social: SocialLinks = {
      instagram: 'insta',
      twitter: 'tweet',
      facebook: 'fb',
      linkedin: 'in',
    };
    const el = await fixture<AppFooter>(html`<app-footer .social=${social}></app-footer>`);
    const socialLinks = el.shadowRoot?.querySelectorAll('.social-links a');

    expect(socialLinks).to.have.length(4);
    expect(socialLinks?.[0]?.textContent).to.equal('Instagram');
    expect(socialLinks?.[1]?.textContent).to.equal('Facebook');
    expect(socialLinks?.[2]?.textContent).to.equal('Twitter');
    expect(socialLinks?.[3]?.textContent).to.equal('LinkedIn');
  });

  it('should render custom social links', async () => {
    const social: SocialLinks = {
      custom_links: [
        { label: 'GitHub', url: 'https://github.com/user' },
        { label: 'Website', url: 'https://example.com' },
      ],
    };
    const el = await fixture<AppFooter>(html`<app-footer .social=${social}></app-footer>`);
    const socialLinks = el.shadowRoot?.querySelectorAll('.social-links a');

    expect(socialLinks).to.have.length(2);
    expect(socialLinks?.[0]?.textContent).to.equal('GitHub');
    expect(socialLinks?.[0]?.getAttribute('href')).to.equal('https://github.com/user');
    expect(socialLinks?.[1]?.textContent).to.equal('Website');
    expect(socialLinks?.[1]?.getAttribute('href')).to.equal('https://example.com');
  });

  it('should not render social links when none provided', async () => {
    const el = await fixture<AppFooter>(html`<app-footer></app-footer>`);
    const socialLinks = el.shadowRoot?.querySelector('.social-links');

    expect(socialLinks).to.not.exist;
  });

  it('should render email in contact info', async () => {
    const owner: OwnerInfo = {
      email: 'test@example.com',
    };
    const el = await fixture<AppFooter>(html`<app-footer .owner=${owner}></app-footer>`);
    const contactInfo = el.shadowRoot?.querySelector('.contact-info');
    const emailLink = contactInfo?.querySelector('a');

    expect(contactInfo).to.exist;
    expect(emailLink?.textContent).to.equal('test@example.com');
    expect(emailLink?.getAttribute('href')).to.equal('mailto:test@example.com');
  });

  it('should render location in contact info', async () => {
    const owner: OwnerInfo = {
      location: 'San Francisco, CA',
    };
    const el = await fixture<AppFooter>(html`<app-footer .owner=${owner}></app-footer>`);
    const contactInfo = el.shadowRoot?.querySelector('.contact-info');

    expect(contactInfo).to.exist;
    expect(contactInfo?.textContent).to.include('San Francisco, CA');
  });

  it('should render email and location with separator', async () => {
    const owner: OwnerInfo = {
      email: 'test@example.com',
      location: 'New York, NY',
    };
    const el = await fixture<AppFooter>(html`<app-footer .owner=${owner}></app-footer>`);
    const contactInfo = el.shadowRoot?.querySelector('.contact-info');

    expect(contactInfo?.textContent).to.include('test@example.com');
    expect(contactInfo?.textContent).to.include('•');
    expect(contactInfo?.textContent).to.include('New York, NY');
  });

  it('should not render contact info when none provided', async () => {
    const el = await fixture<AppFooter>(html`<app-footer></app-footer>`);
    const contactInfo = el.shadowRoot?.querySelector('.contact-info');

    expect(contactInfo).to.not.exist;
  });

  it('should render complete footer with all sections', async () => {
    const social: SocialLinks = {
      instagram: 'photo',
      twitter: 'tweets',
    };
    const owner: OwnerInfo = {
      name: 'Photographer',
      email: 'contact@example.com',
      location: 'Los Angeles, CA',
    };
    const el = await fixture<AppFooter>(
      html`<app-footer siteTitle="Portfolio" .social=${social} .owner=${owner}></app-footer>`
    );

    expect(el.shadowRoot?.querySelector('.social-links')).to.exist;
    expect(el.shadowRoot?.querySelector('.contact-info')).to.exist;
    expect(el.shadowRoot?.querySelector('.copyright')).to.exist;
  });
});
