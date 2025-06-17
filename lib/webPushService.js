import webpush from 'web-push'

// Singleton to track initialization
let isInitialized = false

// Initialize web-push with VAPID details
const initializeWebPush = () => {
  // Return early if already initialized
  if (isInitialized) {
    return true
  }
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
    isInitialized = true
    console.log('Web-push initialized successfully with VAPID keys')
    return true
  } catch (error) {
    console.error('Failed to initialize web-push:', error)
    return false
  }
}

// Send notification to a single subscription
export const sendNotification = async (subscription, payload) => {
  if (!initializeWebPush()) {
    throw new Error('Web push not initialized - check VAPID keys')
  }

  // Validate subscription before sending
  if (!isValidSubscription(subscription)) {
    console.error('Invalid subscription object:', subscription)
    return { success: false, error: 'invalid_subscription', message: 'Invalid subscription format' }
  }

  try {
    console.log('\n=== WEBPUSH SEND NOTIFICATION DEBUG ===')
    console.log('Timestamp:', new Date().toISOString())
    console.log('Endpoint:', subscription.endpoint)
    console.log('Endpoint type:', 
      subscription.endpoint.includes('fcm.googleapis.com') ? 'FCM (Chrome/Edge/Opera)' :
      subscription.endpoint.includes('mozilla.com') ? 'Mozilla (Firefox)' :
      subscription.endpoint.includes('windows.com') ? 'WNS (Edge Legacy)' :
      subscription.endpoint.includes('apple.com') ? 'Apple (Safari)' :
      subscription.endpoint.includes('push.example.com') ? '⚠️ FAKE ENDPOINT' :
      subscription.endpoint.includes('demo-key') ? '⚠️ DEMO SUBSCRIPTION' :
      'Unknown'
    )
    console.log('Payload:', JSON.stringify(payload))
    console.log('Payload size:', JSON.stringify(payload).length, 'bytes')
    console.log('Icon URL:', payload.icon)
    console.log('Badge URL:', payload.badge)
    console.log('Subscription keys:', {
      p256dh: subscription.keys.p256dh?.substring(0, 20) + '...',
      auth: subscription.keys.auth?.substring(0, 10) + '...',
      p256dhLength: subscription.keys.p256dh?.length,
      authLength: subscription.keys.auth?.length,
      isFakeKey: subscription.keys.p256dh?.includes('demo') || subscription.keys.p256dh?.includes('no-service-worker')
    })
    console.log('VAPID Config:', {
      publicKeyLength: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.length,
      privateKeyLength: process.env.VAPID_PRIVATE_KEY?.length,
      subject: process.env.VAPID_SUBJECT
    })
    
    console.log('Calling webpush.sendNotification...')
    const startTime = Date.now()
    
    const payloadString = JSON.stringify(payload)
    console.log('Final payload being sent:', payloadString)
    console.log('Payload string length:', payloadString.length)
    
    const result = await webpush.sendNotification(subscription, payloadString)
    
    const duration = Date.now() - startTime
    console.log('✓ WEBPUSH SUCCESS in', duration, 'ms')
    console.log('Response:', { statusCode: result.statusCode, headers: result.headers })
    console.log('=== END DEBUG ===\n')
    
    return { success: true, result }
  } catch (error) {
    console.error('\n=== WEBPUSH ERROR DEBUG ===')
    console.error('Error type:', error.name)
    console.error('Error message:', error.message)
    console.error('Status code:', error.statusCode)
    console.error('Error body:', error.body)
    console.error('Error headers:', error.headers)
    console.error('Endpoint that failed:', subscription.endpoint)
    console.error('Full error object:', JSON.stringify(error, null, 2))
    console.error('=== END ERROR DEBUG ===\n')
    
    // Handle specific error cases
    if (error.statusCode === 410) {
      // Subscription has expired or is no longer valid
      return { success: false, error: 'expired', message: 'Subscription expired' }
    } else if (error.statusCode === 413) {
      // Payload too large
      return { success: false, error: 'payload_too_large', message: 'Payload too large' }
    } else if (error.statusCode === 401) {
      // VAPID authentication error
      return { success: false, error: 'auth_error', message: 'VAPID authentication failed - check keys' }
    } else if (error.statusCode === 400) {
      // Bad request - often invalid VAPID key format
      return { success: false, error: 'bad_request', message: 'Invalid request - check VAPID configuration' }
    } else {
      return { success: false, error: 'failed', message: error.message, statusCode: error.statusCode }
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
  requireInteraction = true,
  actions = [],
  data = {}
}) => {
  // Add tracking URL for analytics
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://push-notification-app-steel.vercel.app'
  const trackingUrl = `${appUrl}/api/analytics/track`
  
  // Ensure icon is a full URL
  let iconUrl = icon || '/icon-192x192.png'
  
  // Check if icon is an emoji (single character or emoji)
  if (iconUrl && iconUrl.length <= 4 && !iconUrl.startsWith('/') && !iconUrl.startsWith('http')) {
    console.log('Detected emoji icon, using default icon instead:', iconUrl)
    iconUrl = `${appUrl}/icon-192x192.png`
  } else if (iconUrl && !iconUrl.startsWith('http') && !iconUrl.startsWith('data:')) {
    iconUrl = `${appUrl}${iconUrl.startsWith('/') ? '' : '/'}${iconUrl}`
  }
  
  // Ensure badge is a full URL
  let badgeUrl = badge || '/badge-72x72.png'
  if (badgeUrl && !badgeUrl.startsWith('http') && !badgeUrl.startsWith('data:')) {
    badgeUrl = `${appUrl}${badgeUrl.startsWith('/') ? '' : '/'}${badgeUrl}`
  }
  
  // Validate title length (some browsers have limits)
  if (title && title.length > 100) {
    console.warn('Title too long, truncating:', title.length)
    title = title.substring(0, 97) + '...'
  }
  
  // Validate body length
  if (body && body.length > 255) {
    console.warn('Body too long, truncating:', body.length)
    body = body.substring(0, 252) + '...'
  }
  
  return {
    title: title || 'Notification',
    body: body || 'You have a new notification',
    icon: iconUrl,
    badge: badgeUrl,
    tag: tag || `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    requireInteraction,
    actions: actions.slice(0, 2), // Max 2 actions allowed
    trackingUrl, // Add trackingUrl at root level for better compatibility
    data: {
      url: url || '/',
      timestamp: new Date().toISOString(),
      trackingUrl, // Keep it in data as well for backward compatibility
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