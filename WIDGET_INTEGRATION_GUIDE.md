# Push Widget Integration Guide

## Overview
This guide explains how to properly integrate the push notification widget on customer websites to avoid redirect loops and ensure proper subscription tracking.

## The Redirect Loop Problem
The redirect loop occurs when:
1. User visits the customer site (e.g., alerts-intuit.com)
2. Widget checks localStorage on customer domain - finds no subscription
3. Widget redirects to bot-check page on your domain
4. User subscribes successfully
5. Bot-check redirects back to customer site
6. Widget runs again, can't see the subscription (cross-domain localStorage), redirects again
7. Loop continues...

## Solution Implementation

### 1. Widget Updates (push-widget.js)
The updated widget now:
- Checks URL parameters for returning subscriptions
- Checks existing service worker subscriptions
- Properly stores subscription status in localStorage
- Cleans up URL parameters after processing

### 2. Bot-Check Page Updates
The bot-check page now:
- Appends subscription status parameters when redirecting back
- Includes the landing ID to verify correct subscription

### 3. Required Files on Customer Domain

#### push-widget.js
```html
<!-- Add to customer's website -->
<script src="https://your-domain.com/js/push-widget.js"></script>
<script>
  PushWidget.init({
    appUrl: 'https://your-domain.com',
    landingId: 'YOUR_LANDING_ID',
    vapidKey: 'YOUR_VAPID_PUBLIC_KEY',
    botCheck: true,
    redirects: {
      allow: 'https://customer-site.com/thank-you',
      block: 'https://customer-site.com'
    }
  });
</script>
```

#### push-sw.js
The customer must host the service worker file (`push-sw.js`) at the root of their domain:
```
https://customer-site.com/push-sw.js
```

## Testing the Integration

1. **Clear all data** before testing:
   - Clear localStorage
   - Unregister service workers
   - Reset notification permissions

2. **First Visit Flow**:
   - Visit customer site
   - Should redirect to bot-check
   - Complete bot-check
   - Should redirect back with parameters
   - Widget detects parameters and marks as subscribed
   - URL is cleaned

3. **Return Visit Flow**:
   - Visit customer site again
   - Widget checks localStorage - finds subscription
   - No redirect occurs

4. **Debug Mode**:
   Add `?debug=true` to see console logs:
   ```javascript
   // In push-widget.js
   if (window.location.search.includes('debug=true')) {
     console.log('Push Widget: Checking subscription status...');
     console.log('localStorage key:', subscriptionKey);
     console.log('localStorage value:', localStorage.getItem(subscriptionKey));
   }
   ```

## Common Issues and Fixes

### Issue: Still getting redirect loops
**Fix**: Ensure the bot-check page includes subscription parameters in redirect URL

### Issue: Service worker not registering
**Fix**: Ensure push-sw.js is at the root domain and accessible

### Issue: Cross-domain localStorage
**Fix**: Use URL parameters for cross-domain communication

### Issue: Browser blocks popups/redirects
**Fix**: Ensure redirects happen immediately on page load, not after delay

## Security Considerations

1. **Validate Landing IDs**: Always validate that the landing ID in parameters matches expected values
2. **HTTPS Required**: Push notifications only work on HTTPS sites
3. **Domain Validation**: Validate that subscriptions come from expected domains

## Analytics Tracking

The widget now properly tracks:
- Initial page visits
- Bot-check completions
- Subscription successes
- Blocked notifications
- Return visits

## Browser Compatibility

Tested and working on:
- Chrome 90+
- Firefox 85+
- Safari 14+ (with limitations)
- Edge 90+

## Support

For issues or questions:
1. Check browser console for errors
2. Verify all files are properly hosted
3. Test in incognito mode to rule out caching issues
4. Contact support with landing ID and domain information