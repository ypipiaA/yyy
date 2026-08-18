/**
 * FitTrack Service Worker
 * 支持离线使用和缓存策略
 */

const CACHE_NAME = 'fittrack-v2';
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
  './js/stats.js',
  './js/body.js',
  './js/nutrition.js',
  './js/nutrition-ui.js',
  './js/achievements.js',
  './js/achievements-ui.js',
  './js/theme.js',
  './js/settings.js',
  './manifest.json',
  './icons/icon-72x72.png',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
];

// 安装事件
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Failed to cache:', error);
      })
  );
});

// 激活事件
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 请求事件 - 网络优先策略
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 如果是有效的响应，克隆并缓存
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // 网络失败时使用缓存
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            // 如果缓存中也没有，返回离线页面
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
          });
      })
  );
});

// 后台同步
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

// 数据同步函数
async function syncData() {
  try {
    // 这里可以实现与后端的数据同步逻辑
    console.log('Syncing data...');
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// 推送通知
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : '你有新的训练提醒',
    icon: './icons/icon-192x192.png',
    badge: './icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      { action: 'explore', title: '查看详情', icon: './icons/icon-72x72.png' },
      { action: 'close', title: '关闭', icon: './icons/icon-72x72.png' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification('FitTrack', options)
  );
});

// 通知点击事件
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('./')
    );
  }
});