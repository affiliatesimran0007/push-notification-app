// Test database connection
const { Client } = require('pg');

async function testConnection() {
  // Use the DATABASE_URL you'll put in Vercel
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:your_password@185.161.209.188:5432/push_notifications';
  
  const client = new Client({
    connectionString,
    ssl: false // Set to true if your PostgreSQL requires SSL
  });

  try {
    console.log('🔄 Attempting to connect to PostgreSQL...');
    await client.connect();
    console.log('✅ Successfully connected to PostgreSQL!');
    
    // Test query
    const result = await client.query('SELECT NOW()');
    console.log('📅 Current database time:', result.rows[0].now);
    
    await client.end();
  } catch (error) {
    console.error('❌ Failed to connect to PostgreSQL:', error.message);
    console.error('Make sure:');
    console.error('1. PostgreSQL is running on 185.161.209.188');
    console.error('2. Port 5432 is open in firewall');
    console.error('3. PostgreSQL accepts external connections');
    console.error('4. Username and password are correct');
  }
}

testConnection();