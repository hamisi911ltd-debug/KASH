/* KASH website photo cache. Photos load from the device straight away on repeat visits and
   refresh quietly in the background, so a replaced photo still shows up. Nothing else is cached. */
const CACHE = 'kash-photos-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(
  caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || !/\/images\/.+\.(webp|jpe?g|png|svg)$/i.test(u.pathname)) return;
  e.respondWith(caches.open(CACHE).then(async (cache) => {
    const hit = await cache.match(r);
    const fresh = fetch(r).then((res) => { if (res.ok) cache.put(r, res.clone()); return res; }).catch(() => hit);
    return hit || fresh;
  }));
});
