// Push Notification Service Worker
// Customers download and host this file on their domain

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push event received');
  
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
    console.log('[Service Worker] Push data:', data);
  } catch (e) {
    console.error('[Service Worker] Error parsing push data:', e);
  }
  
  const options = {
    body: data.body || data.message || 'You have a new notification',
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/badge-72x72.png',
    image: data.image,
    tag: data.tag || 'notification',
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    data: {
      url: data.data?.url || data.url || '/',
      campaignId: data.data?.campaignId || data.campaignId,
      notificationId: data.data?.notificationId || data.notificationId
    },
    actions: data.actions || [],
    vibrate: data.vibrate || [200, 100, 200]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Notification', options)
      .then(() => console.log('[Service Worker] Notification shown'))
      .catch(err => console.error('[Service Worker] Error showing notification:', err))
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const url = event.notification.data.url || '/';
  const campaignId = event.notification.data.campaignId;
  const notificationId = event.notification.data.notificationId;
  
  // Open URL
  event.waitUntil(
    clients.openWindow(url).then(() => {
      // Track click analytics
      return fetch('http://localhost:3000/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'notification_clicked',
          campaignId: campaignId,
          notificationId: notificationId,
          timestamp: new Date().toISOString()
        })
      });
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  // Track close event
  const campaignId = event.notification.data.campaignId;
  const notificationId = event.notification.data.notificationId;
  
  fetch('http://localhost:3000/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'notification_closed',
      campaignId: campaignId,
      notificationId: notificationId,
      timestamp: new Date().toISOString()
    })
  });
});