// FlashPay Service Worker — Handles push notifications for Soundbox

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const { title, body, icon, badge, data: payload, actions, tag, requireInteraction } = data;

  const notificationOptions = {
    body,
    icon: icon || '/icon-192.png',
    badge: badge || '/badge-72.png',
    data: payload,
    actions: actions || [],
    tag: tag || 'flashpay-payment',
    requireInteraction: requireInteraction || false,
    silent: false,
    vibrate: [200, 100, 200, 100, 400],
  };

  event.waitUntil(
    self.registration.showNotification(title, notificationOptions)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data;
  const url = data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({
            type: 'PAYMENT_RECEIVED',
            amount: data?.amount,
            customerName: data?.customerName,
          });
          return client.focus();
        }
      }
      // Open a new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Cache static assets
const CACHE_NAME = 'flashpay-v1';
const STATIC_ASSETS = ['/', '/dashboard', '/invoice/new'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Network-first strategy for API calls
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
