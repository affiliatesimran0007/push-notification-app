import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/campaigns
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build where clause
    const where = {
      AND: [
        status ? { status } : {},
        type ? { type } : {}
      ]
    }

    // Get total count
    const total = await prisma.campaign.count({ where })

    // Get paginated campaigns with calculated CTR
    const campaigns = await prisma.campaign.findMany({
      where,
      skip,
      take: limit,
      orderBy: [
        { sentAt: { sort: 'desc', nulls: 'last' } },
        { scheduledFor: { sort: 'desc', nulls: 'last' } },
        { createdAt: 'desc' }
      ],
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // Add calculated CTR to each campaign
    const campaignsWithCtr = campaigns.map(campaign => ({
      ...campaign,
      dismissedCount: 0, // Set to 0 since columns don't exist yet
      pendingCount: 0,   // Set to 0 since columns don't exist yet
      ctr: campaign.clickedCount > 0 && campaign.sentCount > 0
        ? ((campaign.clickedCount / campaign.sentCount) * 100).toFixed(1)
        : 0,
      abTest: {
        enabled: campaign.abTestEnabled,
        variantA: campaign.variantA,
        variantB: campaign.variantB,
        trafficSplit: campaign.trafficSplit
      }
    }))

    return NextResponse.json({
      campaigns: campaignsWithCtr,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Failed to fetch campaigns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
}

// POST /api/campaigns - Create new campaign
export async function POST(request) {
  try {
    const body = await request.json()
    
    // TODO: Get user ID from session when auth is implemented
    // For now, use the first admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'admin' }
    })

    if (!adminUser) {
      return NextResponse.json(
        { error: 'No admin user found. Please run seed script.' },
        { status: 400 }
      )
    }

    // Build actions array from button data
    const actions = []
    const actionData = [] // Full action data with URLs
    if (body.button1Text && body.button1Url) {
      actions.push({
        action: 'button1',
        title: body.button1Text
      })
      actionData.push({
        action: 'button1',
        title: body.button1Text,
        url: body.button1Url
      })
    }
    if (body.button2Text && body.button2Url) {
      actions.push({
        action: 'button2',
        title: body.button2Text
      })
      actionData.push({
        action: 'button2',
        title: body.button2Text,
        url: body.button2Url
      })
    }

    const campaignData = {
      name: body.name,
      type: body.type || 'promotional',
      status: body.status || (body.scheduledFor ? 'scheduled' : 'active'),
      title: body.title || '',
      message: body.message || '',
      url: body.url || '',
      icon: body.icon || '/icon-192x192.png',
      badge: body.badge || '/badge-72x72.png',
      image: body.image || '',
      targetAudience: body.targetAudience || 'all',
      scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : null,
      sentAt: body.status === 'draft' ? null : (body.scheduledFor ? null : new Date()),
      userId: adminUser.id,
      abTestEnabled: false,
      variantA: actionData.length > 0 || body.targetBrowsers || body.targetSystems ? { 
        actions: actionData.length > 0 ? actionData : undefined,
        targetBrowsers: body.targetBrowsers || undefined,
        targetSystems: body.targetSystems || undefined
      } : null,
      variantB: null,
      trafficSplit: 50
    }

    const newCampaign = await prisma.campaign.create({
      data: campaignData,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // If immediate send and not a draft, trigger notification delivery
    if (!body.scheduledFor && body.status !== 'draft') {
      // Get clients based on target audience
      let whereClause = {}
      
      if (body.targetAudience !== 'all') {
        // Check if it's a landing page selection
        if (body.targetAudience.startsWith('landing:')) {
          const landingId = body.targetAudience.replace('landing:', '')
          whereClause = { landingId }
        } else {
          // Handle other segment types in the future
          whereClause = {}
        }
      }
      
      const clients = await prisma.client.findMany({
        where: whereClause,
        select: { id: true }
      })

      if (clients.length > 0) {
        // Send notifications via the notifications API
        const notificationPayload = {
          clientIds: clients.map(c => c.id),
          notification: {
            title: newCampaign.title,
            message: newCampaign.message,
            url: newCampaign.url,
            icon: newCampaign.icon,
            badge: newCampaign.badge,
            campaignId: newCampaign.id,
            actions: actions || [],
            requireInteraction: true
          }
        }

        // Call the notifications/send endpoint
        const baseUrl = request.headers.get('host')
        const protocol = request.headers.get('x-forwarded-proto') || 'http'
        const response = await fetch(`${protocol}://${baseUrl}/api/notifications/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notificationPayload)
        })

        if (!response.ok) {
          console.error('Failed to send notifications')
        }
      }
    }

    return NextResponse.json({
      success: true,
      campaign: {
        ...newCampaign,
        ctr: 0,
        abTest: {
          enabled: newCampaign.abTestEnabled,
          variantA: newCampaign.variantA,
          variantB: newCampaign.variantB,
          trafficSplit: newCampaign.trafficSplit
        }
      }
    })
  } catch (error) {
    console.error('Failed to create campaign:', error)
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    )
  }
}

// PUT /api/campaigns/[id] - Update campaign
export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('id')
    const body = await request.json()

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID required' },
        { status: 400 }
      )
    }

    // Check if campaign exists
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    })

    if (!existingCampaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Build actions array from button data if provided
    let actions = null
    if (body.button1Text || body.button2Text) {
      actions = []
      if (body.button1Text && body.button1Url) {
        actions.push({
          action: 'button1',
          title: body.button1Text,
          url: body.button1Url
        })
      }
      if (body.button2Text && body.button2Url) {
        actions.push({
          action: 'button2',
          title: body.button2Text,
          url: body.button2Url
        })
      }
    }

    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        name: body.name || undefined,
        title: body.title || undefined,
        message: body.message || undefined,
        url: body.url !== undefined ? body.url : undefined,
        icon: body.icon || undefined,
        image: body.image || undefined,
        targetAudience: body.targetAudience || undefined,
        status: body.status || undefined,
        scheduledFor: body.scheduledFor !== undefined ? (body.scheduledFor ? new Date(body.scheduledFor) : null) : undefined,
        variantA: actions || body.targetBrowsers || body.targetSystems ? { 
          actions: actions || undefined,
          targetBrowsers: body.targetBrowsers || undefined,
          targetSystems: body.targetSystems || undefined
        } : undefined
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      campaign: updatedCampaign
    })
  } catch (error) {
    console.error('Failed to update campaign:', error)
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    )
  }
}

// DELETE /api/campaigns/[id] - Delete campaign
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('id')

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID required' },
        { status: 400 }
      )
    }

    // Check if campaign exists and is a draft
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Allow deletion of any campaign with appropriate warnings on frontend
    
    // First delete related notification deliveries
    await prisma.notificationDelivery.deleteMany({
      where: { campaignId }
    })
    
    // Then delete the campaign
    await prisma.campaign.delete({
      where: { id: campaignId }
    })

    return NextResponse.json({
      success: true,
      message: 'Campaign deleted successfully'
    })
  } catch (error) {
    console.error('Failed to delete campaign:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete campaign',
        details: error.message,
        success: false
      },
      { status: 500 }
    )
  }
}