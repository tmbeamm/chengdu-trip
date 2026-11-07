/* Offline cache for Chengdu Trip.
   Open the site once while online; after that it loads from the phone even without internet.
   Pages and files are served from cache first, then refreshed in the background when online.
   Bump VERSION when the list of files below changes. */
const VERSION = 'chengdu-trip-v4';
const PRECACHE = [
  './',
  'index.html',
  'assets/hero-panda.webp',
  'assets/hero-panda-800.webp',
  'assets/fonts/mitr-400-thai.woff2',
  'assets/fonts/mitr-400-latin.woff2',
  'assets/fonts/mitr-500-thai.woff2',
  'assets/fonts/mitr-500-latin.woff2',
  'assets/fonts/mitr-600-thai.woff2',
  'assets/fonts/mitr-600-latin.woff2',
  'assets/fonts/sarabun-400-thai.woff2',
  'assets/fonts/sarabun-400-latin.woff2',
  'assets/fonts/sarabun-700-thai.woff2',
  'assets/fonts/sarabun-700-latin.woff2'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(VERSION).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== VERSION).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Amap and other outside links go straight to the network

  const isMainPage = request.mode === 'navigate' &&
    (url.pathname.endsWith('/') || url.pathname.endsWith('/index.html'));
  const cacheKey = isMainPage ? 'index.html' : request;

  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const cached = await cache.match(cacheKey, { ignoreSearch: true });
    const fromNetwork = fetch(request)
      .then(response => {
        if (response && response.ok) cache.put(cacheKey, response.clone());
        return response;
      })
      .catch(() => null);

    if (cached) {
      event.waitUntil(fromNetwork);
      return cached;
    }
    const response = await fromNetwork;
    return response || new Response('ออฟไลน์อยู่ — เปิดเว็บนี้ตอนมีเน็ตก่อน 1 ครั้ง', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  })());
});
