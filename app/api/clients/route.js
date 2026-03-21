import { NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import prisma from '@/lib/db'
import { clientEvents } from '@/lib/clientEvents'
import { parseBrowserInfo } from '@/lib/browserParser'

// ── HMAC challenge validation ────────────────────────────────────────────────
// Validates the x-session-id header sent by push-page.js.
// token = HMAC-SHA256(CHALLENGE_SECRET, window:nonce).slice(0,32)
// nonce = 8-hex-seconds + 8-random-hex  (issue timestamp embedded)
function validateSessionToken(header) {
  const secret = process.env.CHALLENGE_SECRET
  if (!secret) return true // not configured — allow (dev mode)

  if (!header) return false
  const parts = header.split(':')
  if (parts.length !== 2) return false
  const [token, nonce] = parts

  // Extract issue timestamp from nonce
  if (nonce.length !== 16) return false
  const issuedAtMs = parseInt(nonce.slice(0, 8), 16) * 1000
  if (isNaN(issuedAtMs)) return false

  const elapsed = Date.now() - issuedAtMs

  // Must be > 200ms (too fast = bot) and < 10 min (stale)
  if (elapsed < 200 || elapsed > 600000) return false

  // Validate HMAC for current and previous 5-min window (clock skew tolerance)
  const issuedWindow = Math.floor(issuedAtMs / 1000 / 300)
  for (const w of [issuedWindow, issuedWindow - 1, issuedWindow + 1]) {
    const expected = createHmac('sha256', secret)
      .update(`${w}:${nonce}`)
      .digest('hex')
      .slice(0, 32)
    if (expected === token) return true
  }
  return false
}

// ── IP rate limiting (in-memory, no Redis needed) ────────────────────────────
const ipRegistry = new Map() // ip → { count, windowStart }
const RATE_LIMIT = 10        // max registrations per window
const RATE_WINDOW = 3600000  // 1 hour

function checkRateLimit(ip) {
  const now = Date.now()
  const entry = ipRegistry.get(ip)

  if (!entry || now - entry.windowStart > RATE_WINDOW) {
    ipRegistry.set(ip, { count: 1, windowStart: now })
    return true
  }

  if (entry.count >= RATE_LIMIT) return false

  entry.count++
  return true
}

// Periodic cleanup to prevent memory growth
setInterval(() => {
  const cutoff = Date.now() - RATE_WINDOW
  for (const [ip, entry] of ipRegistry) {
    if (entry.windowStart < cutoff) ipRegistry.delete(ip)
  }
}, 3600000)

// GET /api/clients - Get all clients with filtering
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const browser = searchParams.get('browser') || ''
    const country = searchParams.get('country') || ''
    const device = searchParams.get('device') || ''
    const accessStatus = searchParams.get('accessStatus') || 'allowed' // Default to allowed
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build where clause - filter by access status (default to allowed)
    const where = {
      AND: [
        accessStatus === 'all' ? {} : { accessStatus }, // Show all or filter by status
        search ? {
          OR: [
            { browser: { contains: search, mode: 'insensitive' } },
            { country: { contains: search, mode: 'insensitive' } },
            { city: { contains: search, mode: 'insensitive' } },
            { subscribedUrl: { contains: search, mode: 'insensitive' } }
          ]
        } : {},
        browser ? { browser: { equals: browser, mode: 'insensitive' } } : {},
        country ? { country: { equals: country, mode: 'insensitive' } } : {},
        device ? { device: { equals: device, mode: 'insensitive' } } : {}
      ]
    }

    // Execute count and data fetch in parallel for better performance
    const [total, clients] = await Promise.all([
      prisma.client.count({ where }),
      prisma.client.findMany({
        where,
        // Remove pagination - show all allowed clients
        orderBy: { subscribedAt: 'desc' },
        include: {
          landingPage: {
            select: {
              id: true,
              name: true,
              domain: true,
              landingId: true
            }
          }
        }
      })
    ])

    return NextResponse.json({
      clients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Failed to fetch clients:', error)
    console.error('Error details:', error.message)
    console.error('Stack trace:', error.stack)
    return NextResponse.json(
      { error: 'Failed to fetch clients', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/clients - Register new client
export async function POST(request) {
  try {
    // ── Gate 1: HMAC session token ───────────────────────────────────────────
    const sessionHeader = request.headers.get('x-session-id')
    if (!validateSessionToken(sessionHeader)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── Gate 2: IP rate limiting ─────────────────────────────────────────────
    const forwardedIp = request.headers.get('x-forwarded-for')?.split(',')[0]
    const clientIpForRateLimit = forwardedIp || request.headers.get('x-real-ip') || 'unknown'
    if (!checkRateLimit(clientIpForRateLimit)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const body = await request.json()
    const { subscription, browserInfo, location, landingId, domain, url, accessStatus } = body

    // Validate subscription
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      )
    }
    
    // Validate p256dh and auth keys
    if (!subscription.keys.p256dh || !subscription.keys.auth) {
      return NextResponse.json(
        { error: 'Missing subscription keys (p256dh or auth)' },
        { status: 400 }
      )
    }
    
    // Enhanced debugging for subscription registration
    console.log('\n=== CLIENT REGISTRATION DEBUG ===')
    console.log('Timestamp:', new Date().toISOString())
    console.log('Registration details:', {
      endpoint: subscription.endpoint,
      endpointType: 
        subscription.endpoint.includes('fcm.googleapis.com') ? 'FCM (Chrome/Edge/Opera)' :
        subscription.endpoint.includes('mozilla.com') ? 'Mozilla (Firefox)' :
        subscription.endpoint.includes('windows.com') ? 'WNS (Edge Legacy)' :
        subscription.endpoint.includes('apple.com') ? 'Apple (Safari)' :
        subscription.endpoint.includes('push.example.com') ? '⚠️ FAKE ENDPOINT - WILL NOT WORK' :
        subscription.endpoint.includes('granted-') ? '⚠️ FAKE SUBSCRIPTION - WILL NOT WORK' :
        'Unknown',
      hasValidKeys: !!subscription.keys.p256dh && !!subscription.keys.auth,
      p256dh: subscription.keys.p256dh?.substring(0, 20) + '...',
      p256dhLength: subscription.keys.p256dh?.length,
      auth: subscription.keys.auth?.substring(0, 10) + '...',
      authLength: subscription.keys.auth?.length,
      isFakeSubscription: 
        subscription.endpoint.includes('push.example.com') ||
        subscription.endpoint.includes('granted-') ||
        subscription.keys.p256dh?.includes('demo') ||
        subscription.keys.p256dh?.includes('no-service-worker'),
      browserInfo,
      landingId,
      domain,
      url,
      accessStatus
    })
    
    // CRITICAL: Reject fake subscriptions
    if (subscription.endpoint.includes('push.example.com') || 
        subscription.endpoint.includes('granted-') ||
        subscription.keys.p256dh?.includes('demo') ||
        subscription.keys.p256dh?.includes('no-service-worker')) {
      console.error('⚠️ REJECTED: Fake subscription detected!')
      return NextResponse.json(
        { error: 'Invalid subscription - service worker not properly registered' },
        { status: 400 }
      )
    }

    // Get real IP address
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const remoteAddr = request.headers.get('remote-addr')
    const clientIp = forwardedFor?.split(',')[0] || realIp || remoteAddr || 'unknown'

    // Check if client already exists by endpoint
    const existingClient = await prisma.client.findUnique({
      where: { endpoint: subscription.endpoint }
    })
    
    console.log('Checking for existing client with endpoint:', subscription.endpoint)
    console.log('Existing client found:', existingClient ? 'Yes' : 'No')

    // Look up landing page if landingId is provided
    let landingPageId = null
    if (landingId) {
      const landingPage = await prisma.landingPage.findUnique({
        where: { landingId }
      })
      if (landingPage) {
        landingPageId = landingPage.id
      }
    }

    if (existingClient) {
      // Parse browser info from user agent
      const parsedInfo = parseBrowserInfo(browserInfo?.userAgent)
      
      // Extract timezone from browserInfo
      const timezone = browserInfo?.timezone || null
      
      // Update existing client with latest info
      const updatedClient = await prisma.client.update({
        where: { id: existingClient.id },
        data: { 
          lastActive: new Date(),
          ip: clientIp !== 'unknown' ? clientIp : existingClient.ip,
          browser: parsedInfo.browser !== 'unknown' ? parsedInfo.browser : existingClient.browser,
          browserVersion: parsedInfo.version !== 'unknown' ? parsedInfo.version : existingClient.browserVersion,
          country: location?.country || existingClient.country,
          city: timezone && existingClient.city === 'Unknown' ? `Unknown (${timezone})` : (location?.city || existingClient.city),
          os: parsedInfo.os !== 'unknown' ? parsedInfo.os : existingClient.os,
          device: parsedInfo.device || existingClient.device,
          subscribedUrl: body.url || existingClient.subscribedUrl,
          landingPageId: landingPageId || existingClient.landingPageId
        }
      })

      // Emit update event
      clientEvents.notifyClientUpdated(updatedClient)

      return NextResponse.json({
        success: true,
        client: updatedClient,
        isNew: false
      })
    }

    // Parse browser info from user agent
    const parsedInfo = parseBrowserInfo(browserInfo?.userAgent)
    
    // Extract timezone from browserInfo
    const timezone = browserInfo?.timezone || null
    const timezoneOffset = browserInfo?.timezoneOffset || null
    
    // Create new client
    const newClient = await prisma.client.create({
      data: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        browser: parsedInfo.browser,
        browserVersion: parsedInfo.version,
        ip: clientIp,
        country: location?.country || 'Unknown',
        city: location?.city || (timezone ? `Unknown (${timezone})` : 'Unknown'),
        os: parsedInfo.os,
        device: parsedInfo.device,
        subscribedUrl: url || body.url || '',
        tags: [],
        accessStatus: accessStatus || 'allowed',
        landingPageId: landingPageId
      }
    })

    // Emit new client event
    console.log('Emitting new client event for:', newClient.id)
    clientEvents.notifyNewClient(newClient)

    return NextResponse.json({
      success: true,
      client: newClient,
      isNew: true
    })
  } catch (error) {
    console.error('Failed to register client:', error)
    return NextResponse.json(
      { error: 'Failed to register client' },
      { status: 500 }
    )
  }
}

// DELETE /api/clients - Delete client(s)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('id')
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID required' },
        { status: 400 }
      )
    }

    // Delete related notification deliveries first
    await prisma.notificationDelivery.deleteMany({
      where: { clientId }
    })

    // Delete client segments
    await prisma.clientSegment.deleteMany({
      where: { clientId }
    })

    // Delete the client
    await prisma.client.delete({
      where: { id: clientId }
    })

    // Emit delete event
    clientEvents.notifyClientDeleted(clientId)

    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully'
    })
  } catch (error) {
    console.error('Failed to delete client:', error)
    console.error('Error details:', error.message)
    console.error('Stack trace:', error.stack)
    return NextResponse.json(
      { error: 'Failed to delete client', details: error.message },
      { status: 500 }
    )
  }
}