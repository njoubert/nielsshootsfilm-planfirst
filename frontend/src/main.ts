/**
 * Main application entry point.
 * Bootstraps the app-shell component and initializes global setup.
 */

import './components/app-shell';
import './styles/admin.css';
import './styles/global.css';
import './styles/theme.css';

// Handle page reload/restore gracefully
const initializeApp = () => {
  const appRoot = document.getElementById('app');
  if (!appRoot) {
    console.error('App root element not found');
    return;
  }

  try {
    // Clear any existing content before re-initializing
    appRoot.innerHTML = '<app-shell></app-shell>';
  } catch (error) {
    console.error('Failed to initialize app:', error);
    // Show a basic error message if app-shell fails to load
    appRoot.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; padding: 2rem; text-align: center;">
        <p style="margin-bottom: 1rem;">Failed to load the application.</p>
        <button onclick="window.location.reload()" style="padding: 0.5rem 1rem; cursor: pointer;">
          Reload Page
        </button>
      </div>
    `;
  }
};

// Bootstrap the application
window.addEventListener('DOMContentLoaded', initializeApp);

// Handle Safari's page restore after memory pressure / crash
window.addEventListener('pageshow', (event) => {
  // If page was restored from back/forward cache after a crash, re-initialize
  if (event.persisted) {
    console.log('Page restored from cache, re-initializing...');
    initializeApp();
  }
});
