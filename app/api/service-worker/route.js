import { NextResponse } from 'next/server'

export async function GET() {
  const serviceWorkerCode = `
// Push Service Worker for Customer Websites
// This file is dynamically served to handle push notifications

self.addEventListener('push', function(event) {
  if (!event.data) {
    console.log('Push event but no data');
    return;
  }

  const data = event.data.json();
  
  const title = data.title || 'New Notification';
  const options = {
    body: data.body || data.message || '',
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/badge-72x72.png',
    image: data.image,
    tag: data.tag || 'default',
    data: {
      url: data.url || data.data?.url || '/',
      campaignId: data.campaignId,
      notificationId: data.notificationId
    },
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Check if there's already a window/tab open with the target URL
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
  
  // Track click event
  if (event.notification.data?.campaignId) {
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'notification_clicked',
        campaignId: event.notification.data.campaignId,
        notificationId: event.notification.data.notificationId
      })
    }).catch(() => {
      // Silently fail - don't block notification handling
    });
  }
});

self.addEventListener('notificationclose', function(event) {
  // Track close event
  if (event.notification.data?.campaignId) {
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'notification_closed',
        campaignId: event.notification.data.campaignId,
        notificationId: event.notification.data.notificationId
      })
    }).catch(() => {
      // Silently fail
    });
  }
});
`;

  return new NextResponse(serviceWorkerCode, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600',
      'Service-Worker-Allowed': '/'
    }
  })
}