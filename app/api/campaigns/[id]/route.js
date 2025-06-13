import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/campaigns/[id]
export async function GET(request, { params }) {
  try {
    const { id } = params

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true
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

    // Add calculated CTR
    const campaignWithCtr = {
      ...campaign,
      dismissedCount: 0,
      pendingCount: 0,
      ctr: campaign.sentCount > 0 
        ? ((campaign.clickedCount / campaign.sentCount) * 100).toFixed(1)
        : 0,
      abTest: {
        enabled: campaign.abTestEnabled,
        variantA: campaign.variantA,
        variantB: campaign.variantB,
        trafficSplit: campaign.trafficSplit
      }
    }

    return NextResponse.json({
      success: true,
      campaign: campaignWithCtr
    })
  } catch (error) {
    console.error('Error fetching campaign:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign' },
      { status: 500 }
    )
  }
}

// DELETE /api/campaigns/[id]
export async function DELETE(request, { params }) {
  try {
    const { id } = params
    
    // TODO: Implement actual deletion from database
    console.log('Deleting campaign:', id)

    return NextResponse.json({
      success: true,
      message: 'Campaign deleted successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    )
  }
}