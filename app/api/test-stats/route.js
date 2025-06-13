import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// POST /api/test-stats - Test stats updating
export async function POST(request) {
  try {
    const body = await request.json()
    const { campaignId, action } = body
    
    if (!campaignId || !action) {
      return NextResponse.json(
        { error: 'campaignId and action are required' },
        { status: 400 }
      )
    }
    
    let updateData = {}
    
    switch (action) {
      case 'sent':
        updateData = { sentCount: { increment: 1 } }
        break
      case 'delivered':
        updateData = { deliveredCount: { increment: 1 } }
        break
      case 'clicked':
        updateData = { clickedCount: { increment: 1 } }
        break
      case 'failed':
        updateData = { failedCount: { increment: 1 } }
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: sent, delivered, clicked, or failed' },
          { status: 400 }
        )
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
      message: `${action} count incremented`,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        sentCount: campaign.sentCount,
        deliveredCount: campaign.deliveredCount,
        clickedCount: campaign.clickedCount,
        failedCount: campaign.failedCount,
        ctr
      }
    })
  } catch (error) {
    console.error('Error updating test stats:', error)
    return NextResponse.json(
      { error: 'Failed to update stats', details: error.message },
      { status: 500 }
    )
  }
}