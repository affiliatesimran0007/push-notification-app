import { NextResponse } from 'next/server'
import webPushService from '@/lib/webPushService'
import prisma from '@/lib/db'

// POST /api/notifications/test-tracking - Send test notification with tracking
export async function POST(request) {
  try {
    const body = await request.json()
    const { clientId } = body

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    // Fetch client subscription
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    const subscription = {
      endpoint: client.endpoint,
      keys: {
        p256dh: client.p256dh,
        auth: client.auth
      }
    }

    if (!webPushService.isValidSubscription(subscription)) {
      return NextResponse.json(
        { error: 'Invalid subscription' },
        { status: 400 }
      )
    }

    // Create test notification with tracking
    const testCampaignId = `test-${Date.now()}`
    const payload = webPushService.createNotificationPayload({
      title: 'Test Tracking Notification',
      body: 'Click me to test tracking! Check console logs.',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      url: 'https://example.com/test-click',
      tag: `test-tracking-${Date.now()}`,
      requireInteraction: true,
      actions: [
        { action: 'action1', title: 'Action 1' },
        { action: 'action2', title: 'Action 2' }
      ],
      data: {
        campaignId: testCampaignId,
        clientId: clientId,
        notificationId: `test-notif-${Date.now()}`
      }
    })

    console.log('Sending test notification with payload:', JSON.stringify(payload, null, 2))

    const result = await webPushService.sendNotification(subscription, payload)

    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Failed to send notification',
          details: result.error,
          message: result.message
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Test notification sent! Check browser console for tracking logs.',
      trackingUrl: payload.trackingUrl,
      campaignId: testCampaignId,
      payload: payload
    })
  } catch (error) {
    console.error('Failed to send test notification:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send test notification',
        details: error.message
      },
      { status: 500 }
    )
  }
}