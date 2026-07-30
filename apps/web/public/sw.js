/* Overhear service worker — app shell, visited-page fallback, offline page.
 * M4 replaces this with full offline support (Serwist, versioned packs). */
const VERSION = 'overhear-m3-v1';
const SHELL_CACHE = `${VERSION}-shell`;
const STATIC_CACHE = `${VERSION}-static`;
const PAGES_CACHE = `${VERSION}-pages`;
const OFFLINE_URL = '/offline';
/* SOS must survive airplane mode even if never visited: precache it. */
const PRECACHE_PAGES = [OFFLINE_URL, '/essentials', '/', '/ride'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE_PAGES))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // Navigations: network first; cache good responses so visited pages work
  // offline; fall back to the cached page, precached shell, then /offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(PAGES_CACHE).then((cache) => cache.put(request, copy));
          }
          return res;
        })
        .catch(async () => {
          const cached =
            (await caches.match(request)) ?? (await caches.match(OFFLINE_URL));
          return cached ?? Response.error();
        }),
    );
    return;
  }

  // Hashed build assets + icons: cache first.
  const url = new URL(request.url);
  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/'))
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
            return res;
          }),
      ),
    );
  }
});
