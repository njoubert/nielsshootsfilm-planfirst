/**
 * Authentication state manager.
 * Provides a centralized way to manage auth state and notify components of changes.
 */

export const AUTH_LOGOUT_EVENT = 'auth:logout';
export const AUTH_LOGIN_EVENT = 'auth:login';

/**
 * Dispatch a logout event to notify all components.
 */
export function dispatchLogoutEvent(): void {
  window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT));
}

/**
 * Dispatch a login event to notify all components.
 */
export function dispatchLoginEvent(): void {
  window.dispatchEvent(new CustomEvent(AUTH_LOGIN_EVENT));
}

/**
 * Subscribe to logout events.
 * Returns an unsubscribe function.
 */
export function onLogout(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(AUTH_LOGOUT_EVENT, handler);
  return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handler);
}

/**
 * Subscribe to login events.
 * Returns an unsubscribe function.
 */
export function onLogin(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(AUTH_LOGIN_EVENT, handler);
  return () => window.removeEventListener(AUTH_LOGIN_EVENT, handler);
}
