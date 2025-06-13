import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendNotification } from '@/lib/webPushService'

// POST /api/notifications/debug - Debug notification sending
export async function POST(request) {
  try {
    const { clientId } = await request.json()
    
    console.log('\n=== NOTIFICATION DEBUG TEST ===')
    console.log('Testing client:', clientId)
    console.log('Timestamp:', new Date().toISOString())
    
    // Get client details
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: { landingPage: true }
    })
    
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }
    
    console.log('Client details:', {
      id: client.id,
      browser: client.browser,
      os: client.os,
      device: client.device,
      accessStatus: client.accessStatus,
      createdAt: client.createdAt,
      lastActive: client.lastActive,
      endpoint: client.endpoint,
      endpointType: 
        client.endpoint.includes('fcm.googleapis.com') ? 'FCM (Chrome/Edge/Opera)' :
        client.endpoint.includes('mozilla.com') ? 'Mozilla (Firefox)' :
        client.endpoint.includes('windows.com') ? 'WNS (Edge Legacy)' :
        client.endpoint.includes('apple.com') ? 'Apple (Safari)' :
        client.endpoint.includes('push.example.com') ? '⚠️ FAKE ENDPOINT' :
        'Unknown',
      p256dh: client.p256dh?.substring(0, 20) + '...',
      auth: client.auth?.substring(0, 10) + '...',
      landingPage: client.landingPage?.name
    })
    
    // Check if it's a fake subscription
    if (client.endpoint.includes('push.example.com') || 
        client.endpoint.includes('granted-') ||
        client.p256dh?.includes('demo') ||
        client.p256dh?.includes('no-service-worker')) {
      return NextResponse.json({
        error: 'FAKE_SUBSCRIPTION_DETECTED',
        message: 'This is not a real push subscription. The client needs to re-register with a proper service worker.',
        debug: {
          endpoint: client.endpoint,
          p256dh: client.p256dh?.substring(0, 50),
          reason: 'Subscription was created without a real service worker'
        }
      }, { status: 400 })
    }
    
    // Test payload
    const testPayload = {
      title: 'Debug Test Notification',
      body: `Test at ${new Date().toLocaleTimeString()}`,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: {
        url: '/',
        timestamp: new Date().toISOString(),
        debug: true
      }
    }
    
    console.log('Sending test notification with payload:', testPayload)
    
    // Try to send notification
    const subscription = {
      endpoint: client.endpoint,
      keys: {
        p256dh: client.p256dh,
        auth: client.auth
      }
    }
    
    const result = await sendNotification(subscription, testPayload)
    
    console.log('Debug test result:', result)
    console.log('=== END DEBUG TEST ===\n')
    
    return NextResponse.json({
      success: result.success,
      result: result,
      client: {
        id: client.id,
        browser: client.browser,
        os: client.os,
        endpoint: client.endpoint.substring(0, 50) + '...',
        accessStatus: client.accessStatus,
        createdAt: client.createdAt
      },
      debug: {
        endpointType: 
          client.endpoint.includes('fcm.googleapis.com') ? 'FCM (Chrome/Edge/Opera)' :
          client.endpoint.includes('mozilla.com') ? 'Mozilla (Firefox)' :
          client.endpoint.includes('windows.com') ? 'WNS (Edge Legacy)' :
          client.endpoint.includes('apple.com') ? 'Apple (Safari)' :
          'Unknown',
        isFakeSubscription: client.endpoint.includes('push.example.com') || client.p256dh?.includes('demo'),
        subscriptionAge: new Date() - new Date(client.createdAt),
        lastActiveAge: new Date() - new Date(client.lastActive)
      }
    })
  } catch (error) {
    console.error('Debug test error:', error)
    return NextResponse.json(
      { 
        error: 'Debug test failed',
        message: error.message,
        stack: error.stack
      },
      { status: 500 }
    )
  }
}