import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/debug-error - Debug endpoint to check what's failing
export async function GET() {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  const debug = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
    },
    database: {
      urlSet: !!process.env.DATABASE_URL,
      urlLength: process.env.DATABASE_URL?.length || 0,
      urlPreview: process.env.DATABASE_URL ? 
        process.env.DATABASE_URL.substring(0, 30) + '...' : 
        'NOT SET'
    },
    vapid: {
      publicKeySet: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      privateKeySet: !!process.env.VAPID_PRIVATE_KEY,
      subjectSet: !!process.env.VAPID_SUBJECT
    }
  }

  try {
    // Test 1: Basic Prisma connection
    debug.tests = {}
    
    try {
      const startConnect = Date.now()
      await prisma.$connect()
      debug.tests.connection = {
        success: true,
        time: `${Date.now() - startConnect}ms`
      }
    } catch (error) {
      debug.tests.connection = {
        success: false,
        error: error.message,
        code: error.code
      }
    }

    // Test 2: Simple query
    try {
      const startQuery = Date.now()
      const count = await prisma.campaign.count()
      debug.tests.query = {
        success: true,
        campaignCount: count,
        time: `${Date.now() - startQuery}ms`
      }
    } catch (error) {
      debug.tests.query = {
        success: false,
        error: error.message,
        code: error.code,
        meta: error.meta
      }
    }

    // Test 3: Landing pages query (what campaign builder uses)
    try {
      const startLanding = Date.now()
      const landingPages = await prisma.landingPage.count()
      debug.tests.landingPages = {
        success: true,
        count: landingPages,
        time: `${Date.now() - startLanding}ms`
      }
    } catch (error) {
      debug.tests.landingPages = {
        success: false,
        error: error.message,
        code: error.code
      }
    }

    return NextResponse.json({
      success: true,
      debug
    }, { headers })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      debug
    }, { status: 500, headers })
  }
}