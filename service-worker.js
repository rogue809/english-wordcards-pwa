// 缓存名称和要缓存的资源列表
const CACHE_NAME = 'flashcards-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// 安装 Service Worker 并缓存所有资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('缓存已打开');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // 强制新的 Service Worker 立即激活
  );
});

// 激活时清除旧缓存
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // 控制所有打开的页面
  );
});

// 请求拦截处理
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 缓存命中，直接返回缓存的资源
        if (response) {
          return response;
        }
        
        // 克隆请求，因为请求可能被使用一次
        const fetchRequest = event.request.clone();
        
        // 发起网络请求
        return fetch(fetchRequest).then(
          response => {
            // 检查是否是有效的响应
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // 克隆响应，因为响应是流，只能使用一次
            const responseToCache = response.clone();
            
            // 将响应添加到缓存
            caches.open(CACHE_NAME)
              .then(cache => {
                // 只缓存同源请求
                if (event.request.url.startsWith(self.location.origin)) {
                  cache.put(event.request, responseToCache);
                }
              });
            
            return response;
          }
        );
      })
      .catch(() => {
        // 离线时且缓存不存在时返回的回退资源
        if (event.request.url.indexOf('.html') > -1) {
          return caches.match('/index.html');
        }
      })
  );
});

// 后台同步处理（当网络连接恢复时同步数据）
self.addEventListener('sync', event => {
  if (event.tag === 'sync-flashcards') {
    event.waitUntil(syncData());
  }
});

// 同步数据到GitHub的函数
function syncData() {
  return self.clients.matchAll().then(clients => {
    if (clients.length === 0) return;
    
    // 向客户端页面发消息，请求执行同步
    return clients[0].postMessage({
      type: 'SYNC_REQUIRED'
    });
  });
}