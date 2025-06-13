// Push Notification Service Worker
// This file should be hosted on YOUR domain at the root (e.g., https://yourdomain.com/push-sw.js)
// It handles push notifications sent from the push notification platform

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push received');
  
  if (!event.data) {
    console.log('[Service Worker] No data in push event');
    return;
  }

  try {
    const data = event.data.json();
    console.log('[Service Worker] Push data:', data);
    
    const options = {
      body: data.body || 'You have a new notification',
      icon: data.icon || '/icon-192x192.png',
      badge: data.badge || '/icon-192x192.png',
      vibrate: data.vibrate || [200, 100, 200],
      data: {
        url: data.url || '/',
        campaignId: data.campaignId,
        notificationId: data.notificationId,
        clientId: data.clientId,
        trackingUrl: data.trackingUrl
      }
    };
    
    // Add image if provided
    if (data.image) {
      options.image = data.image;
    }
    
    // Add actions if provided
    if (data.actions && Array.isArray(data.actions)) {
      options.actions = data.actions.map(action => ({
        action: action.action,
        title: action.title,
        icon: action.icon
      }));
    }
    
    // Show the notification
    event.waitUntil(
      self.registration.showNotification(data.title || 'Notification', options)
    );
  } catch (error) {
    console.error('[Service Worker] Error parsing push data:', error);
  }
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification clicked');
  event.notification.close();
  
  const data = event.notification.data;
  
  // Track the click if tracking URL provided
  if (data.trackingUrl && data.clientId) {
    // Fire and forget the tracking request
    fetch(data.trackingUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId: data.campaignId,
        notificationId: data.notificationId,
        clientId: data.clientId,
        action: event.action || 'click',
        timestamp: new Date().toISOString()
      })
    }).catch(err => console.error('[Service Worker] Failed to track click:', err));
  }
  
  // Handle action buttons
  let urlToOpen = data.url || '/';
  
  if (event.action) {
    // If an action button was clicked, handle it
    console.log('[Service Worker] Action clicked:', event.action);
    // You can customize URLs based on actions here
  }
  
  // Open the URL
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Check if any client is already on the target URL
      for (let client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If no existing window, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('notificationclose', function(event) {
  console.log('[Service Worker] Notification closed');
  // You can add dismiss tracking here if needed
});

// Update service worker immediately
self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing...');
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    clients.claim().then(() => {
      console.log('[Service Worker] Active and ready');
    })
  );
});