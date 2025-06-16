#!/usr/bin/env node

/**
 * Script to seed the production database
 * Usage: node scripts/seed-production.js
 */

const PRODUCTION_URL = 'https://push-notification-app-steel.vercel.app';
const SECRET = process.env.SEED_SECRET || 'push-notification-seed-2024';

async function seedProduction() {
  console.log('🌱 Seeding production database...');
  console.log(`URL: ${PRODUCTION_URL}/api/seed-database`);
  
  try {
    const response = await fetch(`${PRODUCTION_URL}/api/seed-database?secret=${SECRET}`);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Failed to seed database:', data.error);
      process.exit(1);
    }
    
    console.log('✅ Database seeded successfully!');
    console.log('Results:', JSON.stringify(data.results, null, 2));
    
    if (data.results.adminUser === 'created') {
      console.log('\n📝 Admin user created:');
      console.log('   Email: admin@example.com');
      console.log('   Password: admin123');
    }
    
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
}

// Run the seeding
seedProduction();