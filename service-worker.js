/* eslint-disable no-restricted-globals */

// This service worker file should be placed in your public folder
// IMPORTANT: Update version numbers when releasing new versions
const CACHE_NAME = 'bonus-bridge-cache-v1.0.2';
const APP_VERSION = '1.0.2';  // Keep in sync with index.js

// Files to cache for offline use - Updated for build output
const urlsToCache = [
  '/',
  '/index.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json',
  '/favicon.svg',
  '/logo192.png',
  '/logo512.png'
];

// Install handler - cache initial resources
self.addEventListener('install', event => {
  console.log('Service Worker: Installing version', APP_VERSION);
  
  // Force new service worker to activate immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Opened cache');
        // Try to cache resources, but don't fail if some are missing
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(error => {
              console.warn('Service Worker: Failed to cache', url, error);
              return null;
            })
          )
        ).then(() => {
          console.log('Service Worker: Resources cached (with possible warnings)');
        });
      })
      .catch(error => {
        console.error('Service Worker: Cache opening failed', error);
      })
  );
});

// Activation handler - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating version', APP_VERSION);
  
  const cacheWhitelist = [CACHE_NAME];
  
  // Take control of all clients immediately
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
      
      // Claim all clients
      self.clients.claim().then(() => {
        console.log('Service Worker: Claimed all clients');
        // After claiming clients, send update notification
        return self.clients.matchAll().then(clients => {
          return Promise.all(
            clients.map(client => {
              return client.postMessage({
                type: 'APP_UPDATED',
                version: APP_VERSION
              });
            })
          );
        });
      })
    ])
  );
});

// Fetch handler - serve cached content when offline
self.addEventListener('fetch', event => {
  // Skip cross-origin requests and non-GET requests
  if (!event.request.url.startsWith(self.location.origin) || 
      event.request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          console.log('Service Worker: Serving from cache:', event.request.url);
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
                if (!event.request.url.includes('/api/') && 
                    !event.request.url.includes('sockjs-node')) {
                  cache.put(event.request, responseToCache);
                  console.log('Service Worker: Cached new resource:', event.request.url);
                }
              });
              
            return response;
          })
          .catch(error => {
            console.warn('Service Worker: Fetch failed for:', event.request.url, error);
            
            // If fetch fails (when offline), try to serve the offline page
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            // For other requests, just let them fail gracefully
            throw error;
          });
      })
  );
});

// Listen for messages from clients
self.addEventListener('message', event => {
  console.log('Service Worker: Message received', event.data);
  
  // Handle skip waiting message (immediate update)
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service Worker: Skip waiting and activate now');
    self.skipWaiting();
  }
  
  // Handle version info messages
  if (event.data && event.data.type === 'VERSION_INFO') {
    console.log('Service Worker: Received version info', event.data.version);
  }
});