// Push Notification Service
// Handles service worker registration, subscription management, and permission requests

class PushService {
  constructor() {
    this.vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BNV70f-uHInqVEOT9r2d6pVfK5WViCXdtoYjB87Nf8WUQZ6mDMSXEXGFQmJXl6bvGpvzL2jVSuPZUk-S9YS8rYc'
    this.swRegistration = null
    this.isSupported = this.checkSupport()
    
    if (!this.vapidPublicKey) {
      console.error('VAPID public key not found! Set NEXT_PUBLIC_VAPID_PUBLIC_KEY in environment variables.')
    }
  }

  checkSupport() {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  }

  async init() {
    if (!this.isSupported) {
      console.warn('Push notifications are not supported in this browser')
      return false
    }

    try {
      // Register service worker
      this.swRegistration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered:', this.swRegistration)

      // Check if already subscribed
      const subscription = await this.getSubscription()
      if (subscription) {
        console.log('Already subscribed to push notifications')
        return subscription
      }

      return true
    } catch (error) {
      console.error('Failed to initialize push service:', error)
      return false
    }
  }

  async requestPermission() {
    if (!this.isSupported) {
      throw new Error('Push notifications not supported')
    }

    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  async subscribe(options = {}) {
    if (!this.swRegistration) {
      throw new Error('Service worker not registered. Please check if /sw.js is accessible.')
    }

    if (!this.vapidPublicKey) {
      throw new Error('VAPID public key not found. Please set NEXT_PUBLIC_VAPID_PUBLIC_KEY in environment variables.')
    }

    const permission = await this.requestPermission()
    if (!permission) {
      throw new Error('Notification permission denied')
    }

    try {
      console.log('Subscribing with VAPID key:', this.vapidPublicKey)
      
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      })

      console.log('Subscription successful:', subscription)

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription, options)

      return subscription
    } catch (error) {
      console.error('Failed to subscribe:', error)
      
      // Provide more specific error messages
      if (error.message.includes('applicationServerKey')) {
        throw new Error('Invalid VAPID key. Please check your VAPID public key configuration.')
      } else if (error.message.includes('Registration failed')) {
        throw new Error('Push service registration failed. This might be a browser or network issue.')
      } else {
        throw new Error(`Push subscription failed: ${error.message}`)
      }
    }
  }

  async unsubscribe() {
    const subscription = await this.getSubscription()
    if (!subscription) {
      return true
    }

    try {
      await subscription.unsubscribe()
      // Notify server about unsubscription
      await this.removeSubscriptionFromServer(subscription)
      return true
    } catch (error) {
      console.error('Failed to unsubscribe:', error)
      throw error
    }
  }

  async getSubscription() {
    if (!this.swRegistration) {
      return null
    }

    return await this.swRegistration.pushManager.getSubscription()
  }

  async sendSubscriptionToServer(subscription, options = {}) {
    const response = await fetch('/api/clients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subscription,
        browserInfo: this.getBrowserInfo(),
        location: await this.getLocation(),
        url: window.location.href,
        ...options
      })
    })

    if (!response.ok) {
      throw new Error('Failed to send subscription to server')
    }

    return await response.json()
  }

  async removeSubscriptionFromServer(subscription) {
    // Find client by endpoint since we don't store client ID locally
    const response = await fetch('/api/clients', {
      method: 'GET'
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch clients')
    }
    
    const data = await response.json()
    const client = data.clients.find(c => c.endpoint === subscription.endpoint)
    
    if (!client) {
      console.log('Client not found on server, may already be deleted')
      return
    }
    
    const deleteResponse = await fetch(`/api/clients?id=${client.id}`, {
      method: 'DELETE'
    })

    if (!deleteResponse.ok) {
      throw new Error('Failed to remove subscription from server')
    }
  }

  getBrowserInfo() {
    const ua = navigator.userAgent
    let browser = 'unknown'
    let version = 'unknown'
    let os = 'unknown'
    let device = 'desktop'

    // Detect browser
    if (ua.includes('Chrome')) {
      browser = 'chrome'
      version = ua.match(/Chrome\/(\d+\.\d+)/)?.[1] || 'unknown'
    } else if (ua.includes('Firefox')) {
      browser = 'firefox'
      version = ua.match(/Firefox\/(\d+\.\d+)/)?.[1] || 'unknown'
    } else if (ua.includes('Safari')) {
      browser = 'safari'
      version = ua.match(/Version\/(\d+\.\d+)/)?.[1] || 'unknown'
    } else if (ua.includes('Edge')) {
      browser = 'edge'
      version = ua.match(/Edge\/(\d+\.\d+)/)?.[1] || 'unknown'
    }

    // Detect OS
    if (ua.includes('Windows')) os = 'Windows'
    else if (ua.includes('Mac')) os = 'macOS'
    else if (ua.includes('Linux')) os = 'Linux'
    else if (ua.includes('Android')) os = 'Android'
    else if (ua.includes('iOS')) os = 'iOS'

    // Detect device type
    if (/Mobile|Android|iPhone|iPad/.test(ua)) {
      device = /iPad/.test(ua) ? 'tablet' : 'mobile'
    }

    return { browser, version, os, device }
  }

  async getLocation() {
    try {
      // In production, this would use a geolocation API
      // For now, return mock data
      return {
        country: 'United States',
        city: 'New York'
      }
    } catch (error) {
      return {
        country: 'Unknown',
        city: 'Unknown'
      }
    }
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  extractClientId(endpoint) {
    // Extract a unique ID from the endpoint URL
    // This is a simplified version - in production, you'd store and retrieve the actual client ID
    return endpoint.split('/').pop()
  }

  async sendTestNotification() {
    if (!this.isSupported) {
      throw new Error('Push notifications not supported')
    }

    const permission = Notification.permission
    if (permission !== 'granted') {
      throw new Error('Notification permission not granted')
    }

    // Send test notification directly
    const notification = new Notification('Test Notification', {
      body: 'This is a test push notification from your app!',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: 'test',
      requireInteraction: true
    })

    notification.onclick = () => {
      window.focus()
      notification.close()
    }

    return notification
  }
}

// Create singleton instance
const pushService = new PushService()

export default pushService