const webpush = require('web-push');

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();

console.log('New VAPID Keys Generated:');
console.log('========================');
console.log('\nAdd these to your .env.local and Vercel environment variables:');
console.log('\nNEXT_PUBLIC_VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('VAPID_SUBJECT=mailto:admin@push-notification-app.com');
console.log('\n========================');
console.log('\nPublic Key (for frontend):', vapidKeys.publicKey);
console.log('Private Key (for backend):', vapidKeys.privateKey);
console.log('\nIMPORTANT: These keys MUST be used together as a pair!');