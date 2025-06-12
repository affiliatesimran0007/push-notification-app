import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { clientEvents } from '@/lib/clientEvents'

// GET /api/clients - Get all clients with filtering
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const browser = searchParams.get('browser') || ''
    const country = searchParams.get('country') || ''
    const device = searchParams.get('device') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build where clause
    const where = {
      AND: [
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
        skip,
        take: limit,
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
    const body = await request.json()
    const { subscription, browserInfo, location, landingId, domain, url, accessStatus } = body

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
      // Update existing client with latest info
      const updatedClient = await prisma.client.update({
        where: { id: existingClient.id },
        data: { 
          lastActive: new Date(),
          ip: clientIp !== 'unknown' ? clientIp : existingClient.ip,
          browser: browserInfo.browser || existingClient.browser,
          browserVersion: browserInfo.version || existingClient.browserVersion,
          country: location?.country || existingClient.country,
          city: location?.city || existingClient.city,
          os: browserInfo.os || existingClient.os,
          device: browserInfo.device || existingClient.device,
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

    // Create new client
    const newClient = await prisma.client.create({
      data: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        browser: browserInfo.browser || 'unknown',
        browserVersion: browserInfo.version || 'unknown',
        ip: clientIp,
        country: location?.country || 'Unknown',
        city: location?.city || 'Unknown',
        os: browserInfo.os || 'unknown',
        device: browserInfo.device || 'desktop',
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