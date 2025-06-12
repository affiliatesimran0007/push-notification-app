// Service Worker for Subscribe Pages
// This handles push notifications for the simple integration methods

self.addEventListener('install', (event) => {
  console.log('[Subscribe SW] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Subscribe SW] Activating...');
  event.waitUntil(clients.claim());
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[Subscribe SW] Push received:', event);
  
  if (!event.data) {
    console.log('[Subscribe SW] No data in push event');
    return;
  }

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    console.error('[Subscribe SW] Error parsing push data:', e);
    return;
  }

  const options = {
    body: data.message || 'You have a new notification',
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/badge-72x72.png',
    image: data.image,
    vibrate: [200, 100, 200],
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    renotify: data.renotify || false,
    silent: data.silent || false,
    timestamp: data.timestamp || Date.now(),
    actions: data.actions || [],
    data: {
      url: data.url || '/',
      campaignId: data.campaignId,
      clientId: data.clientId
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'New Notification', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Subscribe SW] Notification clicked:', event);
  
  event.notification.close();

  const url = event.notification.data?.url || '/';
  const campaignId = event.notification.data?.campaignId;
  const clientId = event.notification.data?.clientId;

  // Track click if we have tracking data
  if (campaignId && clientId) {
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'click',
        campaignId,
        clientId
      })
    }).catch(console.error);
  }

  // Open or focus the URL
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if URL is already open
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if not found
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[Subscribe SW] Notification closed:', event);
  
  const campaignId = event.notification.data?.campaignId;
  const clientId = event.notification.data?.clientId;

  // Track dismissal if we have tracking data
  if (campaignId && clientId) {
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'dismiss',
        campaignId,
        clientId
      })
    }).catch(console.error);
  }
});