# Simple Integration Guide

This guide shows how to integrate push notifications into your website with minimal setup.

## Quick Start

### 1. Basic Integration (Single Line)

Add this script tag to your website's `<head>` section:

```html
<!-- For Vercel deployment -->
<script src="https://your-app.vercel.app/simple-integration.js"></script>

<!-- For self-hosted deployment -->
<script src="http://185.161.209.188/simple-integration.js"></script>
```

### 2. Configure the Script

Edit the configuration at the top of `simple-integration.js`:

```javascript
const PUSH_CONFIG = {
  appUrl: 'https://your-app.vercel.app', // Your Vercel app URL
  landingId: '1',                         // Your landing page ID from the app
  vapidKey: 'YOUR_VAPID_PUBLIC_KEY',      // Get from Settings page
  
  // Optional: Custom redirects
  redirects: {
    onAllow: null,  // URL after user allows (null = stay on page)
    onBlock: null   // URL after user blocks (null = stay on page)
  }
};
```

### 3. Complete HTML Example

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Website</title>
    
    <!-- Push Notification Integration -->
    <script src="http://185.161.209.188/simple-integration.js"></script>
</head>
<body>
    <h1>Welcome to My Website</h1>
    <p>You'll be prompted to enable notifications after a quick verification.</p>
</body>
</html>
```

## How It Works

1. **First Visit**: User visits your website
2. **Bot Check**: Automatically redirected to verification page (Cloudflare-style)
3. **Permission Request**: Browser asks for notification permission
4. **Subscription**: If allowed, user is subscribed to notifications
5. **Redirect**: User returns to your site (or custom redirect URL)

## Configuration Options

### Basic Configuration

```javascript
const PUSH_CONFIG = {
  appUrl: 'http://185.161.209.188',  // Required: Your server URL
  landingId: '1',                    // Required: Landing page ID
  vapidKey: 'BKd0...',               // Required: VAPID public key
};
```

### With Custom Redirects

```javascript
const PUSH_CONFIG = {
  appUrl: 'http://185.161.209.188',
  landingId: '1',
  vapidKey: 'BKd0...',
  redirects: {
    onAllow: 'https://mysite.com/welcome',      // After allowing
    onBlock: 'https://mysite.com/why-notify'    // After blocking
  }
};
```

## Getting Your Configuration Values

1. **Server URL**: This is your deployment URL (http://185.161.209.188)
2. **Landing ID**: 
   - Login to your push notification app
   - Go to Landing pages
   - Create a landing page
   - Note the ID shown
3. **VAPID Key**:
   - Go to Settings in your app
   - Copy the Public VAPID Key

## Testing

1. Open your website in a browser
2. You should be redirected to the bot check page
3. After verification, you'll see the notification permission prompt
4. Allow notifications to complete the subscription

## Troubleshooting

### Notifications not working?
- Check browser console for errors
- Ensure VAPID key is correct
- Verify landing ID exists in your app
- Check that your server is running

### Bot check not appearing?
- Clear browser cache and cookies
- Try incognito/private mode
- Check if JavaScript is enabled

### Permission prompt not showing?
- Check if notifications are blocked in browser settings
- Some browsers require HTTPS (except localhost)
- Mobile browsers may have different permission flows

## Advanced: Self-Hosted Integration

If you want to host the integration script yourself:

1. Copy `simple-integration.js` to your website
2. Update the configuration values
3. Include it like any local script:

```html
<script src="/js/simple-integration.js"></script>
```

## Support

For issues or questions:
- Check the browser console for error messages
- Review the main documentation at `/docs`
- Contact support with your landing ID and error details