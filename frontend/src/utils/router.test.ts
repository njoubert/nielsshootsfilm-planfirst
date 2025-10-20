import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Route, Router } from './router';

describe('Router', () => {
  let router: Router;
  let routes: Route[];

  beforeEach(() => {
    // Reset window.location
    window.history.pushState({}, '', '/');
    routes = [
      { path: '/', component: 'portfolio-page' },
      { path: '/albums', component: 'album-list-page' },
      { path: '/album/:slug', component: 'album-detail-page' },
      { path: '*', component: 'not-found-page' },
    ];
    router = new Router(routes);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should create router instance with routes', () => {
      expect(router).toBeInstanceOf(Router);
    });

    it('should get current path', () => {
      router.navigate('/albums');
      const path = router.getCurrentPath();
      expect(path).toBe('/albums');
    });

    it('should initialize with current browser path', () => {
      window.history.pushState({}, '', '/albums');
      const newRouter = new Router(routes);
      expect(newRouter.getCurrentPath()).toBe('/albums');
    });
  });

  describe('route matching', () => {
    it('should match exact route', () => {
      router.navigate('/albums');
      const route = router.getCurrentRoute();
      expect(route).toEqual({ path: '/albums', component: 'album-list-page' });
    });

    it('should return wildcard route for unknown paths', () => {
      router.navigate('/unknown');
      const route = router.getCurrentRoute();
      expect(route).toEqual({ path: '*', component: 'not-found-page' });
    });

    it('should match root path', () => {
      router.navigate('/');
      const route = router.getCurrentRoute();
      expect(route).toEqual({ path: '/', component: 'portfolio-page' });
    });

    it('should return null when no route matches and no wildcard', () => {
      const strictRouter = new Router([{ path: '/', component: 'home' }]);
      strictRouter.navigate('/unknown');
      const route = strictRouter.getCurrentRoute();

      // Should return null if no wildcard is defined
      expect(route).toBeNull();
    });
  });

  describe('navigation', () => {
    it('should navigate to route', () => {
      router.navigate('/albums');
      expect(router.getCurrentPath()).toBe('/albums');
    });

    it('should update browser history on navigate', () => {
      const pushStateSpy = vi.spyOn(window.history, 'pushState');

      router.navigate('/albums');

      expect(pushStateSpy).toHaveBeenCalledWith({}, '', '/albums');
    });

    it('should not navigate to same path twice', () => {
      const pushStateSpy = vi.spyOn(window.history, 'pushState');
      pushStateSpy.mockClear(); // Clear constructor call

      router.navigate('/albums');
      router.navigate('/albums'); // Second call should be ignored

      // Should only be called once since second navigation is to same path
      expect(pushStateSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('subscribers', () => {
    it('should notify subscribers on route change', () => {
      const subscriber = vi.fn();
      router.subscribe(subscriber);

      router.navigate('/albums');

      expect(subscriber).toHaveBeenCalledWith('/albums');
    });

    it('should unsubscribe', () => {
      const subscriber = vi.fn();
      const unsubscribe = router.subscribe(subscriber);

      unsubscribe();
      router.navigate('/albums');

      expect(subscriber).not.toHaveBeenCalled();
    });

    it('should handle multiple subscribers', () => {
      const subscriber1 = vi.fn();
      const subscriber2 = vi.fn();

      router.subscribe(subscriber1);
      router.subscribe(subscriber2);

      router.navigate('/albums');

      expect(subscriber1).toHaveBeenCalledWith('/albums');
      expect(subscriber2).toHaveBeenCalledWith('/albums');
    });
  });

  describe('browser navigation', () => {
    it('should handle popstate event', () => {
      const subscriber = vi.fn();
      router.subscribe(subscriber);

      // Simulate browser back button
      window.history.pushState({}, '', '/albums');
      window.dispatchEvent(new PopStateEvent('popstate'));

      expect(subscriber).toHaveBeenCalled();
      expect(router.getCurrentPath()).toBe('/albums');
    });
  });

  describe('link interception', () => {
    it('should intercept click on internal links', () => {
      const link = document.createElement('a');
      link.href = `${window.location.origin}/albums`;
      document.body.appendChild(link);

      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      link.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
      expect(router.getCurrentPath()).toBe('/albums');

      document.body.removeChild(link);
    });

    it('should not intercept external links', () => {
      const link = document.createElement('a');
      link.href = 'https://external.com';
      document.body.appendChild(link);

      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      link.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(false);

      document.body.removeChild(link);
    });
  });
});
