# Multi-Tenant Push Notification Platform Setup

## 🎯 Architecture Overview

Your platform works like this:

1. **Your Platform**: `app.yourcompany.com` - Where customers manage campaigns
2. **Customer Sites**: `customer1.com`, `customer2.com` - Where end-users subscribe
3. **Cross-Domain Flow**: Customers embed your JS on their sites to collect subscribers

## 📦 Required Components

### 1. Push Widget JavaScript (push-widget.js)

This file will be loaded on customer websites:

```javascript
// This will be hosted on your domain and loaded by customers
// URL: https://app.yourcompany.com/js/push-widget.js

(function(window) {
  'use strict';
  
  window.PushWidget = {
    config: {},
    
    init: function(config) {
      this.config = config;
      
      // Check if already subscribed
      if (this.isSubscribed()) {
        return;
      }
      
      // Show bot check if enabled
      if (config.botCheck) {
        this.showBotCheck();
      } else {
        this.requestPermission();
      }
    },
    
    showBotCheck: function() {
      // Create iframe to your bot-check page
      const iframe = document.createElement('iframe');
      iframe.src = this.config.appUrl + '/landing/bot-check?landingId=' + 
                   this.config.landingId + '&domain=' + window.location.hostname;
      iframe.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:999999';
      document.body.appendChild(iframe);
      
      // Listen for messages from iframe
      window.addEventListener('message', this.handleMessage.bind(this));
    },
    
    handleMessage: function(event) {
      if (event.origin !== this.config.appUrl) return;
      
      if (event.data.type === 'permission-granted') {
        this.registerServiceWorker(event.data.subscription);
      } else if (event.data.type === 'permission-denied') {
        if (this.config.redirects && this.config.redirects.block) {
          window.location.href = this.config.redirects.block;
        }
      }
      
      // Remove iframe
      const iframe = document.querySelector('iframe[src*="bot-check"]');
      if (iframe) iframe.remove();
    },
    
    registerServiceWorker: function(subscription) {
      // Register service worker on CUSTOMER's domain
      navigator.serviceWorker.register('/push-sw.js')
        .then(function(registration) {
          // Send subscription to your server
          this.saveSubscription(subscription);
        }.bind(this));
    },
    
    saveSubscription: function(subscription) {
      fetch(this.config.appUrl + '/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription,
          landingId: this.config.landingId,
          domain: window.location.hostname,
          url: window.location.href,
          userAgent: navigator.userAgent
        })
      }).then(function() {
        if (this.config.redirects && this.config.redirects.allow) {
          window.location.href = this.config.redirects.allow;
        }
      }.bind(this));
    },
    
    isSubscribed: function() {
      return localStorage.getItem('push-subscribed-' + this.config.landingId) === 'true';
    }
  };
})(window);
```

### 2. Service Worker for Customer Sites (push-sw.js)

Customers need to host this on their domain:

```javascript
// This file must be hosted on CUSTOMER's domain root
// URL: https://customer-site.com/push-sw.js

self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || data.message,
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/badge-72x72.png',
    data: {
      url: data.url || '/',
      campaignId: data.campaignId
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Notification', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
  
  // Track click
  fetch('https://app.yourcompany.com/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'notification_clicked',
      campaignId: event.notification.data.campaignId
    })
  });
});
```

### 3. Customer Integration Code

What customers add to their website:

```html
<!-- Customer adds this to their website -->
<script>
  (function() {
    // Configuration for push notifications
    const pushConfig = {
      appUrl: 'https://app.yourcompany.com',    // YOUR platform URL
      landingId: 'CUSTOMER_LANDING_ID',         // Unique ID per customer
      vapidKey: 'CUSTOMER_VAPID_PUBLIC_KEY',    // Their VAPID key
      botCheck: true,                           // Enable bot protection
      redirects: {
        allow: '/thank-you',                    // Their thank you page
        block: '/notification-benefits'         // Their benefits page
      }
    };
    
    // Load push widget from YOUR domain
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

<!-- Customer must also host the service worker file -->
<!-- Download from: https://app.yourcompany.com/api/service-worker/CUSTOMER_ID -->
```

## 🔧 Implementation Steps

### 1. Update Your Bot Check Page

The bot-check page needs to work in an iframe and communicate with parent:

```javascript
// In app/landing/bot-check/page.jsx
// Add this after permission is granted/denied:

if (window.parent !== window) {
  // We're in an iframe
  window.parent.postMessage({
    type: permission === 'granted' ? 'permission-granted' : 'permission-denied',
    subscription: subscription // Include subscription data
  }, '*');
}
```

### 2. Create API Endpoint for Cross-Domain Subscription

```javascript
// app/api/subscribe/route.js
export async function POST(request) {
  const body = await request.json();
  
  // Get customer info from landingId
  const landing = await prisma.landing.findUnique({
    where: { id: body.landingId }
  });
  
  // Create subscription linked to customer's domain
  const client = await prisma.client.create({
    data: {
      endpoint: body.subscription.endpoint,
      p256dh: body.subscription.keys.p256dh,
      auth: body.subscription.keys.auth,
      domain: body.domain,              // Customer's domain
      subscribedUrl: body.url,          // Full URL where subscribed
      landingId: body.landingId,        // Link to landing page
      customerId: landing.customerId,   // Link to customer account
      // ... other fields
    }
  });
  
  return NextResponse.json({ success: true });
}
```

### 3. CORS Configuration

Update your Next.js config to allow cross-domain requests:

```javascript
// next.config.mjs
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
      {
        source: '/js/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ];
  },
};
```

### 4. Database Schema Updates

Add customer/domain tracking:

```prisma
model Customer {
  id           String    @id @default(cuid())
  name         String
  email        String    @unique
  company      String?
  domains      Domain[]
  landings     Landing[]
  clients      Client[]
  campaigns    Campaign[]
  createdAt    DateTime  @default(now())
}

model Domain {
  id           String    @id @default(cuid())
  domain       String    @unique
  customer     Customer  @relation(fields: [customerId], references: [id])
  customerId   String
  verified     Boolean   @default(false)
  createdAt    DateTime  @default(now())
}

model Landing {
  id           String    @id @default(cuid())
  name         String
  customer     Customer  @relation(fields: [customerId], references: [id])
  customerId   String
  domain       String    // Expected domain
  botCheck     Boolean   @default(true)
  redirects    Json?     // {allow: '', block: ''}
  clients      Client[]
  createdAt    DateTime  @default(now())
}

// Update Client model
model Client {
  // ... existing fields
  domain       String?   // Customer's domain
  landing      Landing?  @relation(fields: [landingId], references: [id])
  landingId    String?
  customer     Customer? @relation(fields: [customerId], references: [id])
  customerId   String?
}
```

## 🚀 How It Works

1. **Customer Signs Up** on your platform
2. **Creates Landing Page** with their domain settings
3. **Gets Integration Code** with unique landingId
4. **Adds Code** to their website
5. **Their Visitors** see bot-check on their domain
6. **Subscriptions** are stored linked to their domain
7. **Customer Sends Campaigns** to their subscribers only

## 📝 Customer Setup Instructions

What you'll provide to customers:

```markdown
# Push Notification Setup Guide

1. **Add Integration Code**
   Copy this code to your website's <head> section:
   [THEIR UNIQUE CODE]

2. **Download Service Worker**
   Download: https://app.yourcompany.com/api/service-worker/YOUR_ID
   Upload to your website root as: /push-sw.js

3. **Verify Installation**
   Visit: https://app.yourcompany.com/verify?domain=yourdomain.com

4. **Test Subscription**
   Open your website in incognito mode and test the flow

5. **Send Your First Campaign**
   Go to Campaigns → Create New Campaign
```

## 🔐 Security Considerations

1. **Domain Verification**: Verify customers own the domains
2. **VAPID Keys**: Generate unique keys per customer
3. **Rate Limiting**: Limit API calls per domain
4. **Subscription Validation**: Ensure subscriptions match claimed domains

Ready to implement this multi-tenant architecture?