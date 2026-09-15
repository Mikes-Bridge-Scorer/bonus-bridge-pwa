/* =============================================================
   Bonus Bridge PWA — Service Worker (v4)
   Strategy change: network-first for everything, falling back to
   cache only when offline. This means future deploys just work —
   you no longer need to remember to bump CACHE_VERSION every time
   you push a change. (The old cache-first strategy silently served
   stale JS/HTML forever, since the browser only reinstalls a
   service worker when this file's own content changes.)
   ============================================================= */

const CACHE_VERSION = 'bonus-bridge-v4';

// Static assets that never change names (safe to list explicitly)
const STATIC_URLS = [
  './',
  './index.html',
  './manifest.json',
  './asset-manifest.json',
  './favicon.ico',
  './logo192.png',
  './logo512.png',
];

// ── INSTALL ──────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);

      // Cache the known static assets as an offline fallback only —
      // these are no longer served cache-first, see fetch handler below
      try {
        await cache.addAll(STATIC_URLS);
      } catch (err) {
        console.warn('[SW] Could not pre-cache static assets:', err);
      }

      // Fetch asset-manifest.json and cache every hashed file it lists,
      // again purely as an offline fallback
      try {
        const manifestResponse = await fetch('./asset-manifest.json');
        if (!manifestResponse.ok) throw new Error('asset-manifest fetch failed');

        const manifest = await manifestResponse.json();
        const hashedUrls = Object.values(manifest.files || manifest);

        const localUrls = hashedUrls.filter(
          (url) =>
            typeof url === 'string' &&
            !url.startsWith('http') &&
            !url.startsWith('data:') &&
            url !== ''
        );

        await cache.addAll(localUrls);
        console.log('[SW] Cached', localUrls.length, 'hashed assets from manifest');
      } catch (err) {
        console.warn('[SW] Could not cache from asset-manifest.json:', err);
      }

      // Activate immediately (don't wait for old tabs to close)
      self.skipWaiting();
    })()
  );
});

// ── ACTIVATE ─────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Delete all caches that aren't the current version
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      );
      // Take control of all open clients immediately
      await self.clients.claim();
    })()
  );
});

// ── FETCH ────────────────────────────────────────────────────
// Network-first: always try to get the freshest version from the
// server. Only fall back to the offline cache if the network fails
// (i.e. genuinely offline). This means new deploys are picked up
// immediately on next load, with no manual version-bumping needed.
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests (analytics, etc.)
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      try {
        const networkResponse = await fetch(event.request);

        // Keep the offline-fallback cache up to date with whatever
        // we just successfully fetched
        if (networkResponse.ok) {
          const cache = await caches.open(CACHE_VERSION);
          cache.put(event.request, networkResponse.clone());
        }

        return networkResponse;
      } catch {
        // Offline — fall back to whatever we have cached
        const cached = await caches.match(event.request);
        if (cached) return cached;

        // Not cached either — fall back to the app shell so the app
        // still loads in some form
        const appShell = await caches.match('./index.html');
        if (appShell) return appShell;

        return new Response('Offline — please open the app while connected first', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' },
        });
      }
    })()
  );
});
