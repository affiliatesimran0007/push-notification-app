const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();

// Create .env.local file content
const envContent = `# Push Notification Configuration
NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}
VAPID_PRIVATE_KEY=${vapidKeys.privateKey}
VAPID_SUBJECT=mailto:admin@example.com

# Database Configuration (when implemented)
DATABASE_URL=postgresql://user:password@localhost:5432/push_notifications

# Authentication (when implemented)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=${generateRandomString(32)}

# Analytics
NEXT_PUBLIC_GA_TRACKING_ID=your_google_analytics_id

# API Keys (when implemented)
API_SECRET_KEY=${generateRandomString(32)}
`;

// Function to generate random string
function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Write to .env.local file
const envPath = path.join(__dirname, '..', '.env.local');

// Check if .env.local already exists
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env.local already exists. Creating .env.local.new instead...');
  fs.writeFileSync(envPath + '.new', envContent);
  console.log('✅ Created .env.local.new with new VAPID keys');
  console.log('📋 Please manually update your .env.local file with the new keys if needed.');
} else {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env.local with VAPID keys');
}

console.log('\n🔑 VAPID Keys Generated:');
console.log('Public Key:', vapidKeys.publicKey);
console.log('Private Key:', vapidKeys.privateKey);
console.log('\n📧 Remember to update the VAPID_SUBJECT email address in .env.local');