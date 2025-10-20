import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { OwnerInfo, SocialLinks } from '../types/data-models';

/**
 * Footer component with social links and contact info.
 */
@customElement('app-footer')
export class AppFooter extends LitElement {
  @property({ type: Object }) social?: SocialLinks;
  @property({ type: Object }) owner?: OwnerInfo;
  @property({ type: String }) siteTitle = '';

  static styles = css`
    :host {
      display: block;
    }

    footer {
      padding: 3rem 2rem 2rem;
      background-color: var(--color-surface);
      border-top: 1px solid var(--color-border);
      text-align: center;
    }

    .social-links {
      display: flex;
      justify-content: center;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .social-links a {
      color: var(--color-text-primary);
      text-decoration: none;
      font-size: 0.9rem;
      transition: color 0.2s;
    }

    .social-links a:hover {
      color: var(--color-text-secondary);
    }

    .contact-info {
      margin-bottom: 1.5rem;
      color: var(--color-text-secondary);
      font-size: 0.9rem;
    }

    .contact-info a {
      color: var(--color-text-secondary);
      text-decoration: none;
    }

    .contact-info a:hover {
      text-decoration: underline;
    }

    .copyright {
      color: var(--color-text-secondary);
      font-size: 0.85rem;
    }
  `;

  render() {
    const currentYear = new Date().getFullYear();

    return html`
      <footer>
        ${this.renderSocialLinks()} ${this.renderContactInfo()}
        <div class="copyright">
          © ${currentYear} ${this.siteTitle || this.owner?.name || ''}. All rights reserved.
        </div>
      </footer>
    `;
  }

  private renderSocialLinks() {
    if (!this.social) return '';

    const links = [];

    if (this.social.instagram) {
      links.push(
        html`<a
          href="https://instagram.com/${this.social.instagram}"
          target="_blank"
          rel="noopener noreferrer"
          >Instagram</a
        >`
      );
    }
    if (this.social.facebook) {
      links.push(
        html`<a
          href="https://facebook.com/${this.social.facebook}"
          target="_blank"
          rel="noopener noreferrer"
          >Facebook</a
        >`
      );
    }
    if (this.social.twitter) {
      links.push(
        html`<a
          href="https://twitter.com/${this.social.twitter}"
          target="_blank"
          rel="noopener noreferrer"
          >Twitter</a
        >`
      );
    }
    if (this.social.linkedin) {
      links.push(
        html`<a
          href="https://linkedin.com/in/${this.social.linkedin}"
          target="_blank"
          rel="noopener noreferrer"
          >LinkedIn</a
        >`
      );
    }

    // Custom links
    this.social.custom_links?.forEach((link) => {
      links.push(
        html`<a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.label}</a>`
      );
    });

    return links.length > 0 ? html`<div class="social-links">${links}</div>` : '';
  }

  private renderContactInfo() {
    if (!this.owner?.email && !this.owner?.location) return '';

    return html`
      <div class="contact-info">
        ${this.owner.email
          ? html`<a href="mailto:${this.owner.email}">${this.owner.email}</a>`
          : ''}
        ${this.owner.email && this.owner.location ? ' • ' : ''} ${this.owner.location || ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-footer': AppFooter;
  }
}
