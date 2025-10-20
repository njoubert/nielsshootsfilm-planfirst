/**
 * Simple client-side router for SPA navigation.
 */

export interface Route {
  path: string;
  component: string;
}

export class Router {
  private routes: Route[] = [];
  private currentPath = '';
  private listeners: Array<(path: string) => void> = [];

  constructor(routes: Route[]) {
    this.routes = routes;
    this.setupListeners();
    this.navigate(window.location.pathname);
  }

  /**
   * Navigate to a path.
   */
  navigate(path: string): void {
    if (this.currentPath === path) return;

    this.currentPath = path;
    window.history.pushState({}, '', path);
    this.notifyListeners();
  }

  /**
   * Get current route.
   */
  getCurrentRoute(): Route | null {
    // Simple routing: exact match or wildcard
    return (
      this.routes.find((r) => r.path === this.currentPath) ||
      this.routes.find((r) => r.path === '*') ||
      null
    );
  }

  /**
   * Get current path.
   */
  getCurrentPath(): string {
    return this.currentPath;
  }

  /**
   * Subscribe to route changes.
   */
  subscribe(callback: (path: string) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Setup browser navigation listeners.
   */
  private setupListeners(): void {
    window.addEventListener('popstate', () => {
      this.currentPath = window.location.pathname;
      this.notifyListeners();
    });

    // Handle link clicks
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');

      if (link && link.href.startsWith(window.location.origin)) {
        e.preventDefault();
        const path = new URL(link.href).pathname;
        this.navigate(path);
      }
    });
  }

  /**
   * Notify subscribers of route changes.
   */
  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback(this.currentPath));
  }
}
