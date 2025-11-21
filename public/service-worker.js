const CACHE_NAME = 'v5'; // Incremented version
const urlsToCache = [
  '/',
  '/generator.html',
  '/white-elephant-generator.html',
  '/free-printables.html',
  '/logo_192.png',
  '/logo_512.png',
  '/manifest.json'
  // Removed '/index.css' because Vite renames CSS files in production, causing 404s
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // We use a catch here so one missing file doesn't break the whole service worker
        return cache.addAll(urlsToCache).catch(err => {
            console.error('Failed to cache some files:', err);
        });
      })
  );
});

self.addEventListener('fetch', event => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }

        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Don't cache Google Analytics or AdSense calls
            if (event.request.url.includes('google') || event.request.url.includes('analytics')) {
                return response;
            }

            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(() => {
            // Fallback if offline and not in cache
            // You could return a custom offline page here if you have one
        });
      })
  );
});

self.addEventListener('activate', event => {
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
