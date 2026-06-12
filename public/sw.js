const CACHE_NAME = 'soul-online-alpha-v1-15';
const APP_SHELL = ['./', './index.html', './manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => undefined));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

function shouldRuntimeCache(request, url) {
  if (request.destination === 'image') return false;
  if (/\.(png|jpe?g|webp|gif|avif|mp3|ogg|wav)(\?|$)/i.test(url.pathname)) return false;
  if (url.pathname.includes('/assets/soulpack/') || url.pathname.includes('/assets/soulpack-lite/')) return false;
  return true;
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;
  const cacheable = shouldRuntimeCache(event.request, requestUrl);

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || !cacheable) return response || cached;
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => undefined);
          return response;
        })
        .catch(() => cached || caches.match('./index.html') || caches.match('./'));
    })
  );
});
