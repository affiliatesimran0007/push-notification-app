import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/migrate-dismissed-count - Run migration to add dismissedCount column
export async function GET(request) {
  try {
    console.log('Running migration to add dismissedCount column...');
    
    // First, check if the column already exists by trying to query it
    try {
      const testQuery = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'Campaign' 
        AND column_name = 'dismissedCount'
      `;
      
      if (testQuery.length > 0) {
        return NextResponse.json({ 
          success: true, 
          message: 'Column dismissedCount already exists' 
        });
      }
    } catch (err) {
      console.log('Column check error (expected):', err.message);
    }
    
    // Add the column if it doesn't exist
    await prisma.$executeRaw`ALTER TABLE "Campaign" ADD COLUMN "dismissedCount" INTEGER NOT NULL DEFAULT 0`;
    
    console.log('✅ Successfully added dismissedCount column');
    
    // Verify the column was added
    const campaigns = await prisma.campaign.findMany({
      take: 1,
      select: {
        id: true,
        name: true,
        dismissedCount: true
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Successfully added dismissedCount column',
      verification: campaigns[0] || 'No campaigns to verify with'
    });
    
  } catch (error) {
    console.error('Migration error:', error);
    
    // If column already exists, that's fine
    if (error.message.includes('already exists')) {
      return NextResponse.json({ 
        success: true, 
        message: 'Column already exists' 
      });
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to run migration', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}