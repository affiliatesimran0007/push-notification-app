import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
  try {
    // Try a simple query without any includes or complex logic
    const campaigns = await prisma.campaign.findMany({
      take: 1
    })
    
    return NextResponse.json({
      success: true,
      count: campaigns.length,
      firstCampaign: campaigns[0] || null
    })
  } catch (error) {
    console.error('Test campaigns error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      stack: error.stack
    }, { status: 500 })
  }
}