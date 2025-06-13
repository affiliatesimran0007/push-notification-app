import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// POST /api/notifications/track-delivery - Track notification delivery
export async function POST(request) {
  try {
    const body = await request.json()
    const { campaignId, clientId, status, error } = body

    if (!campaignId || !clientId || !status) {
      return NextResponse.json(
        { error: 'campaignId, clientId, and status are required' },
        { status: 400 }
      )
    }

    // Create or update notification delivery record
    const deliveryData = {
      campaign: { connect: { id: campaignId } },
      client: { connect: { id: clientId } },
      status,
      deliveredAt: status === 'delivered' ? new Date() : null,
      error: error || null
    }

    const delivery = await prisma.notificationDelivery.upsert({
      where: {
        campaignId_clientId: {
          campaignId,
          clientId
        }
      },
      update: {
        status,
        deliveredAt: status === 'delivered' ? new Date() : null,
        error: error || null
      },
      create: deliveryData
    })

    // Update campaign stats based on status
    if (status === 'delivered') {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          deliveredCount: { increment: 1 }
        }
      })
    } else if (status === 'failed') {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          failedCount: { increment: 1 }
        }
      })
    }

    return NextResponse.json({ success: true, delivery })
  } catch (error) {
    console.error('Error tracking delivery:', error)
    return NextResponse.json(
      { error: 'Failed to track delivery' },
      { status: 500 }
    )
  }
}