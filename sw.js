// Service worker: de app opent ook zonder of met slecht bereik.
// Pagina en manifest: eerst het netwerk (altijd de nieuwste versie), na 4 s of zonder netwerk de bewaarde kopie.
// Kaartbibliotheek en iconen: uit de cache.
const CACHE = 'locatie-v5';
const LOCAL = ['./', 'index.html', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];
const CDN = [
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.all(LOCAL.concat(CDN).map((u) => c.add(u).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (CDN.includes(req.url)) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => {
      const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return r;
    })));
    return;
  }

  if (url.origin === self.location.origin) {
    const isPage = req.mode === 'navigate' || /\.(html|webmanifest)$/.test(url.pathname) || url.pathname.endsWith('/');
    if (isPage) {
      e.respondWith((async () => {
        const net = fetch(req).then((r) => {
          if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
          return r;
        });
        const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('traag')), 4000));
        try { return await Promise.race([net, timeout]); }
        catch (err) { return (await caches.match(req, { ignoreSearch: true })) || (await caches.match('index.html')) || net; }
      })());
    } else {
      e.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
    }
  }
});
