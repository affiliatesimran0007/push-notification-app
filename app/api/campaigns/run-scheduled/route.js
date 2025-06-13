import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/campaigns/run-scheduled - Check and run scheduled campaigns
export async function GET(request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'default-cron-secret'
    
    // Basic auth check (optional - for production use)
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.log('Unauthorized cron request')
      // For now, allow without auth for testing
    }
    
    // Find campaigns that are scheduled and ready to run
    const now = new Date()
    const scheduledCampaigns = await prisma.campaign.findMany({
      where: {
        status: 'scheduled',
        scheduledFor: {
          lte: now
        }
      },
      include: {
        user: true
      }
    })
    
    console.log(`Found ${scheduledCampaigns.length} scheduled campaigns to run`)
    
    const results = []
    
    for (const campaign of scheduledCampaigns) {
      try {
        // Update campaign status to active
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: {
            status: 'active',
            sentAt: now
          }
        })
        
        // Get target clients
        let whereClause = {}
        
        if (campaign.targetAudience !== 'all') {
          if (campaign.targetAudience.startsWith('landing:')) {
            const landingId = campaign.targetAudience.replace('landing:', '')
            whereClause = { landingId }
          }
        }
        
        // Apply browser/OS filtering if specified
        if (campaign.variantA?.targetBrowsers || campaign.variantA?.targetSystems) {
          const browserConditions = []
          const systemConditions = []
          
          if (campaign.variantA.targetBrowsers && !campaign.variantA.targetBrowsers.all) {
            const browsers = []
            if (campaign.variantA.targetBrowsers.chrome) browsers.push('Chrome')
            if (campaign.variantA.targetBrowsers.firefox) browsers.push('Firefox')
            if (campaign.variantA.targetBrowsers.edge) browsers.push('Edge')
            if (campaign.variantA.targetBrowsers.safari) browsers.push('Safari')
            if (campaign.variantA.targetBrowsers.opera) browsers.push('Opera')
            
            if (browsers.length > 0) {
              browserConditions.push({
                OR: browsers.map(b => ({ browser: { contains: b, mode: 'insensitive' } }))
              })
            }
          }
          
          if (campaign.variantA.targetSystems && !campaign.variantA.targetSystems.all) {
            const systems = []
            if (campaign.variantA.targetSystems.windows) systems.push('Windows')
            if (campaign.variantA.targetSystems.macos) systems.push('Mac')
            if (campaign.variantA.targetSystems.linux) systems.push('Linux')
            if (campaign.variantA.targetSystems.android) systems.push('Android')
            if (campaign.variantA.targetSystems.ios) systems.push('iOS')
            
            if (systems.length > 0) {
              systemConditions.push({
                OR: systems.map(s => ({ os: { contains: s, mode: 'insensitive' } }))
              })
            }
          }
          
          // Combine conditions
          if (browserConditions.length > 0 || systemConditions.length > 0) {
            whereClause.AND = [
              ...(whereClause.AND || []),
              ...browserConditions,
              ...systemConditions
            ]
          }
        }
        
        const clients = await prisma.client.findMany({
          where: whereClause,
          select: { id: true }
        })
        
        if (clients.length > 0) {
          // Build notification payload
          const notificationPayload = {
            clientIds: clients.map(c => c.id),
            notification: {
              title: campaign.title,
              message: campaign.message,
              url: campaign.url,
              icon: campaign.icon,
              badge: campaign.badge,
              campaignId: campaign.id,
              actions: campaign.variantA?.actions || []
            }
          }
          
          // Send notifications via the send endpoint
          const baseUrl = new URL(request.url).origin
          const response = await fetch(`${baseUrl}/api/notifications/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(notificationPayload)
          })
          
          const result = await response.json()
          
          results.push({
            campaignId: campaign.id,
            campaignName: campaign.name,
            targetClients: clients.length,
            sent: result.sent || 0,
            failed: result.failed || 0,
            success: response.ok,
            error: result.error
          })
          
          // Update campaign status based on result
          if (result.sent && result.sent > 0) {
            await prisma.campaign.update({
              where: { id: campaign.id },
              data: { status: 'completed' }
            })
          }
        } else {
          // No clients to send to
          await prisma.campaign.update({
            where: { id: campaign.id },
            data: { status: 'completed' }
          })
          
          results.push({
            campaignId: campaign.id,
            campaignName: campaign.name,
            targetClients: 0,
            sent: 0,
            failed: 0,
            success: true,
            message: 'No clients matched targeting criteria'
          })
        }
      } catch (error) {
        console.error(`Failed to run campaign ${campaign.id}:`, error)
        results.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          success: false,
          error: error.message
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      campaignsProcessed: scheduledCampaigns.length,
      results
    })
  } catch (error) {
    console.error('Failed to run scheduled campaigns:', error)
    return NextResponse.json(
      { 
        error: 'Failed to run scheduled campaigns',
        details: error.message
      },
      { status: 500 }
    )
  }
}

// POST endpoint for manual trigger
export async function POST(request) {
  return GET(request)
}