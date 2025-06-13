# User Journey Guide

## 🏢 Customer Journey (Your Users)

### 1. Initial Setup
```
Customer (e.g., Intuit) → Your Platform → Setup Landing Page
```

1. **Sign Up & Login**
   - Customer signs up for your push notification service
   - Logs into dashboard at `push-notification-app-steel.vercel.app`

2. **Create Landing Page**
   - Navigate to Landing Pages section
   - Click "Create Landing Page"
   - Fill in details:
     - Name: "Intuit Alerts"
     - Domain: `alerts-intuit.com`
     - Landing ID: `intuit-main`
     - Enable bot protection: ✓
     - Redirect URLs (optional):
       - On Allow: `https://alerts-intuit.com/thank-you`
       - On Block: `https://alerts-intuit.com/notifications-info`

3. **Get Integration Code**
   - Receive two things:
     a. Service worker file (`push-sw.js`) to download
     b. JavaScript integration code
   
4. **Implement on Their Website**
   - Upload `push-sw.js` to `https://alerts-intuit.com/push-sw.js`
   - Add integration code to their website's HTML:
   ```html
   <script>
   (function() {
     window.PUSH_CONFIG = {
       appUrl: 'https://push-notification-app-steel.vercel.app',
       landingId: 'intuit-main',
       vapidKey: 'BGv2Vm45...',
       domain: 'alerts-intuit.com',
       botProtection: true,
       redirects: {
         enabled: true,
         onAllow: 'https://alerts-intuit.com/thank-you',
         onBlock: 'https://alerts-intuit.com/notifications-info'
       }
     };
     
     const script = document.createElement('script');
     script.src = window.PUSH_CONFIG.appUrl + '/js/push-widget.js';
     script.async = true;
     document.head.appendChild(script);
   })();
   </script>
   ```

### 2. Managing Subscribers
```
Dashboard → Clients → View Real-time Subscribers
```

- See all visitors who subscribed
- View their:
  - Browser & OS
  - Location (timezone)
  - Subscription status
  - Last active time
- Real-time updates as new visitors subscribe

### 3. Creating Campaigns
```
Templates → Select/Create → Campaign Builder → Launch
```

1. **Choose or Create Template**
   - Browse existing templates
   - Or create custom template with:
     - Title
     - Message
     - Icon (upload or URL)
     - Category

2. **Build Campaign**
   - Template auto-fills the content
   - Configure:
     - Target audience (by landing page)
     - Browser targeting (Chrome, Firefox, etc.)
     - OS targeting (Windows, Mac, etc.)
     - Schedule (IST timezone)
     - Action buttons (optional)

3. **Launch Campaign**
   - Save as draft or launch immediately
   - Track delivery in real-time:
     - Sent count
     - Delivered count
     - Click count
     - CTR percentage

## 👥 Visitor Journey (Your Customer's Website Visitors)

### First-Time Visitor Flow

```
Visit Website → Bot Check (if enabled) → Permission Prompt → Subscribe/Block
```

1. **Lands on Customer Website**
   - Visitor goes to `https://alerts-intuit.com`
   - Push widget loads automatically
   - Checks if already subscribed

2. **Bot Protection (if enabled)**
   - **What visitor sees:**
     - Semi-transparent overlay appears
     - Cloudflare-style verification in a modal
     - "Checking your browser..." message
     - Takes ~1.5 seconds
   - **Important:** Visitor stays on `alerts-intuit.com` (no redirect!)
   - After verification, automatically proceeds to next step

3. **Permission Prompt**
   - Browser's native notification prompt appears
   - "alerts-intuit.com wants to show notifications"
   - Three options:
     - **Allow**: Subscribe to notifications
     - **Block**: Deny notifications
     - **Dismiss** (X): Close without choosing

4. **After Permission Choice**

   **If Allowed:**
   - Service worker registers on `alerts-intuit.com`
   - Subscription saved to your platform
   - Visitor redirected to thank-you page (if configured)
   - Can now receive push notifications

   **If Blocked:**
   - Block status recorded
   - Visitor redirected to info page (if configured)
   - Won't be prompted again

   **If Dismissed:**
   - Nothing happens
   - May be prompted again on next visit

### Returning Visitor Flow

```
Visit Website → Already Subscribed → No Prompts
```

- Widget detects existing subscription
- No bot check shown
- No permission prompt
- Seamless experience

### Receiving Notifications

```
Campaign Sent → Push Notification → Click → Landing Page
```

1. **Notification Appears**
   - Shows on desktop/mobile
   - Displays campaign:
     - Title
     - Message
     - Icon
     - Action buttons (if any)

2. **Interaction**
   - **Click notification**: Opens target URL
   - **Click action button**: Opens specific URL
   - **Dismiss**: Notification disappears
   - All interactions tracked in your platform

## 🔑 Key Points

### For Customers (Your Users)
1. **Complete White-Label**: Visitors only see customer's domain
2. **Real-time Analytics**: Track everything instantly
3. **Multi-domain Support**: One account, multiple websites
4. **Campaign Management**: Create, schedule, track from one dashboard

### For Visitors (End Users)
1. **Seamless Experience**: Stay on the website they trust
2. **Quick Verification**: Bot check takes only 1.5 seconds
3. **Standard Permissions**: Uses browser's native prompt
4. **Control**: Can allow, block, or dismiss

## 📊 Data Flow

```
Visitor Action → Customer's Domain → Your Platform → Analytics
```

1. **Subscription Data**
   - Stored in your PostgreSQL database
   - Linked to customer's landing page
   - Includes browser, OS, location info

2. **Campaign Delivery**
   - Your platform sends to Web Push API
   - Delivered to subscriber's browser
   - Shows as coming from customer's domain

3. **Tracking**
   - Clicks tracked via service worker
   - Stats updated in real-time
   - Available in campaign dashboard

## 🎯 Success Metrics

### For Customers
- Number of subscribers
- Campaign delivery rate
- Click-through rate
- Geographic distribution
- Device/browser breakdown

### For Visitors
- Relevant notifications
- From trusted domain
- Easy opt-out options
- No spam or oversending