/**
 * Main application entry point.
 * Bootstraps the app-shell component and initializes global setup.
 */

import './components/app-shell';
import './styles/admin.css';
import './styles/global.css';
import './styles/theme.css';

const LOCKED_VIEWPORT_CONTENT =
  'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';

const ensureViewportLock = () => {
  const existingViewport = document.querySelector('meta[name="viewport"]');
  if (existingViewport) {
    if (existingViewport.getAttribute('content') !== LOCKED_VIEWPORT_CONTENT) {
      existingViewport.setAttribute('content', LOCKED_VIEWPORT_CONTENT);
    }
    return;
  }

  const viewport = document.createElement('meta');
  viewport.name = 'viewport';
  viewport.content = LOCKED_VIEWPORT_CONTENT;
  document.head.appendChild(viewport);
};

// Bootstrap the application
window.addEventListener('DOMContentLoaded', () => {
  ensureViewportLock();
  const appRoot = document.getElementById('app');
  if (appRoot) {
    appRoot.innerHTML = '<app-shell></app-shell>';
  }
});
