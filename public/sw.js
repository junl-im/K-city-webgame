const CACHE_NAME = 'soul-online-alpha-v1-32';
const APP_SHELL = ['./', './index.html', './manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => undefined));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key.startsWith('soul-online-alpha-') && key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

function isHtmlShell(url) {
  return url.pathname === '/' || url.pathname.endsWith('/index.html');
}

function isImmutableAsset(url) {
  return /\/assets\/.+\.(js|mjs|css|png|jpe?g|webp|gif|avif|svg|woff2?)(\?|$)/i.test(url.pathname);
}

function isLargeMedia(url, request) {
  if (request.destination === 'image' || request.destination === 'audio' || request.destination === 'video') return true;
  return /\.(png|jpe?g|webp|gif|avif|mp3|ogg|wav)(\?|$)/i.test(url.pathname);
}

async function networkFirstShell(request, fallbackUrl) {
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

async function cacheFirstImmutable(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.status === 200) {
    const copy = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => undefined);
  }
  return response;
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SOUL_CLEAR_OLD_CACHES') {
    event.waitUntil(
      caches.keys().then((keys) => Promise.all(keys
        .filter((key) => key.startsWith('soul-online-alpha-') && key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
    );
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate' || isHtmlShell(requestUrl)) {
    event.respondWith(networkFirstShell(event.request, './index.html'));
    return;
  }

  if (isImmutableAsset(requestUrl)) {
    event.respondWith(cacheFirstImmutable(event.request));
    return;
  }

  if (isLargeMedia(requestUrl, event.request)) {
    // 2.5D 고해상도 이미지는 그래픽 품질을 유지하되, 브라우저 HTTP 캐시 정책을 따른다.
    // 서비스워커가 no-store로 매번 재요청하지 않도록 기본 fetch를 사용한다.
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
