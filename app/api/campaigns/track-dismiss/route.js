import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { campaignEvents } from '@/lib/campaignEvents'

// POST /api/campaigns/track-dismiss - Track notification dismissal
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

    // Update dismiss count for the campaign
    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        dismissedCount: { increment: 1 }
      }
    })
    
    // Emit real-time update
    campaignEvents.emitStatsUpdate(campaignId, {
      dismissedCount: updatedCampaign.dismissedCount
    })

    // Update notification delivery record if clientId is provided
    if (clientId) {
      const delivery = await prisma.notificationDelivery.findUnique({
        where: {
          campaignId_clientId: {
            campaignId,
            clientId
          }
        }
      })

      if (delivery) {
        await prisma.notificationDelivery.update({
          where: {
            campaignId_clientId: {
              campaignId,
              clientId
            }
          },
          data: {
            status: 'dismissed'
          }
        })
      }
    }

    console.log('Dismiss tracked for campaign:', campaignId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking dismiss:', error)
    return NextResponse.json(
      { error: 'Failed to track dismiss' },
      { status: 500 }
    )
  }
}