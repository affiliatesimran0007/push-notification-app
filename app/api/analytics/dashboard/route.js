import { NextResponse } from 'next/server'

// GET /api/analytics/dashboard - Get dashboard statistics
export async function GET(request) {
  try {
    // In production, these would be calculated from database
    const stats = {
      overview: {
        totalSubscribers: 23847,
        activeSubscribers: 19234,
        totalNotificationsSent: 145678,
        averageCtr: 18.5
      },
      monthlyChange: {
        subscribers: 12.5,
        activeSubscribers: 8.2,
        notifications: 24.3,
        ctr: 3.1
      },
      deviceBreakdown: {
        desktop: 45,
        mobile: 40,
        tablet: 15
      },
      recentCampaigns: [
        {
          id: '1',
          name: 'New Year Sale 2024',
          type: 'promotional',
          status: 'completed',
          sentCount: 15234,
          ctr: 23.4
        },
        {
          id: '2',
          name: 'Weekly Newsletter',
          type: 'content',
          status: 'active',
          sentCount: 8456,
          ctr: 15.2
        },
        {
          id: '3',
          name: 'Cart Abandonment',
          type: 'transactional',
          status: 'active',
          sentCount: 3234,
          ctr: 28.7
        }
      ]
    }

    return NextResponse.json(stats)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}