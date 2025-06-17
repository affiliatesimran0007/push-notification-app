import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/test-db - Test database connection
export async function GET() {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  try {
    // Test basic database connection
    const startTime = Date.now()
    const count = await prisma.campaign.count()
    const queryTime = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      campaignCount: count,
      queryTime: `${queryTime}ms`,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set'
    }, { headers })
  } catch (error) {
    console.error('Database connection test failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      message: error.message,
      code: error.code,
      environment: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500, headers })
  }
}

// OPTIONS handler for CORS
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