// Service Worker for Push Notifications

self.addEventListener('install', (event) => {
  console.log('Service Worker installed')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated')
  event.waitUntil(clients.claim())
})

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event)

  if (!event.data) {
    console.log('Push notification without data')
    return
  }

  try {
    const data = event.data.json()
    const { title, body, icon, badge, url, tag, requireInteraction, actions, data: customData } = data

    const options = {
      body,
      icon: icon || '/icon-192x192.png',
      badge: badge || '/badge-72x72.png',
      tag: tag || 'default',
      requireInteraction: requireInteraction || false,
      data: {
        url: url || '/',
        ...customData
      },
      actions: actions || [],
      vibrate: [200, 100, 200],
      timestamp: Date.now()
    }

    event.waitUntil(
      self.registration.showNotification(title, options)
    )
  } catch (error) {
    console.error('Error showing notification:', error)
  }
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event)
  event.notification.close()

  const url = event.notification.data?.url || '/'
  
  // Handle action button clicks
  if (event.action) {
    console.log('Action clicked:', event.action)
    // You can handle different actions here
    switch (event.action) {
      case 'view-cart':
        event.waitUntil(clients.openWindow('/cart'))
        break
      case 'dismiss':
        // Just close the notification
        break
      default:
        event.waitUntil(clients.openWindow(url))
    }
  } else {
    // Main notification body clicked
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Check if there's already a window/tab open
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus()
          }
        }
        // Open new window if not found
        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      })
    )
  }

  // Track click analytics
  if (event.notification.data?.campaignId) {
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'notification_clicked',
        campaignId: event.notification.data.campaignId,
        timestamp: new Date().toISOString()
      })
    }).catch(err => console.error('Failed to track click:', err))
  }
})

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event)
  
  // Track close analytics
  if (event.notification.data?.campaignId) {
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'notification_closed',
        campaignId: event.notification.data.campaignId,
        timestamp: new Date().toISOString()
      })
    }).catch(err => console.error('Failed to track close:', err))
  }
})

// Handle background sync for failed notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'retry-notifications') {
    event.waitUntil(retryFailedNotifications())
  }
})

async function retryFailedNotifications() {
  // Implement retry logic for failed notifications
  console.log('Retrying failed notifications...')
}