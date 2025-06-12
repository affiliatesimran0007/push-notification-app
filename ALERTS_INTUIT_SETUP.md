# Alerts-Intuit.com Push Notification Setup

## Quick Test

1. **Test Page**: Visit https://push-notification-app-steel.vercel.app/test-alerts-intuit-simple.html
2. Click "Test Push Notifications" to see how it works

## Step-by-Step Setup

### 1. Create Landing Page

1. Go to: https://push-notification-app-steel.vercel.app/landing
2. Click "Create Landing Page"
3. Fill in:
   - **Name**: Alerts Intuit Main
   - **URL**: https://alerts-intuit.com
   - **Bot Protection**: ON
   - **Allow Redirect**: https://alerts-intuit.com/thank-you
   - **Block Redirect**: https://alerts-intuit.com/notifications-info
4. Save and note the Landing ID (e.g., "1" or "2")

### 2. Integration Code for alerts-intuit.com

Add this to your website's `<head>` section:

```html
<!-- Push Notifications for alerts-intuit.com -->
<script>
(function() {
  const PUSH_CONFIG = {
    appUrl: 'https://push-notification-app-steel.vercel.app',
    landingId: '1', // Replace with your actual landing ID
    vapidKey: 'BNV70f-uHInqVEOT9r2d6pVfK5WViCXdtoYjB87Nf8WUQZ6mDMSXEXGFQmJXl6bvGpvzL2jVSuPZUk-S9YS8rYc',
    redirects: {
      onAllow: 'https://alerts-intuit.com/thank-you',
      onBlock: 'https://alerts-intuit.com/notifications-info'
    }
  };

  const script = document.createElement('script');
  script.src = PUSH_CONFIG.appUrl + '/simple-integration.js';
  script.async = true;
  document.head.appendChild(script);
})();
</script>
```

### 3. Create These Pages on alerts-intuit.com

1. **Thank You Page** (`/thank-you`)
   - Shows after users allow notifications
   - Message: "Thank you for subscribing to alerts!"

2. **Info Page** (`/notifications-info`)
   - Shows after users block notifications
   - Explains benefits of notifications

### 4. Test the Flow

1. Visit alerts-intuit.com
2. You'll be redirected to bot verification
3. After verification, browser asks for notification permission
4. Allow → Redirected to thank-you page
5. Block → Redirected to info page

## How It Works

1. **User visits alerts-intuit.com**
2. **Script detects new visitor**
3. **Redirects to bot check**: `https://push-notification-app-steel.vercel.app/landing/bot-check`
4. **Shows verification screen** (1.5 seconds)
5. **Browser permission prompt** appears
6. **User decides**:
   - Allow: Subscribed + redirect to thank-you
   - Block: Not subscribed + redirect to info page

## View Subscribers

1. Go to: https://push-notification-app-steel.vercel.app/clients
2. See all subscribers from alerts-intuit.com
3. View their:
   - Location
   - Browser
   - Device
   - Subscription time

## Send Notifications

1. Go to: https://push-notification-app-steel.vercel.app/notifications/campaign-builder
2. Create campaign
3. Target subscribers from alerts-intuit.com
4. Send!

## Alternative: Super Simple Integration

Just add this one line to alerts-intuit.com:

```html
<script src="https://push-notification-app-steel.vercel.app/simple-integration.js"></script>
```

But you'll need to edit the script to set your landing ID.

## Troubleshooting

- **Bot check not appearing?** Clear cookies/cache
- **Permission not showing?** Check if notifications are blocked in browser
- **Not redirecting?** Verify redirect URLs are correct in landing page settings

## Support

- Dashboard: https://push-notification-app-steel.vercel.app/dashboard
- Landing Pages: https://push-notification-app-steel.vercel.app/landing
- Clients: https://push-notification-app-steel.vercel.app/clients