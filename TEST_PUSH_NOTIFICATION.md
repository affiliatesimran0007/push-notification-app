# Test Push Notification

## Send a Test Notification

Now that you have subscribers, let's test sending a push notification:

### Method 1: Quick Test from Dashboard

1. Go to: https://push-notification-app-steel.vercel.app/dashboard
2. You should see a "Send Test Notification" button (if implemented)

### Method 2: Using Campaign Builder

1. Go to: https://push-notification-app-steel.vercel.app/notifications/campaign-builder
2. Create a test campaign:
   - **Campaign Name**: Test Push
   - **Title**: Hello from Push Notifications! 
   - **Body**: This is a test notification 🔔
   - **Icon**: Leave default or add an image URL
   - **URL**: https://yahoo.com (or any URL)
   - **Target**: All Subscribers
3. Click "Send Campaign"

### Method 3: Direct API Test

Use this curl command (replace the endpoint with your actual endpoint from the Clients page):

```bash
curl -X POST https://push-notification-app-steel.vercel.app/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Notification",
    "body": "Hello! This is a test push notification 🎉",
    "icon": "https://push-notification-app-steel.vercel.app/icon-192x192.png",
    "url": "https://yahoo.com",
    "badge": "https://push-notification-app-steel.vercel.app/badge-72x72.png",
    "targetType": "all"
  }'
```

### Method 4: Test Specific Subscriber

1. Go to: https://push-notification-app-steel.vercel.app/clients
2. Find your subscription
3. Copy the endpoint
4. Send a targeted notification

## What Should Happen

When you send a notification:
1. You should receive it within seconds
2. Clicking it should open the URL you specified
3. The notification should show the title, body, and icon

## Troubleshooting

If you don't receive the notification:
1. Make sure the browser tab is closed or in background
2. Check if notifications are enabled in your OS settings
3. Try a different browser
4. Check the browser console for errors

## Your Current Subscribers

You have 2 active subscribers:
1. Chrome on macOS (from dashboard)
2. Unknown browser (from test page) - likely also Chrome

Both should receive notifications when you send to "All Subscribers".