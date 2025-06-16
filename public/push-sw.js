// Push Notification Service Worker
// Customers download and host this file on their domain
// Version: 2.0.0 - Added click tracking

const SW_VERSION = 'v2.2.0';

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...', SW_VERSION);
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
    tag: data.tag || `notification-${Date.now()}`,
    requireInteraction: data.requireInteraction !== false ? true : false,
    silent: data.silent || false,
    data: {
      url: data.data?.url || data.url || '/',
      campaignId: data.data?.campaignId || data.campaignId,
      clientId: data.data?.clientId || data.clientId,
      notificationId: data.data?.notificationId || data.notificationId,
      actions: data.actions || []
    },
    actions: data.actions || [],
    vibrate: data.vibrate || [200, 100, 200]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Notification', options)
      .then(() => {
        console.log('[Service Worker] Notification shown');
        // Track notification display
        if (data.data?.campaignId) {
          return fetch(self.location.origin + '/api/notifications/track-display', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              campaignId: data.data.campaignId,
              clientId: data.data.clientId
            })
          }).catch(err => console.error('Failed to track display:', err));
        }
      })
      .catch(err => console.error('[Service Worker] Error showing notification:', err))
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const data = event.notification.data;
  let url = data.url || '/';
  
  // Handle action button clicks
  if (event.action) {
    console.log('[Service Worker] Action clicked:', event.action);
    // Find the action in the notification data
    const actions = event.notification.actions || [];
    const clickedAction = actions.find(a => a.action === event.action);
    if (clickedAction && data.actions) {
      // Find the original action data with URL
      const originalAction = data.actions.find(a => a.action === event.action);
      if (originalAction && originalAction.url) {
        url = originalAction.url;
      }
    }
  }
  
  const campaignId = data.campaignId;
  const clientId = data.clientId;
  
  // Track click and open URL
  event.waitUntil(
    (async () => {
      try {
        // Track the click
        if (campaignId && clientId) {
          await fetch(self.location.origin + '/api/notifications/track-click', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              campaignId: campaignId,
              clientId: clientId,
              action: event.action || 'default'
            })
          });
        }
      } catch (error) {
        console.error('Failed to track click:', error);
      }
      
      // Always open the URL
      return clients.openWindow(url);
    })()
  );
});

self.addEventListener('notificationclose', (event) => {
  // Track close/dismiss event
  const campaignId = event.notification.data.campaignId;
  const clientId = event.notification.data.clientId;
  
  if (campaignId) {
    fetch(self.location.origin + '/api/campaigns/track-dismiss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId: campaignId
      })
    }).catch(err => console.error('Failed to track dismiss:', err));
  }
});