import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { campaignEvents } from '@/lib/campaignEvents'

// POST /api/notifications/track-display - Track when notification is displayed
export async function POST(request) {
  try {
    const body = await request.json()
    const { campaignId, clientId } = body

    if (!campaignId) {
      return NextResponse.json(
        { error: 'campaignId is required' },
        { status: 400 }
      )
    }

    // Update delivered count
    const campaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        deliveredCount: { increment: 1 }
      }
    })
    
    // Emit real-time update
    campaignEvents.emitStatsUpdate(campaignId, {
      deliveredCount: campaign.deliveredCount
    })

    // Update delivery record if clientId provided
    if (clientId) {
      try {
        await prisma.notificationDelivery.update({
          where: {
            campaignId_clientId: {
              campaignId,
              clientId
            }
          },
          data: {
            status: 'delivered',
            deliveredAt: new Date()
          }
        })
      } catch (e) {
        // Ignore if delivery record doesn't exist
      }
    }

    return NextResponse.json({ 
      success: true,
      campaign: {
        deliveredCount: campaign.deliveredCount
      }
    })
  } catch (error) {
    console.error('Error tracking display:', error)
    return NextResponse.json(
      { error: 'Failed to track display' },
      { status: 500 }
    )
  }
}