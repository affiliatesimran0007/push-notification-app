import prisma from '../lib/db.js';

async function addDismissedCount() {
  try {
    console.log('Adding dismissedCount column to Campaign table...');
    
    // Run the SQL directly
    await prisma.$executeRaw`ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "dismissedCount" INTEGER NOT NULL DEFAULT 0`;
    
    console.log('✅ Successfully added dismissedCount column');
    
    // Verify the column was added
    const testCampaign = await prisma.campaign.findFirst({
      select: {
        id: true,
        name: true,
        dismissedCount: true
      }
    });
    
    console.log('✅ Verified column exists:', testCampaign);
    
  } catch (error) {
    console.error('❌ Error adding dismissedCount column:', error);
    
    // If column already exists, that's fine
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Column already exists, skipping...');
    } else {
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
addDismissedCount().catch(console.error);