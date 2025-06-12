import { NextResponse } from 'next/server'

// Temporary in-memory storage for analytics events
let analyticsEvents = []

// POST /api/analytics/track - Track analytics events
export async function POST(request) {
  try {
    const body = await request.json()
    const { event, campaignId, clientId, timestamp, metadata } = body

    if (!event) {
      return NextResponse.json(
        { error: 'Event type is required' },
        { status: 400 }
      )
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

    // In production, this would:
    // 1. Store in database
    // 2. Update campaign metrics
    // 3. Update real-time dashboards
    // 4. Trigger webhooks if configured

    console.log('Analytics event tracked:', analyticsEvent)

    return NextResponse.json({
      success: true,
      eventId: analyticsEvent.id
    })
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