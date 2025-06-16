# Click Tracking Debug Guide

## Overview
This guide helps debug click tracking issues with push notifications.

## Architecture

1. **Notification Payload**: Created by `webPushService.createNotificationPayload()`
   - Includes `trackingUrl` at root level and in `data` object
   - Format: `https://your-app-domain.com/api/analytics/track`

2. **Service Worker**: Handles notification clicks
   - Version 2.3.0 (`push-sw.js`) - Customer's service worker
   - Version 1.2.0 (`push-sw-template.js`) - Template for new installations

3. **Analytics API**: `/api/analytics/track`
   - Accepts POST requests with event data
   - Supports CORS for cross-origin requests
   - Updates campaign metrics in real-time

## Testing Click Tracking

### Method 1: Use the Test Page
1. Navigate to `/test-tracking`
2. Select a client from the dropdown
3. Click "Send Test Notification with Tracking"
4. Click the notification when it appears
5. Check the tracking events section

### Method 2: Manual Testing
1. Open browser Developer Tools (F12)
2. Subscribe to notifications on a test page
3. Send a campaign to that client
4. Monitor console logs in:
   - Main browser tab
   - Service Worker logs (Application → Service Workers → push-sw.js → Logs)
5. Check Network tab for requests to tracking URL

## Common Issues and Solutions

### Issue 1: No tracking request sent
**Symptoms**: No network request to `/api/analytics/track`

**Check**:
1. Service Worker version in console logs
2. Notification payload includes `trackingUrl`
3. `campaignId` and `clientId` are present

**Solution**:
- Update service worker to version 2.3.0 or later
- Ensure notification payload includes all required fields

### Issue 2: CORS errors
**Symptoms**: "CORS policy" error in console

**Solution**:
- Analytics API now includes proper CORS headers
- Ensure you're using the latest API version

### Issue 3: Service Worker not updating
**Symptoms**: Old service worker version in logs

**Solution**:
1. Clear browser cache and service workers
2. In Chrome: DevTools → Application → Storage → Clear site data
3. Re-register service worker

### Issue 4: Tracking URL incorrect
**Symptoms**: 404 errors or requests to wrong domain

**Check**:
- `NEXT_PUBLIC_APP_URL` environment variable
- Service worker is using `trackingUrl` from payload, not hardcoded

## Debug Checklist

- [ ] Service Worker version is 2.3.0 or later
- [ ] Console shows "Sending click tracking to: [URL]"
- [ ] Network tab shows POST to `/api/analytics/track`
- [ ] Response status is 200
- [ ] Campaign click count increases in dashboard

## Console Log Examples

### Successful Click Tracking:
```
[Service Worker] Notification clicked
[Service Worker] Click data: {
  campaignId: "camp_123",
  clientId: "client_456",
  trackingUrl: "https://app.com/api/analytics/track",
  action: "default",
  url: "https://example.com"
}
[Service Worker] Sending click tracking to: https://app.com/api/analytics/track
[Service Worker] Click tracking response: 200
```

### Failed Click Tracking:
```
[Service Worker] Notification clicked
[Service Worker] Missing tracking data: {
  trackingUrl: undefined,
  clientId: "client_456"
}
```

## Server-Side Logs

Check server logs for:
```
=== ANALYTICS TRACKING REQUEST ===
Event: notification_clicked
Campaign ID: camp_123
Client ID: client_456
Timestamp: 2024-01-20T10:30:00.000Z
Metadata: { action: "default", url: "https://example.com" }
=================================
```

## Environment Variables

Ensure these are set correctly:
- `NEXT_PUBLIC_APP_URL`: Your app's public URL (e.g., https://push-notification-app-steel.vercel.app)
- Used to construct the tracking URL in notifications

## API Endpoints

### Track Event
```bash
POST /api/analytics/track
Content-Type: application/json

{
  "event": "notification_clicked",
  "campaignId": "camp_123",
  "clientId": "client_456",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "metadata": {
    "action": "default",
    "url": "https://example.com"
  }
}
```

### Get Tracking Events
```bash
GET /api/analytics/track?campaignId=camp_123&event=notification_clicked&limit=10
```

## Update Service Worker

To update customers' service workers:
1. Replace their `push-sw.js` with the latest version
2. Increment the version number
3. The service worker will auto-update on next page load
4. Or manually update: DevTools → Application → Service Workers → Update

## Support

If issues persist after following this guide:
1. Check server logs for errors
2. Verify all environment variables
3. Test with a fresh browser profile
4. Contact support with console logs and network traces