import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// POST /api/campaigns/update-stats - Manually update campaign stats
export async function POST(request) {
  try {
    const body = await request.json()
    const { campaignId, stats } = body

    if (!campaignId) {
      return NextResponse.json(
        { error: 'campaignId is required' },
        { status: 400 }
      )
    }

    // Update campaign with provided stats
    const updateData = {}
    
    if (stats.clickedCount !== undefined) {
      updateData.clickedCount = stats.clickedCount
    }
    if (stats.deliveredCount !== undefined) {
      updateData.deliveredCount = stats.deliveredCount
    }
    if (stats.dismissedCount !== undefined) {
      updateData.dismissedCount = stats.dismissedCount
    }
    if (stats.failedCount !== undefined) {
      updateData.failedCount = stats.failedCount
    }

    const campaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: updateData
    })

    // Calculate CTR
    const ctr = campaign.sentCount > 0 
      ? ((campaign.clickedCount / campaign.sentCount) * 100).toFixed(1)
      : 0

    return NextResponse.json({ 
      success: true, 
      campaign: {
        ...campaign,
        ctr
      }
    })
  } catch (error) {
    console.error('Error updating campaign stats:', error)
    return NextResponse.json(
      { error: 'Failed to update campaign stats' },
      { status: 500 }
    )
  }
}