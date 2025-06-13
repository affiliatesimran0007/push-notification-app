import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
  try {
    // Force Prisma to recognize the schema by doing a simple query
    const campaign = await prisma.campaign.findFirst({
      select: {
        id: true,
        dismissedCount: true,
        pendingCount: true
      }
    })
    
    // Run a raw query to ensure columns exist with defaults
    await prisma.$executeRawUnsafe(`
      UPDATE "Campaign" 
      SET "dismissedCount" = COALESCE("dismissedCount", 0),
          "pendingCount" = COALESCE("pendingCount", 0)
      WHERE "dismissedCount" IS NULL OR "pendingCount" IS NULL
    `)
    
    return NextResponse.json({
      success: true,
      message: 'Schema synced successfully',
      sampleCampaign: campaign
    })
  } catch (error) {
    console.error('Schema sync error:', error)
    
    // If the error is about missing columns, provide instructions
    if (error.message.includes('column') && error.message.includes('does not exist')) {
      return NextResponse.json({
        error: 'Missing columns detected',
        message: 'Please run the following SQL commands in your database:',
        sql: [
          'ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "dismissedCount" INTEGER DEFAULT 0;',
          'ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "pendingCount" INTEGER DEFAULT 0;'
        ]
      }, { status: 500 })
    }
    
    return NextResponse.json({
      error: error.message,
      details: error.toString()
    }, { status: 500 })
  }
}