// Placeholder Lit component for Phase 3 implementation.
export class AppShell extends HTMLElement {
  connectedCallback(): void {
    this.innerHTML = `<main><h1>Niels Shoots Film</h1><p>Phase 3 will bring this to life.</p></main>`;
  }
}

customElements.define('niels-app', AppShell);
