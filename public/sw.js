const CACHE_NAME = 'soul-online-alpha-v1-23';
const APP_SHELL = ['./', './index.html', './manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => undefined));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('soul-online-alpha-') && key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

function isRuntimeAsset(url) {
  return /\.(js|mjs|css|map)(\?|$)/i.test(url.pathname) || url.pathname.endsWith('/index.html') || url.pathname === '/' || url.pathname === './';
}

function isLargeStatic(url, request) {
  if (request.destination === 'image' || request.destination === 'audio' || request.destination === 'video') return true;
  if (/\.(png|jpe?g|webp|gif|avif|mp3|ogg|wav)(\?|$)/i.test(url.pathname)) return true;
  return url.pathname.includes('/assets/soulpack/') || url.pathname.includes('/assets/soulpack-lite/');
}

async function networkFirst(request, fallbackUrl) {
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response && response.status === 200) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => undefined);
    }
    return response;
  } catch {
    return (await caches.match(request)) || (fallbackUrl ? await caches.match(fallbackUrl) : undefined) || Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request, './index.html'));
    return;
  }

  if (isRuntimeAsset(requestUrl)) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  if (isLargeStatic(requestUrl, event.request)) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      if (response && response.status === 200) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => undefined);
      }
      return response;
    }).catch(() => cached || caches.match('./index.html')))
  );
});
