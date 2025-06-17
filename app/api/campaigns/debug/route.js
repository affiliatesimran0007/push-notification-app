import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/campaigns/debug - Get detailed campaign error info
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('id')
    
    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 })
    }

    // Get campaign details
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        notifications: {
          take: 10,
          orderBy: { sentAt: 'desc' }
        }
      }
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Get failed notification details
    const failedDeliveries = await prisma.notificationDelivery.findMany({
      where: {
        campaignId,
        status: 'failed'
      },
      take: 10,
      include: {
        client: {
          select: {
            browser: true,
            os: true,
            endpoint: true
          }
        }
      }
    })

    // Check for potential issues
    const issues = []
    
    // Check icon
    if (campaign.icon) {
      if (campaign.icon.length <= 4 && !campaign.icon.startsWith('/') && !campaign.icon.startsWith('http')) {
        issues.push(`Icon appears to be an emoji: "${campaign.icon}" - this may cause issues`)
      }
      if (!campaign.icon.startsWith('http') && !campaign.icon.startsWith('data:') && !campaign.icon.startsWith('/')) {
        issues.push(`Icon has invalid format: "${campaign.icon}"`)
      }
    }
    
    // Check title length
    if (campaign.title && campaign.title.length > 100) {
      issues.push(`Title too long: ${campaign.title.length} characters (max 100)`)
    }
    
    // Check message length
    if (campaign.message && campaign.message.length > 255) {
      issues.push(`Message too long: ${campaign.message.length} characters (max 255)`)
    }
    
    // Check URL
    if (campaign.url && !campaign.url.startsWith('http')) {
      issues.push(`URL should start with http:// or https://: "${campaign.url}"`)
    }

    return NextResponse.json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        title: campaign.title,
        message: campaign.message,
        icon: campaign.icon,
        url: campaign.url,
        sentCount: campaign.sentCount,
        failedCount: campaign.failedCount,
        clickedCount: campaign.clickedCount,
        deliveredCount: campaign.deliveredCount
      },
      issues,
      failedDeliveries: failedDeliveries.map(d => ({
        error: d.error,
        client: d.client
      }))
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json(
      { error: 'Failed to get debug info' },
      { status: 500 }
    )
  }
}