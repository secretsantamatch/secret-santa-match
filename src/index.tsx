import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// --- STALE CACHE AUTO-RELOAD ---
// This prevents white screens when a new version is deployed.
// If the browser tries to load a JS file that no longer exists (404),
// we force a reload to get the latest index.html.
window.addEventListener('vite:preloadError', (event) => {
  console.log('New version detected (preload error). Reloading...');
  window.location.reload();
});

window.addEventListener('error', (event) => {
  // Catch standard Webpack/Vite chunk errors that might not trigger vite:preloadError
  const message = event.message || '';
  const isChunkError = 
    message.includes('Loading chunk') || 
    message.includes('Importing a module script failed') ||
    message.includes('Failed to fetch dynamically imported module');

  if (isChunkError) {
    console.log('New version detected (chunk error). Reloading...');
    // Verify we haven't reloaded recently to prevent infinite loops (in case the server is actually down)
    const lastReload = sessionStorage.getItem('chunk_reload_time');
    const now = Date.now();
    if (!lastReload || now - parseInt(lastReload) > 10000) {
        sessionStorage.setItem('chunk_reload_time', String(now));
        window.location.reload();
    }
  }
});
// -------------------------------

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(error => {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);