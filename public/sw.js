/* KASH ERP service worker: lets the app install on a phone or computer and open its screen
   even with a weak connection. Business data always comes live from the server and is never stored here. */
const SHELL = 'kash-erp-shell-v1';
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(['/', '/icon-192.png', '/logo.png'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => e.waitUntil(
  caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== SHELL).map((k) => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;           /* the API lives on another address: untouched */
  if (u.pathname.startsWith('/assets/')) {                                  /* hashed files never change: cache first */
    e.respondWith(caches.open(SHELL).then(async (c) => (await c.match(r)) || fetch(r).then((res) => { if (res.ok) c.put(r, res.clone()); return res; })));
    return;
  }
  if (r.mode === 'navigate') {                                              /* the page: fresh when online, saved copy when not */
    e.respondWith(fetch(r).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(SHELL).then((c) => c.put('/', copy)); } return res; })
      .catch(async () => (await caches.match('/')) || new Response('<h1>You are offline</h1><p>Check your internet connection and try again.</p>', { status: 503, headers: { 'Content-Type': 'text/html' } })));
  }
});
