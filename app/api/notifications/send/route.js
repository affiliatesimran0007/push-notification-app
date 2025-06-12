import { NextResponse } from 'next/server'
import webPushService from '@/lib/webPushService'
import prisma from '@/lib/db'

// POST /api/notifications/send - Send notification to specific clients
export async function POST(request) {
  try {
    const body = await request.json()
    const { clientIds, notification, testMode = false } = body

    if (!notification || !notification.title || !notification.message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      )
    }

    // Fetch client subscriptions from database
    const clients = await prisma.client.findMany({
      where: {
        id: { in: clientIds }
      }
    })

    if (clients.length === 0) {
      return NextResponse.json(
        { error: 'No clients found' },
        { status: 400 }
      )
    }

    // Convert to subscription format
    const subscriptions = clients.map(client => ({
      id: client.id,
      subscription: {
        endpoint: client.endpoint,
        keys: {
          p256dh: client.p256dh,
          auth: client.auth
        }
      }
    }))

    const validSubscriptions = subscriptions.filter(sub => 
      webPushService.isValidSubscription(sub.subscription)
    )

    if (validSubscriptions.length === 0) {
      return NextResponse.json(
        { error: 'No valid subscriptions found' },
        { status: 400 }
      )
    }

    // Create notification payload
    const payload = webPushService.createNotificationPayload({
      title: notification.title,
      body: notification.message,
      icon: notification.icon,
      badge: notification.badge,
      url: notification.url,
      tag: notification.tag,
      requireInteraction: notification.requireInteraction,
      actions: notification.actions,
      data: {
        campaignId: notification.campaignId,
        testMode
      }
    })

    // Send notifications
    const pushSubscriptions = validSubscriptions.map(sub => sub.subscription)
    const results = await webPushService.sendNotifications(pushSubscriptions, payload)

    // Track delivery in database
    if (notification.campaignId && !testMode) {
      // Create delivery records
      const deliveryPromises = validSubscriptions.map(async (sub, index) => {
        const status = results.results[index]?.success ? 'sent' : 'failed'
        const error = results.results[index]?.error || null

        try {
          await prisma.notificationDelivery.create({
            data: {
              campaignId: notification.campaignId,
              clientId: sub.id,
              status,
              error
            }
          })
        } catch (err) {
          // Ignore duplicate key errors
          if (!err.message.includes('Unique constraint')) {
            console.error('Failed to track delivery:', err)
          }
        }
      })

      await Promise.all(deliveryPromises)

      // Update campaign stats
      await prisma.campaign.update({
        where: { id: notification.campaignId },
        data: {
          sentCount: { increment: results.sent },
          failedCount: { increment: results.failed }
        }
      })
    }

    return NextResponse.json({
      success: true,
      sent: results.sent,
      failed: results.failed,
      expired: results.expired,
      message: testMode ? 'Test notification sent' : 'Notifications sent successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    )
  }
}