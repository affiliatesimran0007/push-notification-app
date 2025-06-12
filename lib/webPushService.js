import webpush from 'web-push'

// Initialize web-push with VAPID details
const initializeWebPush = () => {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com'

  if (!publicKey || !privateKey) {
    console.error('VAPID keys not found in environment variables!')
    console.error('Run: npm run generate-vapid-keys')
    return false
  }

  try {
    webpush.setVapidDetails(subject, publicKey, privateKey)
    return true
  } catch (error) {
    console.error('Failed to initialize web-push:', error)
    return false
  }
}

// Send notification to a single subscription
export const sendNotification = async (subscription, payload) => {
  if (!initializeWebPush()) {
    throw new Error('Web push not initialized')
  }

  try {
    console.log('Sending notification to:', subscription.endpoint)
    console.log('Payload:', JSON.stringify(payload))
    const result = await webpush.sendNotification(subscription, JSON.stringify(payload))
    console.log('Notification sent successfully:', result)
    return { success: true, result }
  } catch (error) {
    console.error('Error sending notification:', error)
    console.error('Error details:', error.body || error.message)
    
    // Handle specific error cases
    if (error.statusCode === 410) {
      // Subscription has expired or is no longer valid
      return { success: false, error: 'expired', message: 'Subscription expired' }
    } else if (error.statusCode === 413) {
      // Payload too large
      return { success: false, error: 'payload_too_large', message: 'Payload too large' }
    } else {
      return { success: false, error: 'failed', message: error.message }
    }
  }
}

// Send notifications to multiple subscriptions
export const sendNotifications = async (subscriptions, payload) => {
  if (!initializeWebPush()) {
    throw new Error('Web push not initialized')
  }

  const results = await Promise.all(
    subscriptions.map(subscription => sendNotification(subscription, payload))
  )

  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  const expired = results.filter(r => r.error === 'expired').length

  return {
    sent: successful,
    failed,
    expired,
    results
  }
}

// Validate subscription object
export const isValidSubscription = (subscription) => {
  return subscription && 
    subscription.endpoint && 
    subscription.keys && 
    subscription.keys.p256dh && 
    subscription.keys.auth
}

// Create notification payload with proper structure
export const createNotificationPayload = ({
  title,
  body,
  icon,
  badge,
  url,
  tag,
  requireInteraction = false,
  actions = [],
  data = {}
}) => {
  return {
    title,
    body,
    icon: icon || '/icon-192x192.png',
    badge: badge || '/badge-72x72.png',
    tag: tag || 'default',
    requireInteraction,
    actions: actions.slice(0, 2), // Max 2 actions allowed
    data: {
      url: url || '/',
      timestamp: new Date().toISOString(),
      ...data
    },
    vibrate: [200, 100, 200],
    renotify: true
  }
}

export default {
  sendNotification,
  sendNotifications,
  isValidSubscription,
  createNotificationPayload
}