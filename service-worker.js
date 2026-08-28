/**
 * FitTrack Service Worker
 * 双缓存策略：预缓存（版本化）+ 运行时缓存
 * - 导航请求：network-first，失败回退 index.html
 * - /api/ 请求：不拦截（network-only）
 * - 静态资源（含跨域 CDN）：cache-first，未命中写入 runtime 缓存
 */

const PRECACHE_NAME = 'fittrack-precache-v5';
const RUNTIME_NAME = 'fittrack-runtime';

const urlsToCache = [
  './',
  './index.html',
  './css/style.css',
  './js/api.js',
  './js/app.js',
  './js/exercises.js',
  './js/plans.js',
  './js/storage.js',
  './js/timer.js',
  './js/records.js',
  './js/heatmap.js',
  './js/stats.js',
  './js/body.js',
  './js/nutrition.js',
  './js/nutrition-ui.js',
  './js/achievements.js',
  './js/achievements-ui.js',
  './js/theme.js',
  './js/settings.js',
  './js/workout-session.js',
  './js/plan-editor.js',
  './js/vendor/chart.umd.min.js',
  './manifest.json',
  './icons/icon-72x72.png',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
];

// 安装：预缓存失败必须导致安装失败（不吞错），避免"半缓存"假象
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PRECACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// 激活：只清理非当前 precache 且非 runtime 的旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== PRECACHE_NAME && name !== RUNTIME_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

function offlineResponse() {
  return new Response('', { status: 503, statusText: 'offline' });
}

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // 非 GET 请求直接放行（不 respondWith）
  if (request.method !== 'GET') return;

  // API 请求不拦截（network-only）
  const url = new URL(request.url);
  if (url.pathname.includes('/api/')) return;

  // 导航请求：network-first，离线回退 index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('./index.html').then((cached) => cached || offlineResponse())
      )
    );
    return;
  }

  // 其余静态资源：cache-first，未命中 fetch 后写入 runtime 缓存
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          // 允许 basic 与 cors 响应写缓存；opaque 不缓存直接透传
          if (
            response &&
            response.status === 200 &&
            (response.type === 'basic' || response.type === 'cors')
          ) {
            const responseToCache = response.clone();
            caches
              .open(RUNTIME_NAME)
              .then((cache) => cache.put(request, responseToCache));
          }
          return response;
        })
        .catch(() => offlineResponse());
    })
  );
});

// 更新提示：页面发送 SKIP_WAITING 后立即接管
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
