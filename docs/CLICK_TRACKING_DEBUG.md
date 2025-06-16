# Click Tracking Debug Guide

## Why Click Tracking Might Not Work

### 1. Service Worker Not Updated
The most common issue is that the customer's service worker (`push-sw.js`) is outdated.

**Solution:**
- Customers need to download the latest `push-sw-template.js` 
- Replace their existing `push-sw.js` with the new version
- Clear browser cache and reload

### 2. Check Service Worker Version
Open browser console and check:
```javascript
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => console.log('SW URL:', reg.active?.scriptURL))
})
```

### 3. Verify Tracking URL in Payload
When a notification is received, the service worker should log:
```
[Service Worker] Push data: {
  ...
  trackingUrl: "https://push-notification-app-steel.vercel.app/api/analytics/track"
  ...
}
```

### 4. Check for CORS Errors
Look for errors like:
- "Access to fetch at ... from origin ... has been blocked by CORS policy"
- Solution: We've added CORS headers to the analytics API

### 5. Network Tab
When clicking a notification, check Network tab for:
- Request to `/api/analytics/track`
- Response status (should be 200)
- Request payload should contain:
  - event: "notification_clicked" or "click"
  - campaignId
  - clientId

## Testing Click Tracking

1. Go to `/test-tracking` in the app
2. Select a client and send test notification
3. Open browser console (F12)
4. Click the notification
5. Check for:
   - Console logs from service worker
   - Network request to analytics API
   - Campaign stats updating in real-time

## Common Error Messages

### "Failed to send notification"
- Check if icon/badge URLs are valid
- Verify VAPID keys are correct
- Check if client subscription is still valid

### "7 Errors" in campaign
This usually means ALL notifications failed. Common causes:
- Invalid icon URL (must be HTTPS)
- Payload too large
- Invalid VAPID configuration
- Expired subscriptions

## Service Worker Update Process

1. Customer visits their website
2. Browser checks for service worker updates
3. If new version found, it installs in background
4. On next page load or after 24 hours, new SW activates
5. Force update: Clear browser data for the site

## Debugging Steps

1. **Check Vercel Logs**
   - Look for "ANALYTICS TRACKING REQUEST"
   - Check for campaign update errors

2. **Browser Console**
   - Look for "[Service Worker]" logs
   - Check for fetch errors

3. **Campaign Dashboard**
   - Refresh to see if stats update
   - Check SSE connection status

4. **Test with Different Client**
   - Some clients might have old service workers
   - Try with a fresh subscription