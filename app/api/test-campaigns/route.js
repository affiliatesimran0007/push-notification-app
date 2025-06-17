import { NextResponse } from 'next/server'

// GET /api/test-campaigns - Simple test endpoint
export async function GET() {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  try {
    // Import dynamically to catch any import errors
    const { default: prisma } = await import('@/lib/db')
    
    // Test basic response
    const testResponse = {
      success: true,
      timestamp: new Date().toISOString(),
      prismaImported: !!prisma,
      env: process.env.NODE_ENV
    }
    
    // Try a simple query
    try {
      const count = await prisma.campaign.count()
      testResponse.campaignCount = count
      testResponse.querySuccess = true
    } catch (queryError) {
      testResponse.querySuccess = false
      testResponse.queryError = queryError.message
    }
    
    return NextResponse.json(testResponse, { headers })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
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