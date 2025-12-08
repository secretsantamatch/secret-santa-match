
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

// PWA Service Worker Registration & Auto-Update
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);

        // 1. Check if there's already a waiting worker (an update downloaded but waiting)
        if (registration.waiting) {
            console.log('New version waiting. Forcing update...');
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
            return;
        }

        // 2. Listen for new workers installing
        registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) return;

            installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                    if (navigator.serviceWorker.controller) {
                        // New update available. Force refresh.
                        console.log('New content is available; please refresh.');
                        // Send message to SW to skip waiting
                        if (registration.waiting) {
                             registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                        }
                        // Reload page
                        window.location.reload();
                    } else {
                        console.log('Content is cached for offline use.');
                    }
                }
            };
        };
      })
      .catch(error => {
        console.log('ServiceWorker registration failed: ', error);
      });
      
      // 3. Ensure controller change triggers reload
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
            refreshing = true;
            window.location.reload();
        }
      });
  });
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
