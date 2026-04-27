// Minimal cache-first service worker for offline-friendly PWA experience.
// Conservative: caches static assets, network-first for API + HTML.

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `nandan-static-${CACHE_VERSION}`;

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Never cache API calls
  if (url.pathname.includes('/api/')) return;

  // Network-first for HTML (always get fresh routes)
  if (req.destination === 'document') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(STATIC_CACHE).then((c) => c.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('/portfolio/'))),
    );
    return;
  }

  // Cache-first for static assets (JS, CSS, fonts, images)
  if (
    req.destination === 'script' ||
    req.destination === 'style' ||
    req.destination === 'font' ||
    req.destination === 'image'
  ) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(req, clone));
            }
            return res;
          }),
      ),
    );
  }
});
