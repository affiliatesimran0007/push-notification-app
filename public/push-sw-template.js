// Push Notification Service Worker
// This file should be hosted on YOUR domain at the root (e.g., https://yourdomain.com/push-sw.js)
// It handles push notifications sent from the push notification platform
// Version: 1.2.2 - Fixed dismiss tracking URL and hero image support

const SW_VERSION = 'v1.2.2';

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push received at:', new Date().toISOString());
  console.log('[Service Worker] User visible only:', event.data ? 'has data' : 'no data');
  
  // Log system notification state
  if ('Notification' in self) {
    console.log('[Service Worker] Notification API available');
    console.log('[Service Worker] Permission:', Notification.permission);
  }
  
  let data = {};
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      // Firefox sometimes sends data as text
      try {
        data = JSON.parse(event.data.text());
      } catch (e2) {
        console.error('[Service Worker] Failed to parse push data');
        data = { title: 'Notification', body: 'You have a new notification' };
      }
    }
  }
  
  console.log('[Service Worker] Push data:', data);
  
  // Browser-compatible notification options
  const options = {
    body: data.body || data.message || 'You have a new notification',
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/icon-192x192.png',
    tag: data.tag || `notification-${Date.now()}`,
    renotify: true,
    requireInteraction: true, // Keep notifications persistent on desktop
    data: {
      url: data.url || data.data?.url || '/',
      campaignId: data.campaignId || data.data?.campaignId,
      notificationId: data.notificationId || data.data?.notificationId,
      clientId: data.clientId || data.data?.clientId,
      trackingUrl: data.trackingUrl || data.data?.trackingUrl,
      actions: data.actions || []
    }
  };
  
  // Add vibrate only if supported
  if ('vibrate' in navigator) {
    options.vibrate = data.vibrate || [200, 100, 200];
  }
  
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
  
  // Show the notification with enhanced debugging
  event.waitUntil(
    (async () => {
      const startTime = Date.now();
      console.log('[Service Worker] === NOTIFICATION DISPLAY ATTEMPT ===');
      console.log('[Service Worker] Time:', new Date().toISOString());
      console.log('[Service Worker] Title:', data.title || 'Notification');
      console.log('[Service Worker] Tag:', options.tag);
      
      try {
        // Show notification
        await self.registration.showNotification(data.title || 'Notification', options);
        
        console.log('[Service Worker] ✅ showNotification() succeeded');
        console.log('[Service Worker] Duration:', Date.now() - startTime, 'ms');
        
        // Verify notification exists
        const notifications = await self.registration.getNotifications();
        const found = notifications.find(n => n.tag === options.tag);
        
        if (found) {
          console.log('[Service Worker] ✅ Notification verified in API');
          console.log('[Service Worker] Total active notifications:', notifications.length);
        } else {
          console.warn('[Service Worker] ⚠️ Notification created but not found in getNotifications()');
          console.warn('[Service Worker] This suggests OS/browser blocking!');
        }
        
        // Additional diagnostics
        console.log('[Service Worker] Diagnostic info:');
        console.log('  - Permission:', Notification.permission);
        console.log('  - Client type:', self.clients.matchAll ? 'Modern' : 'Legacy');
        console.log('  - Notification count:', notifications.length);
        
        if (notifications.length === 0) {
          console.warn('[Service Worker] 🚨 NO NOTIFICATIONS VISIBLE');
          console.warn('[Service Worker] Likely causes:');
          console.warn('  1. Windows Focus Assist is ON');
          console.warn('  2. Do Not Disturb mode active');
          console.warn('  3. Chrome blocked in Windows Settings');
          console.warn('  4. Browser policy restrictions');
        }
        
      } catch (error) {
        console.error('[Service Worker] ❌ showNotification() failed');
        console.error('[Service Worker] Error:', error.name, error.message);
        console.error('[Service Worker] Stack:', error.stack);
        console.error('[Service Worker] Duration:', Date.now() - startTime, 'ms');
      }
      
      console.log('[Service Worker] === END NOTIFICATION ATTEMPT ===\n');
    })()
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification clicked');
  event.notification.close();
  
  const data = event.notification.data;
  let urlToOpen = data.url || '/';
  
  // Handle action button clicks
  if (event.action) {
    console.log('[Service Worker] Action clicked:', event.action);
    // Find the action URL from the stored actions
    if (data.actions && Array.isArray(data.actions)) {
      const clickedAction = data.actions.find(a => a.action === event.action);
      if (clickedAction && clickedAction.url) {
        urlToOpen = clickedAction.url;
      }
    }
  }
  
  console.log('[Service Worker] Click data:', {
    campaignId: data.campaignId,
    clientId: data.clientId,
    trackingUrl: data.trackingUrl,
    action: event.action || 'default',
    urlToOpen
  });
  
  // Track the click if tracking URL provided
  if (data.trackingUrl && data.clientId) {
    console.log('[Service Worker] Sending click tracking to:', data.trackingUrl);
    // Fire and forget the tracking request
    fetch(data.trackingUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'notification_clicked',
        campaignId: data.campaignId,
        notificationId: data.notificationId,
        clientId: data.clientId,
        action: event.action || 'click',
        timestamp: new Date().toISOString(),
        metadata: {
          action: event.action || 'default',
          url: urlToOpen
        }
      })
    }).then(response => {
      console.log('[Service Worker] Click tracking response:', response.status);
    }).catch(err => console.error('[Service Worker] Failed to track click:', err));
  } else {
    console.warn('[Service Worker] Missing tracking data:', { trackingUrl: data.trackingUrl, clientId: data.clientId });
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
  
  // Track dismiss event
  const data = event.notification.data;
  if (data && data.campaignId) {
    fetch('https://push-notification-app-steel.vercel.app/api/campaigns/track-dismiss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId: data.campaignId,
        clientId: data.clientId
      })
    }).catch(err => console.error('[Service Worker] Failed to track dismiss:', err));
  }
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