import { NextResponse } from 'next/server'
import webPushService from '@/lib/webPushService'

// POST /api/test-push - Send a test push notification directly
export async function POST(request) {
  try {
    const body = await request.json()
    const { subscription } = body

    if (!subscription || !webPushService.isValidSubscription(subscription)) {
      return NextResponse.json(
        { error: 'Invalid subscription' },
        { status: 400 }
      )
    }

    // Create test notification payload
    const payload = webPushService.createNotificationPayload({
      title: 'Test Push Notification 🎉',
      body: 'This is a real push notification from Chrome/Brave!',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      url: '/test-push',
      tag: 'chrome-test-' + Date.now(),
      requireInteraction: false,
      data: {
        timestamp: new Date().toISOString(),
        testMode: true
      }
    })

    console.log('Sending test push notification...')
    
    // Send the notification
    const result = await webPushService.sendNotification(subscription, payload)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test push notification sent successfully'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        message: result.message
      })
    }
  } catch (error) {
    console.error('Test push error:', error)
    return NextResponse.json(
      { error: 'Failed to send test push', details: error.message },
      { status: 500 }
    )
  }
}