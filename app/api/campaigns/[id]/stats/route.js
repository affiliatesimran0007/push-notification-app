import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/campaigns/[id]/stats - Get campaign statistics
export async function GET(request, { params }) {
  try {
    const campaignId = params.id

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        notifications: {
          select: {
            id: true,
            status: true,
            deliveredAt: true,
            clickedAt: true,
            error: true
          }
        }
      }
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Calculate additional stats
    const stats = {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      sentCount: campaign.sentCount,
      deliveredCount: campaign.deliveredCount,
      clickedCount: campaign.clickedCount,
      dismissedCount: 0, // Not implemented yet
      failedCount: campaign.failedCount,
      pendingCount: 0,   // Not implemented yet
      ctr: campaign.sentCount > 0 
        ? ((campaign.clickedCount / campaign.sentCount) * 100).toFixed(1)
        : '0.0',
      deliveryDetails: {
        total: campaign.notifications.length,
        delivered: campaign.notifications.filter(n => n.deliveredAt).length,
        clicked: campaign.notifications.filter(n => n.clickedAt).length,
        failed: campaign.notifications.filter(n => n.status === 'failed').length
      }
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching campaign stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign stats' },
      { status: 500 }
    )
  }
}