# Push Notification Setup Guide

## Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Generate VAPID keys:
```bash
npm run generate-vapid-keys
```

This will create a `.env.local` file with your VAPID keys. If the file already exists, it will create `.env.local.new`.

## Environment Variables

Make sure your `.env.local` file contains:

```env
# Required for push notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_SUBJECT=mailto:your-email@example.com
```

## Testing Push Notifications

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Enable Push Notifications
1. Go to the Dashboard (`http://localhost:3000/dashboard`)
2. Click "Enable Push Notifications" in the Push Notification Status card
3. Allow notifications when prompted by your browser

### 3. Send a Test Notification
1. Go to Clients page (`http://localhost:3000/clients`)
2. Click the actions menu (⋮) next to any client
3. Select "Send Notification"
4. Click "Send Test Notification"

## How It Works

### Client-Side Flow
1. User clicks "Enable Push Notifications"
2. Service worker is registered (`/public/sw.js`)
3. Browser asks for notification permission
4. If granted, browser subscribes to push service with VAPID public key
5. Subscription is sent to server (`/api/clients`)

### Server-Side Flow
1. Server receives subscription with endpoint and keys
2. When sending notification:
   - Server uses web-push library with VAPID private key
   - Creates notification payload
   - Sends to browser's push service endpoint
3. Browser receives and displays notification

### Service Worker
The service worker (`/public/sw.js`) handles:
- Push events - displays notifications
- Click events - opens URLs
- Close events - tracks analytics

## Troubleshooting

### "VAPID key not found" Error
- Run `npm run generate-vapid-keys`
- Restart the development server
- Check that `.env.local` exists and contains the keys

### Notifications Not Showing
1. Check browser console for errors
2. Ensure HTTPS is used (localhost is exception)
3. Check notification permissions in browser settings
4. Try in different browser (Chrome/Firefox/Edge)

### "Invalid VAPID key" Error
- Keys must be in base64url format
- Public key should be 65 bytes (87 chars in base64url)
- Private key should be 32 bytes (43 chars in base64url)

## Production Considerations

1. **HTTPS Required**: Push notifications only work over HTTPS (except localhost)

2. **Database Storage**: Replace mock storage with real database for:
   - Client subscriptions
   - Campaign data
   - Analytics events

3. **Error Handling**: Implement proper handling for:
   - Expired subscriptions (410 status)
   - Invalid subscriptions
   - Network failures

4. **Security**:
   - Protect VAPID private key
   - Implement authentication
   - Rate limit notification sending
   - Validate subscription endpoints

5. **Performance**:
   - Batch notifications for large campaigns
   - Use queues for async processing
   - Implement retry logic
   - Clean up expired subscriptions

## Browser Support

Push notifications are supported in:
- ✅ Chrome/Chromium (Desktop & Android)
- ✅ Firefox (Desktop & Android)
- ✅ Edge (Desktop)
- ✅ Safari (macOS 10.14+, iOS 16.4+)
- ❌ Safari (iOS < 16.4)
- ❌ Any browser on iOS < 16.4

## Next Steps

1. **Database Integration**: Set up PostgreSQL/MongoDB for persistence
2. **Authentication**: Add NextAuth.js for secure access
3. **Queue System**: Implement Redis/BullMQ for large campaigns
4. **Analytics**: Track delivery rates and engagement
5. **A/B Testing**: Implement actual variant delivery