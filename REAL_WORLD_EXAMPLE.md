# Real-World Example: Nike.com Integration

## 🏢 Scenario: Nike wants push notifications on their website

Let's walk through exactly what happens when Nike.com integrates your push notification service.

### 1️⃣ Nike Signs Up on Your Platform

**Nike's Dashboard (your-platform.com):**
```
Company: Nike Inc.
Domains: nike.com, nike.co.uk, nike.de
Monthly Subscribers: 0 (just started)
Plan: Enterprise ($299/month)
```

### 2️⃣ Nike Creates a Landing Page

Nike creates their first landing page in your dashboard:

```
Landing Page Name: Nike US Store
Domain: nike.com
Bot Protection: Enabled
Redirect URLs:
  - Allow: https://nike.com/exclusive-drops
  - Block: https://nike.com/why-notifications
VAPID Keys: Auto-generated
Landing Page ID: nike_us_001
```

### 3️⃣ Nike Gets Their Integration Code

Your platform generates this unique code for Nike:

```html
<!-- Nike adds this to nike.com -->
<script>
  (function() {
    const pushConfig = {
      appUrl: 'https://pushplatform.com',        // YOUR platform
      landingId: 'nike_us_001',                  // Nike's unique ID
      vapidKey: 'BNike123...xyz',                // Nike's VAPID key
      botCheck: true,
      redirects: {
        allow: 'https://nike.com/exclusive-drops',
        block: 'https://nike.com/why-notifications'
      }
    };
    
    const script = document.createElement('script');
    script.src = pushConfig.appUrl + '/js/push-widget.js';
    script.async = true;
    script.onload = function() {
      if (window.PushWidget) {
        window.PushWidget.init(pushConfig);
      }
    };
    document.head.appendChild(script);
  })();
</script>
```

### 4️⃣ Nike Adds Service Worker

Nike downloads the service worker from your platform and hosts it at:
`https://nike.com/push-sw.js`

The service worker contains:
```javascript
// Nike hosts this file on THEIR server
self.addEventListener('push', function(event) {
  const data = event.data.json();
  
  // Show notification with Nike branding
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: data.icon || 'https://nike.com/favicon.ico',
    badge: data.badge,
    data: { url: data.url }
  });
});

self.addEventListener('notificationclick', function(event) {
  // Track clicks back to YOUR platform
  fetch('https://pushplatform.com/api/analytics/track', {
    method: 'POST',
    body: JSON.stringify({
      event: 'click',
      campaignId: event.notification.data.campaignId
    })
  });
  
  // Open Nike's URL
  clients.openWindow(event.notification.data.url);
});
```

### 5️⃣ What Nike's Visitors See

**Step 1: User visits nike.com**
```
🌐 nike.com
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    NIKE
    
    New Air Max Collection
    Shop Now →
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Step 2: Bot check appears (5 seconds after page load)**
```
┌─────────────────────────────────────┐
│  Checking your browser              │
│                                     │
│  🛡️                                 │
│                                     │
│  This process is automatic.         │
│  Your browser will be verified      │
│  shortly.                           │
│                                     │
│  ⟳ Loading...                      │
│                                     │
│  Ray ID: 7cf123...                 │
│  Your IP: 72.125.x.x              │
│  Location: New York, US            │
└─────────────────────────────────────┘
```

**Step 3: Browser permission prompt**
```
┌─────────────────────────────────────┐
│ nike.com wants to:                  │
│                                     │
│ 🔔 Show notifications               │
│                                     │
│ Get exclusive drops, restocks,      │
│ and member-only deals               │
│                                     │
│ [Block]            [Allow]          │
└─────────────────────────────────────┘
```

**Step 4: After allowing**
- User redirected to: `nike.com/exclusive-drops`
- Subscription saved in YOUR database as:
  ```json
  {
    "id": "sub_123",
    "domain": "nike.com",
    "landingId": "nike_us_001",
    "customerId": "nike_account",
    "browser": "Chrome",
    "country": "United States",
    "subscribedUrl": "https://nike.com/shoes/air-max",
    "endpoint": "https://fcm.googleapis.com/...",
    "keys": {...}
  }
  ```

### 6️⃣ Nike Sends a Campaign

**In Nike's dashboard on YOUR platform:**

```
Campaign: "Air Jordan Restock Alert"
Message: "The Air Jordan 1 Retro is back in stock!"
Target: All nike.com subscribers (45,231 users)
Schedule: Send immediately
```

**What happens:**
1. Nike creates campaign in YOUR dashboard
2. YOUR server sends to all nike.com subscribers
3. Users see notification with Nike branding
4. Clicks tracked in YOUR analytics

### 7️⃣ What Nike Sees in Analytics

```
Dashboard > Analytics > nike.com

Total Subscribers: 45,231
Monthly Growth: +12.5%

Last Campaign: "Air Jordan Restock"
- Sent: 45,231
- Delivered: 44,892 (99.2%)
- Clicked: 12,543 (27.9%)
- Converted: 3,421 (7.6%)

Top Performing Campaigns:
1. "Flash Sale 50% Off" - 42% CTR
2. "New Collection Launch" - 35% CTR
3. "Member Exclusive Access" - 31% CTR
```

## 🔄 Complete Flow Diagram

```
1. Nike.com Page Load
       ↓
2. Your JS Widget Loads (from pushplatform.com)
       ↓
3. Bot Check Shows (iframe from pushplatform.com)
       ↓
4. User Allows Notifications (on nike.com domain)
       ↓
5. Service Worker Registered (nike.com/push-sw.js)
       ↓
6. Subscription Sent to YOUR API
       ↓
7. Stored in YOUR Database (linked to Nike account)
       ↓
8. Nike Sends Campaigns from YOUR Dashboard
       ↓
9. YOUR Server Delivers to Nike's Subscribers
       ↓
10. Analytics Tracked on YOUR Platform
```

## 💡 Key Points for Nike

1. **Nike owns the relationship** - Subscribers are on nike.com
2. **Nike controls the experience** - Custom redirects, timing
3. **Nike sees only their data** - Can't see other customers
4. **Nike pays per subscriber** - Based on their plan
5. **Nike gets detailed analytics** - All metrics tracked

## 🌍 Multi-Domain Example

Nike can create multiple landing pages:
- `nike.com` → US Store subscribers
- `nike.co.uk` → UK Store subscribers  
- `nike.de` → German Store subscribers
- `app.nike.com` → Mobile app users

Each domain has:
- Separate subscriber lists
- Different campaigns
- Unique analytics
- Custom settings

## 🏪 Other Real Examples

### Amazon.com
```javascript
redirects: {
  allow: '/deals-of-the-day',
  block: '/prime-benefits'
}
// Sends: Order updates, Deal alerts, Prime offers
```

### CNN.com
```javascript
redirects: {
  allow: '/breaking-news-alerts',
  block: '/newsletter-signup'
}
// Sends: Breaking news, Live updates, Daily digest
```

### Shopify Stores
```javascript
redirects: {
  allow: '/vip-club',
  block: '/sms-alerts'
}
// Sends: Abandoned cart, Back in stock, Sale alerts
```

## 🎯 Why Nike Chooses Your Platform

1. **No coding required** - Just add script tag
2. **Works on their domain** - Maintains trust
3. **Enterprise features** - Segmentation, A/B testing
4. **Detailed analytics** - ROI tracking
5. **Support included** - Help with optimization
6. **Compliance ready** - GDPR, CCPA built-in

This is exactly how OneSignal, PushEngage, and similar services work!