import { NextResponse } from 'next/server'
import webPushService from '@/lib/webPushService'
import prisma from '@/lib/db'
import { campaignEvents } from '@/lib/campaignEvents'

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

    // Send notifications with clientId
    const notificationPromises = validSubscriptions.map(async (sub) => {
      // Create payload with clientId for this specific subscription
      const clientPayload = webPushService.createNotificationPayload({
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
          clientId: sub.id,
          testMode
        }
      })
      
      const result = await webPushService.sendNotification(sub.subscription, clientPayload)
      return { ...result, clientId: sub.id }
    })
    
    const notificationResults = await Promise.all(notificationPromises)
    const results = {
      sent: notificationResults.filter(r => r.success).length,
      failed: notificationResults.filter(r => !r.success).length,
      results: notificationResults
    }

    // Track delivery in database
    if (notification.campaignId && !testMode) {
      // Create delivery records and handle expired subscriptions
      const deliveryPromises = validSubscriptions.map(async (sub, index) => {
        const result = results.results[index]
        const status = result?.success ? 'sent' : 'failed'
        const error = result?.error || null

        // If subscription expired, mark client as inactive
        if (error === 'expired') {
          try {
            await prisma.client.update({
              where: { id: sub.id },
              data: { 
                accessStatus: 'expired',
                lastActive: new Date()
              }
            })
            console.log(`Marked client ${sub.id} as expired`)
          } catch (err) {
            console.error('Failed to mark client as expired:', err)
          }
        }

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
      const updatedCampaign = await prisma.campaign.update({
        where: { id: notification.campaignId },
        data: {
          sentCount: { increment: results.sent },
          deliveredCount: { increment: results.sent }, // Initially assume all sent are delivered
          failedCount: { increment: results.failed }
        }
      })
      
      // Emit real-time update
      campaignEvents.emitStatsUpdate(notification.campaignId, {
        sentCount: updatedCampaign.sentCount,
        deliveredCount: updatedCampaign.deliveredCount,
        failedCount: updatedCampaign.failedCount
      })
    }

    // Add detailed error information
    const errorDetails = results.results
      ?.filter(r => !r.success)
      ?.map(r => ({
        error: r.error,
        message: r.message,
        statusCode: r.statusCode
      }))
    
    // Add detailed debug information
    const debugInfo = {
      totalClients: validSubscriptions.length,
      sent: results.sent,
      failed: results.failed,
      expired: results.expired,
      results: results.results?.map((r, i) => ({
        clientId: validSubscriptions[i]?.id,
        endpoint: validSubscriptions[i]?.endpoint?.substring(0, 50) + '...',
        browser: validSubscriptions[i]?.browser,
        os: validSubscriptions[i]?.os,
        success: r.success,
        error: r.error,
        message: r.message,
        statusCode: r.statusCode
      }))
    }
    
    console.log('DETAILED DEBUG - Send notification results:', JSON.stringify(debugInfo, null, 2))
    
    return NextResponse.json({
      success: true,
      sent: results.sent,
      failed: results.failed,
      expired: results.expired,
      message: testMode ? 'Test notification sent' : 'Notifications sent successfully',
      results: results.results, // Include detailed results
      errorDetails: errorDetails // Include error details
    })
  } catch (error) {
    console.error('Failed to send notifications:', error)
    console.error('Error stack:', error.stack)
    console.error('Error details:', {
      message: error.message,
      body: error.body,
      statusCode: error.statusCode
    })
    
    return NextResponse.json(
      { 
        error: 'Failed to send notifications',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        hint: 'Check server logs for more details'
      },
      { status: 500 }
    )
  }
}