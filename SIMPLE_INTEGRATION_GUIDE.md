# Simple Integration Guide - 3 Easy Methods

## Method 1: Direct Link (Easiest!)

Just add a link on your website:

```html
<a href="https://99d2-49-36-144-217.ngrok-free.app/l/alerts-intuit-main?domain=alerts-intuit.com">
  Enable Push Notifications
</a>
```

That's it! When users click the link, they'll go through the notification setup.

## Method 2: Automatic Redirect

Add this to your HTML to automatically redirect new visitors:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Your Site</title>
    <meta http-equiv="refresh" content="0; url=https://99d2-49-36-144-217.ngrok-free.app/l/alerts-intuit-main?domain=alerts-intuit.com">
</head>
<body>
    <h1>Welcome</h1>
    <p>Setting up notifications...</p>
</body>
</html>
```

## Method 3: Button with Styling

Add a nice button to your site:

```html
<button onclick="window.location.href='https://99d2-49-36-144-217.ngrok-free.app/l/alerts-intuit-main?domain=alerts-intuit.com'" 
        style="background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
  🔔 Get Notified
</button>
```

## How It Works

1. User visits your site and clicks the link/button
2. They're redirected to the push notification setup
3. After allowing notifications, they're redirected back to your site
4. No JavaScript required on your domain!

## Custom Parameters

You can customize the redirect URLs:

```
https://99d2-49-36-144-217.ngrok-free.app/l/YOUR-LANDING-ID?domain=yourdomain.com&allow=https://yourdomain.com/thanks&block=https://yourdomain.com/blocked
```

## For Alerts-Intuit.com

Your specific link is:
```
https://99d2-49-36-144-217.ngrok-free.app/l/alerts-intuit-main?domain=alerts-intuit.com
```

Just add this link anywhere on your site!