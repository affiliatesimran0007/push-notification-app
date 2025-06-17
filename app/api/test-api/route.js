import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
  try {
    // Test 1: Basic response
    const basicTest = { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV
    }

    // Test 2: Database connection
    let dbTest = { connected: false, error: null }
    try {
      const count = await prisma.campaign.count()
      dbTest = { connected: true, campaignCount: count }
    } catch (error) {
      dbTest = { connected: false, error: error.message }
    }

    // Test 3: Test landing pages
    let landingTest = { count: 0, error: null }
    try {
      const landingPages = await prisma.landingPage.count()
      landingTest = { count: landingPages }
    } catch (error) {
      landingTest = { count: 0, error: error.message }
    }

    // Test 4: Check for admin user
    let adminTest = { hasAdmin: false, error: null }
    try {
      const admin = await prisma.user.findFirst({
        where: { role: 'admin' }
      })
      adminTest = { hasAdmin: !!admin, adminEmail: admin?.email }
    } catch (error) {
      adminTest = { hasAdmin: false, error: error.message }
    }

    return NextResponse.json({
      basicTest,
      dbTest,
      landingTest,
      adminTest,
      headers: {
        host: process.env.VERCEL_URL || 'localhost',
        region: process.env.VERCEL_REGION || 'local'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Test failed', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}