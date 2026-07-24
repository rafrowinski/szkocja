const CACHE = 'trip-shell-v1';
const RUNTIME = 'trip-runtime-v1';
const CORE = [
  './',
  './index.html',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(k => k !== CACHE && k !== RUNTIME).map(k => caches.delete(k))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // nawigacja: najpierw sieć, offline -> cache
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then(r => {
      const copy = r.clone();
      caches.open(CACHE).then(c => c.put('./index.html', copy));
      return r;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  // kafelki OSM, zdjęcia, API wiki/commons, CDN: cache-first z douzupełnianiem
  const cacheable = ['tile.openstreetmap.org','upload.wikimedia.org','i0.wp.com',
    'en.wikipedia.org','commons.wikimedia.org','cdnjs.cloudflare.com'].some(h => url.hostname.endsWith(h));
  if (cacheable) {
    e.respondWith(caches.match(e.request).then(hit => {
      const net = fetch(e.request).then(r => {
        if (r.ok) { const copy = r.clone(); caches.open(RUNTIME).then(c => c.put(e.request, copy)); }
        return r;
      }).catch(() => hit);
      return hit || net;
    }));
  }
});
