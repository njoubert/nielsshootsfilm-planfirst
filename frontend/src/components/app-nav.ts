import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { CustomLink, NavigationConfig } from '../types/data-models';

/**
 * Navigation header component.
 */
@customElement('app-nav')
export class AppNav extends LitElement {
  @property({ type: Object }) config?: NavigationConfig;
  @property({ type: String }) siteTitle = '';

  static styles = css`
    :host {
      display: block;
    }

    nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      background: linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%);
      border-bottom: none;
      transition: background 0.3s ease;
    }

    :host(.opaque) nav {
      background-color: var(--color-background);
      border-bottom: 1px solid var(--color-border);
    }

    .logo {
      font-family: 'Raleway', sans-serif;
      font-size: 16px;
      font-weight: 300;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--color-text-primary);
      text-decoration: none;
    }

    .nav-links {
      display: flex;
      gap: 2rem;
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .nav-links a {
      color: var(--color-text-primary);
      text-decoration: none;
      transition: color 0.2s;
    }

    .nav-links a:hover {
      color: var(--color-text-secondary);
    }

    @media (max-width: 768px) {
      nav {
        flex-direction: column;
        gap: 1rem;
      }

      .nav-links {
        gap: 1rem;
      }
    }
  `;

  render() {
    return html`
      <nav>
        <a href="/" class="logo">${this.siteTitle}</a>
        <ul class="nav-links">
          ${this.config?.show_albums ? html`<li><a href="/albums">Galleries</a></li>` : ''}
          ${this.config?.show_about ? html`<li><a href="/about">About</a></li>` : ''}
          ${this.config?.show_contact ? html`<li><a href="/contact">Contact</a></li>` : ''}
          ${this.config?.custom_links?.map(
            (link: CustomLink) => html`<li><a href="${link.url}">${link.label}</a></li>`
          )}
        </ul>
      </nav>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-nav': AppNav;
  }
}
