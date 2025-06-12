import { NextResponse } from 'next/server'
import webPushService from '@/lib/webPushService'
import prisma from '@/lib/db'

// POST /api/notifications/diagnose - Diagnose notification issues for a client
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

    // Fetch client from database
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Diagnostic results
    const diagnostics = {
      client: {
        id: client.id,
        browser: client.browser,
        device: client.device,
        subscribedAt: client.subscribedAt,
        lastActive: client.lastActive,
        accessStatus: client.accessStatus
      },
      subscription: {
        hasEndpoint: !!client.endpoint,
        endpointValid: client.endpoint?.startsWith('https://'),
        hasKeys: !!client.p256dh && !!client.auth,
        keyLengths: {
          p256dh: client.p256dh?.length || 0,
          auth: client.auth?.length || 0
        }
      },
      environment: {
        hasPublicKey: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        hasPrivateKey: !!process.env.VAPID_PRIVATE_KEY,
        hasSubject: !!process.env.VAPID_SUBJECT,
        nodeEnv: process.env.NODE_ENV
      }
    }

    // Test subscription validity
    const subscription = {
      endpoint: client.endpoint,
      keys: {
        p256dh: client.p256dh,
        auth: client.auth
      }
    }

    diagnostics.subscription.isValid = webPushService.isValidSubscription(subscription)

    // Try to send a test notification
    if (diagnostics.subscription.isValid) {
      const testPayload = webPushService.createNotificationPayload({
        title: 'Diagnostic Test',
        body: 'Testing push notification delivery',
        tag: 'diagnostic-' + Date.now()
      })

      try {
        const result = await webPushService.sendNotification(subscription, testPayload)
        diagnostics.testNotification = {
          sent: true,
          success: result.success,
          error: result.error,
          message: result.message
        }
      } catch (error) {
        diagnostics.testNotification = {
          sent: false,
          error: error.message,
          stack: error.stack
        }
      }
    } else {
      diagnostics.testNotification = {
        sent: false,
        error: 'Invalid subscription'
      }
    }

    // Check recent notification deliveries
    const recentDeliveries = await prisma.notificationDelivery.findMany({
      where: { clientId },
      orderBy: { sentAt: 'desc' },
      take: 5,
      select: {
        id: true,
        status: true,
        sentAt: true,
        error: true,
        campaign: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    diagnostics.recentDeliveries = recentDeliveries

    return NextResponse.json({
      success: true,
      diagnostics
    })
  } catch (error) {
    console.error('Diagnostic error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to run diagnostics',
        details: error.message 
      },
      { status: 500 }
    )
  }
}