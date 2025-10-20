/**
 * Simple client-side router for SPA navigation.
 */

export interface Route {
  path: string;
  component: string;
  guard?: () => boolean | Promise<boolean>; // Auth guard
}

export interface RouteMatch {
  route: Route;
  params: Record<string, string>;
}

export class Router {
  private routes: Route[] = [];
  private currentPath = '';
  private listeners: Array<(path: string) => void> = [];

  constructor(routes: Route[]) {
    this.routes = routes;
    this.setupListeners();
    void this.navigate(window.location.pathname);
  }

  /**
   * Navigate to a path.
   */
  async navigate(path: string): Promise<void> {
    if (this.currentPath === path) return;

    // Check route guard
    const match = this.matchRoute(path);
    if (match?.route.guard) {
      const allowed = await match.route.guard();
      if (!allowed) {
        // Redirect to login if guard fails
        if (!path.startsWith('/admin/login')) {
          void this.navigate('/admin/login');
        }
        return;
      }
    }

    this.currentPath = path;
    window.history.pushState({}, '', path);
    this.notifyListeners();
  }

  /**
   * Match current route with params.
   */
  matchRoute(path: string): RouteMatch | null {
    for (const route of this.routes) {
      const params = this.extractParams(route.path, path);
      if (params !== null) {
        return { route, params };
      }
    }

    // Check for wildcard route
    const wildcardRoute = this.routes.find((r) => r.path === '*');
    if (wildcardRoute) {
      return { route: wildcardRoute, params: {} };
    }

    return null;
  }

  /**
   * Extract params from a path pattern.
   * Pattern: /albums/:slug or /admin/albums/:id/edit
   * Returns params object or null if no match.
   */
  private extractParams(pattern: string, path: string): Record<string, string> | null {
    // Exact match
    if (pattern === path) return {};

    // Wildcard
    if (pattern === '*') return {};

    // Pattern match
    const patternParts = pattern.split('/').filter(Boolean);
    const pathParts = path.split('/').filter(Boolean);

    if (patternParts.length !== pathParts.length) return null;

    const params: Record<string, string> = {};

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const pathPart = pathParts[i];

      if (patternPart.startsWith(':')) {
        // Dynamic parameter
        const paramName = patternPart.slice(1);
        params[paramName] = pathPart;
      } else if (patternPart !== pathPart) {
        // Static part doesn't match
        return null;
      }
    }

    return params;
  }

  /**
   * Get current route.
   */
  getCurrentRoute(): RouteMatch | null {
    return this.matchRoute(this.currentPath);
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
        void this.navigate(path);
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
