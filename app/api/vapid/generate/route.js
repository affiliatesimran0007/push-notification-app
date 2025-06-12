import { NextResponse } from 'next/server'
import webpush from 'web-push'

// GET /api/vapid/generate - Generate new VAPID keys
export async function GET(request) {
  try {
    // In production, check authentication/authorization
    // This endpoint should be protected and only accessible to admins
    
    const vapidKeys = webpush.generateVAPIDKeys()
    
    return NextResponse.json({
      success: true,
      keys: {
        publicKey: vapidKeys.publicKey,
        privateKey: vapidKeys.privateKey
      },
      info: 'Store these keys securely in your .env.local file'
    })
  } catch (error) {
    console.error('Failed to generate VAPID keys:', error)
    return NextResponse.json(
      { error: 'Failed to generate VAPID keys' },
      { status: 500 }
    )
  }
}