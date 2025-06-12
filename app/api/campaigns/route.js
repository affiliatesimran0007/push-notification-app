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
      orderBy: { createdAt: 'desc' },
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

    const campaignData = {
      name: body.name,
      type: body.type || 'promotional',
      status: body.scheduledFor ? 'scheduled' : 'active',
      title: body.title,
      message: body.message,
      url: body.url || '',
      icon: body.icon || '/icon-192x192.png',
      badge: body.badge || '/badge-72x72.png',
      targetAudience: body.targetAudience || 'all',
      scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : null,
      sentAt: body.scheduledFor ? null : new Date(),
      userId: adminUser.id,
      abTestEnabled: body.abTest?.enabled || false,
      variantA: body.abTest?.enabled ? body.abTest.variantA : null,
      variantB: body.abTest?.enabled ? body.abTest.variantB : null,
      trafficSplit: body.abTest?.trafficSplit || 50
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

    // If immediate send, trigger notification delivery
    if (!body.scheduledFor) {
      // Get all clients or specific segment
      const clients = await prisma.client.findMany({
        where: body.targetAudience === 'all' ? {} : {
          // TODO: Implement segment filtering
        },
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
            campaignId: newCampaign.id
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

    const campaignIndex = campaigns.findIndex(c => c.id === campaignId)
    if (campaignIndex === -1) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    campaigns[campaignIndex] = {
      ...campaigns[campaignIndex],
      ...body,
      updatedAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      campaign: campaigns[campaignIndex]
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    )
  }
}