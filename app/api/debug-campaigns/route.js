import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
  try {
    // First, check if we can connect to the database
    const databaseCheck = await prisma.$queryRaw`SELECT 1`
    
    // Check what columns exist in the Campaign table
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'Campaign'
      ORDER BY ordinal_position
    `
    
    // Try to fetch one campaign with minimal fields
    let sampleCampaign = null
    let campaignError = null
    try {
      sampleCampaign = await prisma.campaign.findFirst({
        select: {
          id: true,
          name: true,
          status: true
        }
      })
    } catch (err) {
      campaignError = err.message
    }
    
    // Try raw query to get campaign
    let rawCampaign = null
    let rawError = null
    try {
      const raw = await prisma.$queryRaw`
        SELECT id, name, status, 
               COALESCE("dismissedCount", 0) as "dismissedCount",
               COALESCE("pendingCount", 0) as "pendingCount"
        FROM "Campaign" 
        LIMIT 1
      `
      rawCampaign = raw[0] || null
    } catch (err) {
      rawError = err.message
    }
    
    return NextResponse.json({
      success: true,
      databaseConnected: true,
      columnCount: columns.length,
      columns: columns.map(c => ({
        name: c.column_name,
        type: c.data_type,
        nullable: c.is_nullable,
        default: c.column_default
      })),
      sampleCampaign,
      campaignError,
      rawCampaign,
      rawError,
      prismaVersion: prisma._clientVersion
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      type: error.constructor.name
    }, { status: 500 })
  }
}