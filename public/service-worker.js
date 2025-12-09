const CACHE_NAME = 'v7'; // Bumped version to force cache invalidation

const urlsToCache = [
  '/',
  '/generator.html',
  '/index.css',
  '/logo_192.png',
  '/logo_512.png',
  '/manifest.json'
];

self.addEventListener('install', event => {
  // Forces the waiting service worker to become the active service worker immediately
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
  );
});

// Allow the frontend to trigger a skipWaiting manually if needed
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', event => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  // NETWORK-FIRST STRATEGY FOR ALL REQUESTS
  // Always try to get fresh content from the network first.
  // Only fall back to cache if the user is offline.
  // This ensures users always see the latest version of your site.
  event.respondWith(
    fetch(request)
      .then(response => {
        // Don't cache bad responses
        if (!response || response.status !== 200) {
          return response;
        }

        // Clone the response - one for cache, one for browser
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        // Network failed - try to serve from cache (offline fallback)
        return caches.match(request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // If it's a navigation request and we have no cache, show the cached home page
          if (request.mode === 'navigate') {
            return caches.match('/');
          }
          
          // Nothing in cache - just fail
          return new Response('Offline and no cached version available', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

self.addEventListener('activate', event => {
  // Take control of all pages immediately
  event.waitUntil(
    Promise.all([
      // Claim all clients so new SW takes effect immediately
      self.clients.claim(),
      
      // Delete all old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});