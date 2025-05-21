// Bonus Bridge PWA Service Worker
// This integrates with a trial system

// IMPORTANT: Update this version number when releasing updates
const CACHE_NAME = 'bonus-bridge-cache-v1.0.1';
const APP_VERSION = '1.0.1';

// List of all assets to cache for offline use
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/main.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.svg',
  '/logo192.png',
  '/logo512.png'
];

// Install handler - cache initial resources
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  // Force new service worker to activate immediately, replacing the old one
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Service Worker: Cache error', error);
      })
  );
});

// Activation handler - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  const cacheWhitelist = [CACHE_NAME];
  
  // Take control of all open clients immediately
  self.clients.claim();
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Notify all clients about the update
      self.clients.matchAll().then(clients => {
        return Promise.all(clients.map(client => {
          return client.postMessage({
            type: 'APP_UPDATED',
            version: APP_VERSION
          });
        }));
      })
    ])
  );
});

// Fetch handler - serve cached content when offline
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Clone the request because it's a one-time use stream
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest)
          .then(response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response because it's a one-time use stream
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                // Don't cache API requests or similar dynamic content
                if (!event.request.url.includes('/api/')) {
                  cache.put(event.request, responseToCache);
                }
              });
              
            return response;
          })
          .catch(error => {
            console.error('Service Worker: Fetch error', error);
            
            // If fetch fails (when offline), try to serve the offline page
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Listen for messages from clients
self.addEventListener('message', event => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'CHECK_FOR_UPDATE') {
    // Respond with current version
    event.ports[0].postMessage({
      type: 'UPDATE_STATUS',
      version: APP_VERSION
    });
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});