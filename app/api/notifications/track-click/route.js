import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { campaignEvents } from '@/lib/campaignEvents'

// POST /api/notifications/track-click - Track notification click
export async function POST(request) {
  try {
    const body = await request.json()
    const { campaignId, clientId } = body

    if (!campaignId || !clientId) {
      return NextResponse.json(
        { error: 'campaignId and clientId are required' },
        { status: 400 }
      )
    }

    // Update click count for the campaign
    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        clickedCount: { increment: 1 }
      }
    })
    
    // Emit real-time update
    campaignEvents.emitStatsUpdate(campaignId, {
      clickedCount: updatedCampaign.clickedCount,
      ctr: updatedCampaign.sentCount > 0 
        ? ((updatedCampaign.clickedCount / updatedCampaign.sentCount) * 100).toFixed(1)
        : '0.0'
    })

    // Update notification delivery record if exists
    const delivery = await prisma.notificationDelivery.findUnique({
      where: {
        campaignId_clientId: {
          campaignId,
          clientId
        }
      }
    })

    if (delivery && !delivery.clickedAt) {
      await prisma.notificationDelivery.update({
        where: {
          campaignId_clientId: {
            campaignId,
            clientId
          }
        },
        data: {
          clickedAt: new Date()
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking click:', error)
    return NextResponse.json(
      { error: 'Failed to track click' },
      { status: 500 }
    )
  }
}

// GET /api/notifications/track-click - Redirect and track
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('c')
    const clientId = searchParams.get('u')
    const url = searchParams.get('url')

    if (campaignId && clientId) {
      // Track the click
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          clickedCount: { increment: 1 }
        }
      })

      // Update delivery record
      const delivery = await prisma.notificationDelivery.findUnique({
        where: {
          campaignId_clientId: {
            campaignId,
            clientId
          }
        }
      })

      if (delivery && !delivery.clickedAt) {
        await prisma.notificationDelivery.update({
          where: {
            campaignId_clientId: {
              campaignId,
              clientId
            }
          },
          data: {
            clickedAt: new Date()
          }
        })
      }
    }

    // Redirect to the URL or fallback
    return NextResponse.redirect(url || 'https://push-notification-app-steel.vercel.app')
  } catch (error) {
    console.error('Error tracking click:', error)
    // Still redirect even if tracking fails
    return NextResponse.redirect('https://push-notification-app-steel.vercel.app')
  }
}