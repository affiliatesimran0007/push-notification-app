// Service Worker for Push Notifications
// Version: 2.1.0 - Added delivery and click tracking

const SW_VERSION = 'v2.1.0';

self.addEventListener('install', (event) => {
  console.log('Service Worker installed', SW_VERSION)
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated')
  event.waitUntil(clients.claim())
})

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event)
  console.log('Push data:', event.data ? event.data.text() : 'No data')

  if (!event.data) {
    console.log('Push notification without data')
    return
  }

  try {
    const data = event.data.json()
    console.log('Parsed push data:', data)
    
    const { title, body, icon, badge, url, tag, requireInteraction, actions, data: customData } = data

    // Firefox limitation: only shows 1 custom action + automatic Dismiss
    // Chrome/Edge: shows up to 2 custom actions
    const isFirefox = /Firefox/.test(self.navigator.userAgent)
    let notificationActions = actions || []
    
    if (isFirefox && notificationActions.length > 1) {
      // For Firefox, only use the first action since it adds Dismiss automatically
      notificationActions = notificationActions.slice(0, 1)
      console.log('Firefox detected: limiting to 1 custom action')
    }

    const options = {
      body,
      icon: icon || '/icon-192x192.png',
      badge: badge || '/badge-72x72.png',
      tag: tag || 'default',
      requireInteraction: requireInteraction || false,
      data: {
        url: url || '/',
        actions: actions || [], // Keep original actions for click handling
        ...customData
      },
      actions: notificationActions,
      vibrate: [200, 100, 200],
      timestamp: Date.now(),
      silent: false // Ensure notification is not silent
    }

    console.log('Showing notification with options:', options)

    event.waitUntil(
      self.registration.showNotification(title, options).then(() => {
        console.log('Notification shown successfully')
        
        // Track delivery
        if (customData?.campaignId) {
          fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'notification_delivered',
              campaignId: customData.campaignId,
              clientId: customData.clientId,
              timestamp: new Date().toISOString()
            })
          }).catch(err => console.error('Failed to track delivery:', err))
        }
      }).catch(error => {
        console.error('Failed to show notification:', error)
      })
    )
  } catch (error) {
    console.error('Error processing push notification:', error)
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
    
    // Find the action in the notification data
    const actions = event.notification.data?.actions || []
    const clickedAction = actions.find(a => a.action === event.action)
    
    if (clickedAction && clickedAction.url) {
      // Open the URL specified for this action
      event.waitUntil(clients.openWindow(clickedAction.url))
    } else {
      // Fallback to main URL
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
        clientId: event.notification.data.clientId,
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

// Handle messages from the page (for testing)
self.addEventListener('message', (event) => {
  console.log('Service worker received message:', event.data)
  
  if (event.data && event.data.type === 'PUSH_TEST') {
    // Simulate a push event
    const { data } = event.data
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      data: { url: data.url }
    }).then(() => {
      console.log('Test notification shown')
      if (event.ports[0]) {
        event.ports[0].postMessage({ success: true })
      }
    }).catch(error => {
      console.error('Failed to show test notification:', error)
      if (event.ports[0]) {
        event.ports[0].postMessage({ success: false, error: error.message })
      }
    })
  }
})