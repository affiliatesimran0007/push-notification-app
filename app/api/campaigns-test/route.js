import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/campaigns-test - Test campaigns endpoint without complex queries
export async function GET(request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  try {
    // Get URL params
    const { searchParams } = new URL(request.url)
    const debug = {
      url: request.url,
      searchParams: Object.fromEntries(searchParams),
      timestamp: new Date().toISOString()
    }
    
    // Try simplest query first
    let campaigns = []
    try {
      campaigns = await prisma.campaign.findMany({
        take: 10
      })
      debug.simpleQuerySuccess = true
      debug.campaignCount = campaigns.length
    } catch (simpleError) {
      debug.simpleQuerySuccess = false
      debug.simpleQueryError = simpleError.message
      throw simpleError
    }
    
    // Try with user include
    try {
      const campaignsWithUser = await prisma.campaign.findMany({
        take: 10,
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      })
      debug.withUserSuccess = true
      campaigns = campaignsWithUser
    } catch (userError) {
      debug.withUserSuccess = false
      debug.withUserError = userError.message
      // Continue with simple campaigns
    }
    
    // Format response
    const response = {
      success: true,
      debug,
      campaigns: campaigns.map(campaign => ({
        ...campaign,
        ctr: campaign.clickedCount > 0 && campaign.sentCount > 0
          ? ((campaign.clickedCount / campaign.sentCount) * 100).toFixed(1)
          : 0
      })),
      pagination: {
        page: 1,
        limit: 10,
        total: campaigns.length,
        totalPages: 1
      }
    }
    
    return NextResponse.json(response, { headers })
  } catch (error) {
    console.error('Campaigns test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500, headers })
  }
}

// OPTIONS handler
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}