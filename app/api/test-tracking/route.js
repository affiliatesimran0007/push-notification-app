import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/test-tracking - Test tracking endpoints
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const campaignId = searchParams.get('campaignId')
    
    if (!campaignId) {
      // Get a test campaign
      const campaign = await prisma.campaign.findFirst({
        orderBy: { createdAt: 'desc' }
      })
      
      if (!campaign) {
        return NextResponse.json({ error: 'No campaigns found' }, { status: 404 })
      }
      
      return NextResponse.json({
        message: 'Test tracking endpoints',
        campaign: {
          id: campaign.id,
          name: campaign.name,
          sentCount: campaign.sentCount,
          clickedCount: campaign.clickedCount,
          dismissedCount: campaign.dismissedCount,
          ctr: campaign.sentCount > 0 ? ((campaign.clickedCount / campaign.sentCount) * 100).toFixed(1) : 0
        },
        endpoints: {
          testClick: `/api/test-tracking?action=click&campaignId=${campaign.id}`,
          testDismiss: `/api/test-tracking?action=dismiss&campaignId=${campaign.id}`,
          checkStats: `/api/campaigns/${campaign.id}/stats`
        }
      })
    }
    
    // Get current stats
    const beforeCampaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    })
    
    if (!beforeCampaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }
    
    let result = { before: {
      clickedCount: beforeCampaign.clickedCount,
      dismissedCount: beforeCampaign.dismissedCount
    }}
    
    if (action === 'click') {
      // Test click tracking
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://push-notification-app-steel.vercel.app'}/api/analytics/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'notification_clicked',
          campaignId: campaignId,
          clientId: 'test-client-' + Date.now(),
          timestamp: new Date().toISOString(),
          metadata: { action: 'test' }
        })
      })
      
      result.trackResponse = {
        status: response.status,
        body: await response.json()
      }
    } else if (action === 'dismiss') {
      // Test dismiss tracking
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://push-notification-app-steel.vercel.app'}/api/campaigns/track-dismiss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaignId,
          clientId: 'test-client-' + Date.now()
        })
      })
      
      result.dismissResponse = {
        status: response.status,
        body: await response.json()
      }
    }
    
    // Get updated stats
    const afterCampaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    })
    
    result.after = {
      clickedCount: afterCampaign.clickedCount,
      dismissedCount: afterCampaign.dismissedCount,
      ctr: afterCampaign.sentCount > 0 ? ((afterCampaign.clickedCount / afterCampaign.sentCount) * 100).toFixed(1) : 0
    }
    
    result.changed = {
      clicks: afterCampaign.clickedCount - beforeCampaign.clickedCount,
      dismissals: afterCampaign.dismissedCount - beforeCampaign.dismissedCount
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Test tracking error:', error)
    return NextResponse.json(
      { error: 'Test failed', details: error.message },
      { status: 500 }
    )
  }
}