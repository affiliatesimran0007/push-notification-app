import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// Handle beacon API requests (POST only)
export async function POST(request) {
  try {
    // Get text body from beacon
    const text = await request.text()
    const data = JSON.parse(text)
    
    // Extract subscription data
    const { subscription, landingId, domain, url, accessStatus, browserInfo, location } = data
    
    // Check if client already exists
    const existingClient = await prisma.client.findUnique({
      where: { endpoint: subscription.endpoint }
    })
    
    if (existingClient) {
      // Update existing client
      await prisma.client.update({
        where: { endpoint: subscription.endpoint },
        data: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          lastActiveAt: new Date(),
          accessStatus: accessStatus || 'allowed'
        }
      })
      
      return new Response('OK', { status: 200 })
    }
    
    // Get landing page info
    const landing = await prisma.landing.findUnique({
      where: { landingId: landingId }
    })
    
    if (!landing) {
      return new Response('Landing not found', { status: 404 })
    }
    
    // Determine operating system from browser info
    const os = browserInfo?.os || 'Unknown'
    let operatingSystem = 'Unknown'
    
    if (os.toLowerCase().includes('windows')) {
      operatingSystem = 'Windows'
    } else if (os.toLowerCase().includes('mac')) {
      operatingSystem = 'macOS'
    } else if (os.toLowerCase().includes('linux')) {
      operatingSystem = 'Linux'
    } else if (os.toLowerCase().includes('android')) {
      operatingSystem = 'Android'
    } else if (os.toLowerCase().includes('ios')) {
      operatingSystem = 'iOS'
    }
    
    // Create new client
    await prisma.client.create({
      data: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        landingId: landingId,
        landingPageDomain: landing.domain,
        subscribedAt: new Date(),
        lastActiveAt: new Date(),
        subscribedUrl: url,
        accessStatus: accessStatus || 'allowed',
        browser: browserInfo?.browser || 'Unknown',
        browserVersion: browserInfo?.version || 'Unknown',
        operatingSystem: operatingSystem,
        device: browserInfo?.device || 'Unknown',
        language: browserInfo?.language || 'en',
        location: `${location?.city || 'Unknown'}, ${location?.country || 'Unknown'}`,
        ipAddress: location?.ip || 'Unknown',
        userAgent: browserInfo?.userAgent || 'Unknown',
        timezone: browserInfo?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        platform: browserInfo?.platform || 'Unknown'
      }
    })
    
    // Increment subscriber count
    await prisma.landing.update({
      where: { id: landing.id },
      data: {
        subscriberCount: { increment: 1 }
      }
    })
    
    return new Response('OK', { status: 200 })
    
  } catch (error) {
    console.error('Beacon API error:', error)
    // Beacon API should always return 200 to prevent retries
    return new Response('OK', { status: 200 })
  }
}