import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/debug-campaign-errors - Debug campaign errors
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')
    
    if (!campaignId) {
      // Get recent campaign with errors
      const campaignWithErrors = await prisma.campaign.findFirst({
        where: {
          failedCount: { gt: 0 }
        },
        orderBy: { createdAt: 'desc' }
      })
      
      if (!campaignWithErrors) {
        return NextResponse.json({ message: 'No campaigns with errors found' })
      }
      
      return NextResponse.json({ 
        message: 'Found campaign with errors',
        campaign: {
          id: campaignWithErrors.id,
          name: campaignWithErrors.name,
          failedCount: campaignWithErrors.failedCount,
          sentCount: campaignWithErrors.sentCount,
          image: campaignWithErrors.image
        },
        debugUrl: `/api/debug-campaign-errors?campaignId=${campaignWithErrors.id}`
      })
    }
    
    // Get specific campaign details
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        notifications: {
          where: {
            status: 'failed'
          },
          include: {
            client: {
              select: {
                id: true,
                endpoint: true,
                browser: true,
                os: true,
                createdAt: true
              }
            }
          }
        }
      }
    })
    
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }
    
    // Analyze failed notifications
    const failureAnalysis = {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        image: campaign.image,
        imageSize: campaign.image ? new Blob([campaign.image]).size : 0,
        sentCount: campaign.sentCount,
        failedCount: campaign.failedCount
      },
      failedClients: campaign.notifications.map(n => ({
        clientId: n.client.id,
        browser: n.client.browser,
        os: n.client.os,
        endpoint: n.client.endpoint.substring(0, 50) + '...',
        error: n.error,
        createdAt: n.client.createdAt
      })),
      summary: {
        totalFailed: campaign.notifications.length,
        byBrowser: campaign.notifications.reduce((acc, n) => {
          const browser = n.client.browser || 'Unknown'
          acc[browser] = (acc[browser] || 0) + 1
          return acc
        }, {}),
        byOS: campaign.notifications.reduce((acc, n) => {
          const os = n.client.os || 'Unknown'
          acc[os] = (acc[os] || 0) + 1
          return acc
        }, {}),
        byError: campaign.notifications.reduce((acc, n) => {
          const error = n.error || 'Unknown'
          acc[error] = (acc[error] || 0) + 1
          return acc
        }, {})
      }
    }
    
    return NextResponse.json(failureAnalysis)
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json(
      { error: 'Failed to debug campaign', details: error.message },
      { status: 500 }
    )
  }
}