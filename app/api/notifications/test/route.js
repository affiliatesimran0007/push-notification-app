import { NextResponse } from 'next/server'

// POST /api/notifications/test - Show test notification in browser
export async function POST(request) {
  try {
    const body = await request.json()
    const { clientId } = body

    // For testing, we'll return success
    // In a real implementation, this would trigger an actual push notification
    return NextResponse.json({
      success: true,
      message: 'Test notification sent',
      note: 'In production, this would send a real push notification. For demo purposes, check the browser console.'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to send test notification' },
      { status: 500 }
    )
  }
}