/**
 * Main application entry point.
 * Bootstraps the app-shell component and initializes global setup.
 */

import './components/app-shell';
import './styles/global.css';

// Bootstrap the application
window.addEventListener('DOMContentLoaded', () => {
  const appRoot = document.getElementById('app');
  if (appRoot) {
    appRoot.innerHTML = '<app-shell></app-shell>';
  }
});
