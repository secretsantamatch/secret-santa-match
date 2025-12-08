
const CACHE_NAME = 'v6'; // Incremented version to force cache invalidation
const urlsToCache = [
  '/',
  '/generator.html',
  '/index.css',
  '/logo_192.png',
  '/logo_512.png',
  '/manifest.json'
];

self.addEventListener('install', event => {
  // Forces the waiting service worker to become the active service worker
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
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

  // STRATEGY: Network First for HTML (Navigation)
  // This ensures the user ALWAYS gets the latest index.html if they have internet.
  // If they are offline, it falls back to cache.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Stash the fresh copy in cache
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // If offline, return cached version
          return caches.match(request);
        })
    );
    return;
  }

  // STRATEGY: Cache First for Assets (Images, JS, CSS)
  // These files are usually hashed (e.g., index.a1b2.js), so they never change content.
  // If we miss the cache, we fetch from network.
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          return response;
        }

        return fetch(request).then(
          response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
                // Only cache GET requests
                if(request.method === 'GET') {
                    cache.put(request, responseToCache);
                }
            });
            return response;
          }
        );
      })
  );
});

self.addEventListener('activate', event => {
  // Claim clients so the new service worker takes control immediately
  event.waitUntil(self.clients.claim());
  
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
