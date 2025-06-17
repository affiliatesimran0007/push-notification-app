import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { campaignEvents } from '@/lib/campaignEvents'

// Temporary in-memory storage for analytics events
let analyticsEvents = []

// OPTIONS /api/analytics/track - Handle CORS preflight
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

// POST /api/analytics/track - Track analytics events
export async function POST(request) {
  try {
    const body = await request.json()
    const { event, campaignId, clientId, timestamp, metadata } = body
    
    console.log('\n=== ANALYTICS TRACKING REQUEST ===')
    console.log('Event:', event)
    console.log('Campaign ID:', campaignId)
    console.log('Client ID:', clientId)
    console.log('Timestamp:', timestamp)
    console.log('Metadata:', metadata)
    console.log('Headers:', {
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer'),
      userAgent: request.headers.get('user-agent')
    })
    console.log('=================================\n')

    if (!event) {
      const response = NextResponse.json(
        { error: 'Event type is required' },
        { status: 400 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    const analyticsEvent = {
      id: Date.now().toString(),
      event,
      campaignId,
      clientId,
      timestamp: timestamp || new Date().toISOString(),
      metadata: metadata || {},
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    }

    analyticsEvents.push(analyticsEvent)

    // Update campaign metrics based on event type
    if (campaignId) {
      try {
        if (event === 'notification_clicked' || event === 'click') {
          // Update click count
          const updatedCampaign = await prisma.campaign.update({
            where: { id: campaignId },
            data: {
              clickedCount: { increment: 1 }
            }
          })
          
          // Emit real-time update
          campaignEvents.emitStatsUpdate(campaignId, {
            clickedCount: updatedCampaign.clickedCount,
            sentCount: updatedCampaign.sentCount,
            ctr: updatedCampaign.sentCount > 0
              ? ((updatedCampaign.clickedCount / updatedCampaign.sentCount) * 100).toFixed(1)
              : '0.0'
          })
        } else if (event === 'notification_delivered') {
          // Update delivered count
          const updatedCampaign = await prisma.campaign.update({
            where: { id: campaignId },
            data: {
              deliveredCount: { increment: 1 }
            }
          })
          
          // Emit real-time update
          campaignEvents.emitStatsUpdate(campaignId, {
            deliveredCount: updatedCampaign.deliveredCount
          })
        }
      } catch (dbError) {
        console.error('Failed to update campaign metrics:', dbError)
        // Continue even if database update fails
      }
    }

    console.log('Analytics event tracked:', analyticsEvent)

    // Add CORS headers for cross-origin requests from service workers
    const response = NextResponse.json({
      success: true,
      eventId: analyticsEvent.id
    })
    
    // Allow requests from any origin (service workers on customer domains)
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    
    return response
  } catch (error) {
    console.error('Failed to track analytics:', error)
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    )
  }
}

// GET /api/analytics/track - Get analytics events (for debugging)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')
    const eventType = searchParams.get('event')
    const limit = parseInt(searchParams.get('limit') || '100')

    let filteredEvents = analyticsEvents
    
    if (campaignId) {
      filteredEvents = filteredEvents.filter(e => e.campaignId === campaignId)
    }
    
    if (eventType) {
      filteredEvents = filteredEvents.filter(e => e.event === eventType)
    }

    // Sort by timestamp (newest first)
    filteredEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    // Apply limit
    filteredEvents = filteredEvents.slice(0, limit)

    return NextResponse.json({
      events: filteredEvents,
      total: filteredEvents.length
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}