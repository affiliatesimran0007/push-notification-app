import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixCampaignColumns() {
  console.log('Fixing campaign columns...')
  
  try {
    // Check if columns exist
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Campaign' 
      AND column_name IN ('dismissedCount', 'pendingCount')
    `
    
    console.log('Existing columns:', result)
    
    // Add missing columns
    try {
      await prisma.$executeRaw`
        ALTER TABLE "Campaign" 
        ADD COLUMN IF NOT EXISTS "dismissedCount" INTEGER NOT NULL DEFAULT 0
      `
      console.log('Added dismissedCount column')
    } catch (error) {
      console.log('dismissedCount column already exists or error:', error.message)
    }
    
    try {
      await prisma.$executeRaw`
        ALTER TABLE "Campaign" 
        ADD COLUMN IF NOT EXISTS "pendingCount" INTEGER NOT NULL DEFAULT 0
      `
      console.log('Added pendingCount column')
    } catch (error) {
      console.log('pendingCount column already exists or error:', error.message)
    }
    
    // Verify columns were added
    const verification = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Campaign' 
      AND column_name IN ('dismissedCount', 'pendingCount')
    `
    
    console.log('Columns after fix:', verification)
    console.log('✅ Campaign columns fixed successfully')
    
  } catch (error) {
    console.error('Error fixing columns:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixCampaignColumns()