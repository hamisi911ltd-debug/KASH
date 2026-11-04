/* KASH website service worker.
   - Photos: shown from the device straight away, refreshed quietly in the background.
   - Pages, styles and scripts: always fetched fresh when online, and kept so the site still opens offline.
   - Never touches the API or anything on another address. */
const PHOTOS = 'kash-photos-v1';
const SHELL = 'kash-shell-v1';
const KEEP = [PHOTOS, SHELL];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(['/', '/offline.html'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => e.waitUntil(
  caches.keys().then((keys) => Promise.all(keys.filter((k) => !KEEP.includes(k)).map((k) => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  if (/\/images\/.+\.(webp|jpe?g|png|svg)$/i.test(u.pathname)) {
    e.respondWith(caches.open(PHOTOS).then(async (cache) => {
      const hit = await cache.match(r);
      const fresh = fetch(r).then((res) => { if (res.ok) cache.put(r, res.clone()); return res; }).catch(() => hit);
      return hit || fresh;
    }));
    return;
  }
  if (r.mode === 'navigate' || /\.(js|css|webmanifest)$/i.test(u.pathname)) {
    e.respondWith(fetch(r).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(SHELL).then((c) => c.put(r.mode === 'navigate' ? '/' : r, copy)); }
      return res;
    }).catch(async () => (await caches.match(r.mode === 'navigate' ? '/' : r)) || (r.mode === 'navigate' ? caches.match('/offline.html') : Response.error())));
  }
});
