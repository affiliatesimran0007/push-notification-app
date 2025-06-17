import { NextResponse } from 'next/server'
import webPushService from '@/lib/webPushService'

// POST /api/test-emoji-icons/payload - Test payload creation with emoji icons
export async function POST(request) {
  try {
    const body = await request.json()
    const { title, message, icon } = body

    console.log('Testing payload creation for:', { title, icon })

    // Create the notification payload
    const payload = webPushService.createNotificationPayload({
      title,
      body: message,
      icon,
      url: 'https://example.com',
      requireInteraction: true
    })

    // Calculate payload size
    const payloadString = JSON.stringify(payload)
    const payloadSize = payloadString.length

    // Validation checks
    const validationIssues = []
    
    if (title.length > 100) {
      validationIssues.push(`Title too long: ${title.length} characters (max 100)`)
    }
    
    if (message.length > 255) {
      validationIssues.push(`Message too long: ${message.length} characters (max 255)`)
    }
    
    if (payloadSize > 4096) {
      validationIssues.push(`Payload too large: ${payloadSize} bytes (recommended max 4096)`)
    }

    // Check if icon was converted
    const iconConverted = icon && icon !== payload.icon
    
    return NextResponse.json({
      success: true,
      payload,
      payloadSize,
      payloadString: payloadString.substring(0, 500) + '...',
      validationPassed: validationIssues.length === 0,
      validationIssues,
      iconConverted,
      originalIcon: icon,
      convertedIcon: payload.icon
    })
  } catch (error) {
    console.error('Payload test error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create payload',
        details: error.message 
      },
      { status: 500 }
    )
  }
}