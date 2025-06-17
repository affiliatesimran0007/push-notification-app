import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      VERCEL_REGION: process.env.VERCEL_REGION,
    },
    database: {
      url_exists: !!process.env.DATABASE_URL,
      url_prefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'NOT SET',
    },
    tests: {}
  }

  // Test 1: Simple database query
  try {
    const start = Date.now()
    const count = await prisma.campaign.count()
    diagnostics.tests.campaign_count = {
      success: true,
      count,
      duration_ms: Date.now() - start
    }
  } catch (error) {
    diagnostics.tests.campaign_count = {
      success: false,
      error: error.message,
      name: error.name,
      code: error.code
    }
  }

  // Test 2: Complex query with relations
  try {
    const start = Date.now()
    const campaigns = await prisma.campaign.findMany({
      take: 1,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })
    diagnostics.tests.complex_query = {
      success: true,
      found: campaigns.length,
      duration_ms: Date.now() - start
    }
  } catch (error) {
    diagnostics.tests.complex_query = {
      success: false,
      error: error.message,
      name: error.name,
      code: error.code
    }
  }

  // Test 3: Landing pages query
  try {
    const start = Date.now()
    const landingCount = await prisma.landingPage.count()
    diagnostics.tests.landing_pages = {
      success: true,
      count: landingCount,
      duration_ms: Date.now() - start
    }
  } catch (error) {
    diagnostics.tests.landing_pages = {
      success: false,
      error: error.message,
      name: error.name,
      code: error.code
    }
  }

  // Test 4: Check for specific date/time issues
  try {
    const campaign = await prisma.campaign.findFirst({
      where: {
        sentAt: { not: null }
      }
    })
    if (campaign) {
      diagnostics.tests.date_handling = {
        success: true,
        sample_date: campaign.sentAt,
        iso_string: campaign.sentAt?.toISOString(),
        type: typeof campaign.sentAt
      }
    }
  } catch (error) {
    diagnostics.tests.date_handling = {
      success: false,
      error: error.message
    }
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
  }

  return NextResponse.json(diagnostics, { headers })
}