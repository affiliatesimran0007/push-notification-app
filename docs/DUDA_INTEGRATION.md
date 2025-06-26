# Duda Platform Integration Guide

This guide explains how to integrate push notifications on websites hosted on Duda.

## Overview

Duda has some platform limitations that require special handling:
- Limited root directory access (can't upload files to root)
- Service workers must be served from the same origin
- Custom HTML/JavaScript can be added via widgets or site settings

## Integration Steps

### Step 1: Upload Service Worker to Duda CDN

Duda allows file uploads through their file manager:

1. In Duda Editor, go to **Files & Images**
2. Upload the `push-sw.js` file
3. Note the CDN path (e.g., `/a4d0b8ec/files/uploaded/push-sw.js`)
4. This path will be used in your configuration

**Alternative Options:**
- Contact Duda support to upload to root directory (if available on your plan)
- Use a subdirectory or proxy solution if CDN upload doesn't work

### Step 2: Add Integration Code

**Method 1: Site-Wide Integration (Recommended)**
1. In Duda Editor, go to **Site Settings**
2. Navigate to **SEO & HTML** → **Header HTML**
3. Add the following code:

```html
<script>
// Push Notification Configuration for Duda
window.PUSH_CONFIG = {
  appUrl: 'YOUR_PUSH_APP_URL',
  landingId: 'YOUR_LANDING_ID',
  vapidKey: 'YOUR_VAPID_PUBLIC_KEY',
  domain: 'your-actual-domain.com', // Your actual domain, not CDN
  botProtection: true,
  serviceWorkerPath: '/YOUR_CDN_PATH/files/uploaded/push-sw.js', // Your Duda CDN path
  redirects: {
    enabled: false, // Important: Disable for Google Ads
    onAllow: '',
    onBlock: ''
  }
};
</script>
<script src="YOUR_PUSH_APP_URL/js/push-widget-duda.js" defer></script>
```

**Method 2: Page-Specific Integration**
1. In Duda Editor, add an **HTML Widget** to your page
2. Set the widget to "Hidden" (it only needs to load the script)
3. Add the same code as above

### Step 3: Real Example for Duda

Here's a complete working example as used on usproadvisor.com:

```html
<!-- Push Notification Integration Code -->
<!-- Domain: usproadvisor.com | Landing Page: usproadvisor.com -->
<!-- IMPORTANT: Place this code as early as possible in your HTML, preferably right after <head> -->
<script>
// Configuration - must be set before widget loads
window.PUSH_CONFIG = {
  appUrl: 'https://push-notification-app-steel.vercel.app',
  landingId: 'qb',
  vapidKey: 'BGv2Vm45eFGslcXFhakD-euIXAnOg6-bdqVWHoSw4gwvjvYYV1zBA_Q7uiNij5yvRqMwmDhpBYYSA1v5Z_GEv_k',
  domain: 'usproadvisor.com',
  botProtection: true,
  serviceWorkerPath: '/a4d0b8ec/files/uploaded/push-sw.js', // Duda CDN path
  redirects: {
    enabled: false,  // Should be false for Google Ads
    onAllow: '',     // Empty for Google Ads
    onBlock: ''      // Empty for Google Ads
  }
};
</script>
<script src="https://push-notification-app-steel.vercel.app/js/push-widget-duda.js"></script>
```

### Step 4: Alternative Solutions

If Duda's limitations are too restrictive, consider these alternatives:

1. **Proxy Solution**: Set up a proxy server that serves the service worker
2. **Subdomain Approach**: Use a subdomain not hosted on Duda for the service worker
3. **External Landing Page**: Direct traffic to an external landing page first

## Testing Your Integration

1. **Check Service Worker**: Visit your service worker URL
   - For Duda CDN: `https://your-site.com/YOUR_CDN_PATH/files/uploaded/push-sw.js`
   - Example: `https://irp.cdn-website.com/a4d0b8ec/files/uploaded/push-sw.js`
   - Should return the service worker JavaScript file
   - If 404, the service worker isn't properly uploaded

2. **Test Push Flow**:
   - Visit your Duda site
   - You should see the bot protection overlay (if enabled)
   - Complete the notification permission flow
   - Check your Push Clients dashboard for the new subscriber
   
3. **Verify in Browser Console**:
   - Open browser developer tools (F12)
   - Check for any JavaScript errors
   - Look for `[PushWidget-Duda]` log messages
   - Verify service worker registration succeeded

## Troubleshooting

### Common Issues:

1. **Service Worker 404 Error**
   - Service worker not uploaded to root
   - Contact Duda support or use alternative solution

2. **Bot Check Not Appearing**
   - Check browser console for errors
   - Verify integration code is properly added
   - Ensure JavaScript isn't blocked

3. **Permission Not Working**
   - Ensure site is HTTPS (required for notifications)
   - Check browser notification settings
   - Try different browser

### Duda-Specific Considerations:

- **Performance**: Add integration code early in `<head>` to prevent content flash
- **Mobile**: Test on mobile devices as Duda sites are often mobile-optimized
- **Cache**: Clear Duda's cache after making changes
- **Preview Mode**: Integration may not work in Duda's preview mode
- **CDN Path**: Your service worker CDN path is unique to your Duda site
- **Google Ads**: Always set `redirects.enabled: false` for Google Ads compliance
- **Widget Version**: Use `push-widget-duda.js` (not regular `push-widget.js`) for custom service worker paths

## Support

If you encounter issues specific to Duda:
1. Check browser console for errors
2. Verify all configuration values are correct
3. Contact your push notification platform support
4. As last resort, consider hosting landing page outside Duda