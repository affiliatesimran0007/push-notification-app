import { NextResponse } from 'next/server'

// GET /api/test-hero-image - Test hero image support
export async function GET(request) {
  const testImageUrl = "https://mms.businesswire.com/media/20250521691026/en/2476045/4/DS1_9417.jpg"
  
  // Test payload with hero image
  const testPayload = {
    title: "Test Notification",
    body: "Testing hero image support",
    icon: "https://push-notification-app-steel.vercel.app/icon-192x192.png",
    badge: "https://push-notification-app-steel.vercel.app/badge-72x72.png",
    image: testImageUrl,
    tag: "test-" + Date.now(),
    requireInteraction: true,
    actions: [],
    data: {
      url: "https://example.com",
      campaignId: "test",
      clientId: "test"
    }
  }
  
  const payloadSize = JSON.stringify(testPayload).length
  
  // Check image accessibility
  let imageAccessible = false
  let imageError = null
  
  try {
    const response = await fetch(testImageUrl, { method: 'HEAD' })
    imageAccessible = response.ok
    if (!response.ok) {
      imageError = `HTTP ${response.status}`
    }
  } catch (error) {
    imageError = error.message
  }
  
  return NextResponse.json({
    testImageUrl,
    payloadSize,
    payloadSizeKB: (payloadSize / 1024).toFixed(2) + ' KB',
    isPayloadTooLarge: payloadSize > 4000,
    imageAccessible,
    imageError,
    notes: {
      maxPayloadSize: "4KB (4096 bytes)",
      currentSize: payloadSize + " bytes",
      recommendation: payloadSize > 4000 ? "Payload is too large, may fail on some devices" : "Payload size is acceptable"
    },
    browserSupport: {
      chrome: "Supported (Desktop & Android)",
      firefox: "Supported (Desktop)",
      safari: "Not supported on iOS",
      edge: "Supported",
      note: "Hero images may not display on all devices/browsers"
    }
  })
}