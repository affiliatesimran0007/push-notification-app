import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// POST /api/campaigns/track-dismiss - Track notification dismissal
export async function POST(request) {
  try {
    const body = await request.json()
    const { campaignId } = body

    if (!campaignId) {
      return NextResponse.json(
        { error: 'campaignId is required' },
        { status: 400 }
      )
    }

    // dismissedCount not implemented yet
    // For now, just return success
    console.log('Dismiss tracked for campaign:', campaignId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking dismiss:', error)
    return NextResponse.json(
      { error: 'Failed to track dismiss' },
      { status: 500 }
    )
  }
}