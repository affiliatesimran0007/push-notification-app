import { NextResponse } from 'next/server'
import webpush from 'web-push'

export async function POST(request) {
  try {
    const { subscription } = await request.json()
    
    if (!subscription) {
      return NextResponse.json({ error: 'No subscription provided' }, { status: 400 })
    }
    
    // Get VAPID details
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const privateKey = process.env.VAPID_PRIVATE_KEY
    const subject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com'
    
    console.log('VAPID Configuration:', {
      publicKey: publicKey?.substring(0, 20) + '...',
      privateKey: privateKey?.substring(0, 20) + '...',
      subject
    })
    
    // Set VAPID details
    webpush.setVapidDetails(subject, publicKey, privateKey)
    
    // Create payload with unique tag
    const timestamp = Date.now()
    const payload = JSON.stringify({
      title: 'Direct Test Notification',
      body: `Test at ${new Date().toLocaleTimeString()}`,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: `test-${timestamp}`, // Unique tag prevents replacement
      requireInteraction: false,
      timestamp: new Date().toISOString()
    })
    
    console.log('Sending to endpoint:', subscription.endpoint)
    console.log('Subscription keys:', {
      p256dh: subscription.keys?.p256dh?.substring(0, 20) + '...',
      auth: subscription.keys?.auth?.substring(0, 20) + '...'
    })
    
    // Send notification
    const result = await webpush.sendNotification(subscription, payload)
    
    console.log('Success! Result:', result)
    
    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
      statusCode: result.statusCode,
      headers: result.headers
    })
    
  } catch (error) {
    console.error('Direct push test error:', error)
    console.error('Error name:', error.name)
    console.error('Error statusCode:', error.statusCode)
    console.error('Error body:', error.body)
    console.error('Error endpoint:', error.endpoint)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      statusCode: error.statusCode,
      body: error.body,
      endpoint: error.endpoint,
      name: error.name,
      details: {
        message: error.message,
        statusCode: error.statusCode,
        headers: error.headers,
        body: error.body
      }
    }, { status: 500 })
  }
}