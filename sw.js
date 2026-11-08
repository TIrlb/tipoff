// Offline cache. Bump CACHE and APP_VERSION (app.js) together on every release.
const CACHE = 'tipoff-v1.8.1';
const ASSETS = ['./','index.html','app.css','rotation.js','court.js','app.js','sync.js','manifest.webmanifest','bc-600.woff2','bc-700.woff2','bc-800.woff2','logo-mark.png','logo-full.png','icon-180.png','icon-192.png','icon-512.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' ? await cache.match('index.html') : null);
    const refresh = fetch(req).then(r => { if (r && r.ok) cache.put(req, r.clone()); return r; }).catch(() => null);
    if (hit) { e.waitUntil(refresh); return hit; }
    return (await refresh) || new Response('Offline', { status: 503 });
  })());
});
