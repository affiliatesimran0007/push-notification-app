# Production Integration for alerts-intuit.com

## Complete Integration Code

Add this to your website's `<head>` section:

```html
<script>
(function() {
  // Push notification configuration for alerts-intuit.com
  const PUSH_CONFIG = {
    appUrl: 'https://push-notification-app-steel.vercel.app',
    landingId: 'tester', // Your landing page ID
    vapidKey: 'BNV70f-uHInqVEOT9r2d6pVfK5WViCXdtoYjB87Nf8WUQZ6mDMSXEXGFQmJXl6bvGpvzL2jVSuPZUk-S9YS8rYc'
  };

  // Check if already subscribed
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return; // Already handled
  }

  // Check if already went through bot check this session
  const botCheckDone = sessionStorage.getItem('alerts_intuit_bot_check');
  if (!botCheckDone) {
    // First time visitor - redirect to bot check
    const currentUrl = window.location.href;
    const params = new URLSearchParams({
      landingId: PUSH_CONFIG.landingId,
      url: currentUrl, // This will be stored as "Subscribed URL"
      redirect: currentUrl,
      allowRedirect: 'https://alerts-intuit.com/thank-you', // Change to your thank-you page
      blockRedirect: 'https://alerts-intuit.com/notifications-info' // Change to your info page
    });
    
    sessionStorage.setItem('alerts_intuit_bot_check', 'true');
    window.location.href = `${PUSH_CONFIG.appUrl}/landing/bot-check?${params}`;
  }
})();
</script>
```

## What This Does

1. **First Visit**: Automatically redirects to bot verification page
2. **Bot Check**: Shows Cloudflare-style verification (1.5 seconds)
3. **Permission Prompt**: Browser asks for notification permission
4. **After Allow**: Redirects to your thank-you page
5. **After Block**: Redirects to your notifications-info page

## Data Collected

When a user subscribes, the following is stored:

- **Subscribed URL**: The exact page they were on (e.g., https://alerts-intuit.com/products/item-123)
- **Browser**: Chrome, Firefox, Safari, etc.
- **Browser Version**: e.g., v135
- **Location**: Country, city, IP address
- **Device**: Desktop/Mobile/Tablet
- **OS**: Windows, macOS, iOS, Android
- **Language**: Browser language preference
- **Timezone**: User's timezone
- **Screen Resolution**: Display size
- **Platform**: Operating system platform

## Customization Options

### 1. Delay Before Redirect
Add a delay so users see your content first:

```javascript
setTimeout(() => {
  // Redirect code here
}, 3000); // 3 second delay
```

### 2. Conditional Triggering
Only trigger for specific pages:

```javascript
if (window.location.pathname === '/special-offer') {
  // Trigger bot check
}
```

### 3. Custom Landing Pages
Create different landing pages for different sections:

- Main site: `landingId: 'main'`
- Blog: `landingId: 'blog'`
- Shop: `landingId: 'shop'`

## Testing

1. Use incognito/private browsing to test the full flow
2. Check the Clients page to see subscriber details
3. Verify the "Subscribed URL" shows correctly

## Important Notes

- The bot check only appears once per session
- Users who block can re-enable in browser settings
- All subscriber data is available in your dashboard
- You can segment users by subscribed URL for targeted campaigns