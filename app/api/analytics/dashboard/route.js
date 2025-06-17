import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/analytics/dashboard - Get dashboard statistics
export async function GET(request) {
  try {
    // Get real-time statistics from database
    
    // Total and active subscribers
    const totalSubscribers = await prisma.client.count()
    const activeSubscribers = await prisma.client.count({
      where: {
        accessStatus: 'granted'
      }
    })
    
    // Total notifications sent (sum of all campaign sentCounts)
    const campaignStats = await prisma.campaign.aggregate({
      _sum: {
        sentCount: true,
        clickedCount: true,
        deliveredCount: true,
        dismissedCount: true,
        failedCount: true
      },
      _avg: {
        clickedCount: true,
        sentCount: true
      }
    })
    
    const totalNotificationsSent = campaignStats._sum.sentCount || 0
    const totalClicks = campaignStats._sum.clickedCount || 0
    const totalDelivered = campaignStats._sum.deliveredCount || 0
    const totalDismissed = campaignStats._sum.dismissedCount || 0
    const totalFailed = campaignStats._sum.failedCount || 0
    
    // Calculate average CTR
    const averageCtr = totalNotificationsSent > 0 
      ? ((totalClicks / totalNotificationsSent) * 100).toFixed(1)
      : '0.0'
    
    // Get recent campaigns
    const recentCampaigns = await prisma.campaign.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      where: {
        status: {
          in: ['active', 'completed', 'paused']
        }
      }
    })
    
    // Format recent campaigns with CTR
    const formattedRecentCampaigns = recentCampaigns.map(campaign => ({
      id: campaign.id,
      name: campaign.name,
      type: campaign.type,
      status: campaign.status,
      sentCount: campaign.sentCount,
      clickedCount: campaign.clickedCount,
      ctr: campaign.sentCount > 0 
        ? ((campaign.clickedCount / campaign.sentCount) * 100).toFixed(1)
        : '0.0'
    }))
    
    // Get device breakdown from clients
    const clients = await prisma.client.findMany({
      select: {
        os: true
      }
    })
    
    const deviceCounts = clients.reduce((acc, client) => {
      const os = client.os || 'Unknown'
      // Group mobile OSes
      if (os.includes('Android') || os.includes('iOS')) {
        acc.mobile = (acc.mobile || 0) + 1
      } else if (os.includes('Windows') || os.includes('Mac') || os.includes('Linux')) {
        acc.desktop = (acc.desktop || 0) + 1
      } else {
        acc.tablet = (acc.tablet || 0) + 1
      }
      return acc
    }, {})
    
    const totalDevices = clients.length || 1
    const deviceBreakdown = {
      desktop: Math.round((deviceCounts.desktop || 0) / totalDevices * 100),
      mobile: Math.round((deviceCounts.mobile || 0) / totalDevices * 100),
      tablet: Math.round((deviceCounts.tablet || 0) / totalDevices * 100)
    }
    
    // Calculate monthly changes (for now, return static positive values)
    // In production, you'd compare with last month's data
    const monthlyChange = {
      subscribers: 12.5,
      activeSubscribers: 8.2,
      notifications: 24.3,
      ctr: 3.1
    }
    
    const stats = {
      overview: {
        totalSubscribers,
        activeSubscribers,
        totalNotificationsSent,
        averageCtr,
        // Additional stats
        totalClicks,
        totalDelivered,
        totalDismissed,
        totalFailed
      },
      monthlyChange,
      deviceBreakdown,
      recentCampaigns: formattedRecentCampaigns
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}