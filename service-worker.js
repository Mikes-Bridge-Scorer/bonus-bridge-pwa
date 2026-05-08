/* =============================================================
   Bonus Bridge PWA — Service Worker
   Strategy: fetch asset-manifest.json at install time so we
   always cache the correct hashed filenames from the CRA build.
   Version bump here forces the old SW to be replaced.
   ============================================================= */

const CACHE_VERSION = 'bonus-bridge-v3';

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

      // 1. Cache the known static assets
      await cache.addAll(STATIC_URLS);

      // 2. Fetch asset-manifest.json and cache every hashed file it lists
      try {
        const manifestResponse = await fetch('./asset-manifest.json');
        if (!manifestResponse.ok) throw new Error('asset-manifest fetch failed');

        const manifest = await manifestResponse.json();

        // CRA asset-manifest has a "files" map: { "main.css": "/static/...", ... }
        const hashedUrls = Object.values(manifest.files || manifest);

        // Filter to files hosted on this origin (skip CDN / data URIs)
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
        // Don't throw — static assets are already cached; app will still work
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
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests (analytics, etc.)
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      // Cache-first strategy: serve from cache, fall back to network
      const cached = await caches.match(event.request);
      if (cached) return cached;

      try {
        const networkResponse = await fetch(event.request);

        // Cache successful GET responses for future offline use
        if (networkResponse.ok) {
          const cache = await caches.open(CACHE_VERSION);
          cache.put(event.request, networkResponse.clone());
        }

        return networkResponse;
      } catch {
        // Offline and not cached — return the app shell so the app still loads
        const appShell = await caches.match('./index.html');
        if (appShell) return appShell;

        // Last resort
        return new Response('Offline — please open the app while connected first', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' },
        });
      }
    })()
  );
});
