# Real Domain Setup for Landing Pages

## 🌐 Current Status
Your push notification app is currently running on `localhost:3000`. To use real domains for landing pages, you need to deploy and configure domains.

## 📋 Required Steps

### 1. Deploy Your App to Production

**Option A: Vercel (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from your project directory
cd "/Users/simran/Documents/Push Notification/push-notification-app"
vercel --prod

# Follow prompts to connect your GitHub and deploy
```

**Option B: Netlify**
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=.next
```

**Option C: Traditional VPS/Server**
- Deploy to your Ubuntu server (185.161.209.188)
- Set up Nginx reverse proxy
- Configure SSL with Let's Encrypt

### 2. Configure Environment Variables for Production

Update your production environment with:
```env
# Production Database (already configured)
DATABASE_URL="postgresql://push_app_user:YourStrongPassword123!@185.161.209.188:5432/push_notification_db"

# VAPID Keys (already configured)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BGv2Vm45eFGslcXFhakD-euIXAnOg6-bdqVWHoSw4gwvjvYYV1zBA_Q7uiNij5yvRqMwmDhpBYYSA1v5Z_GEv_k
VAPID_PRIVATE_KEY=g4-CwbusGW_nqMF30Bo2OfejBoVzTLZkM1PZ-YF0w98
VAPID_SUBJECT=mailto:admin@yourdomain.com

# Production URLs
NEXTAUTH_URL=https://your-app-domain.com
NEXT_PUBLIC_APP_URL=https://your-app-domain.com

# API Configuration
API_SECRET_KEY=your-production-api-key
```

### 3. Set Up Real Domains

**Domain Options:**

1. **Use Your Existing Domain**
   - Point your domain to your deployed app
   - Example: `pushapp.yourdomain.com`

2. **Get a New Domain**
   - Register on Namecheap, GoDaddy, etc.
   - Example: `yourapp.com`

3. **Use Deployment Platform Subdomain**
   - Vercel: `your-app.vercel.app`
   - Netlify: `your-app.netlify.app`

### 4. Configure Landing Page URLs

Once deployed, update your landing pages to use real URLs:

**Example Landing Page Configuration:**
```javascript
// Landing Page 1: Main Website
URL: https://yourapp.com
Redirect (Allow): https://yourapp.com/welcome
Redirect (Block): https://yourapp.com/benefits

// Landing Page 2: Blog Section  
URL: https://blog.yourapp.com
Redirect (Allow): https://blog.yourapp.com/subscribed
Redirect (Block): https://blog.yourapp.com/why-notifications

// Landing Page 3: E-commerce
URL: https://shop.yourapp.com
Redirect (Allow): https://shop.yourapp.com/offers
Redirect (Block): https://shop.yourapp.com/deals
```

### 5. Integration Code for Real Domains

After deployment, your integration code will look like:

```html
<!-- Add to your website's <head> section -->
<script>
  (function() {
    const config = {
      appUrl: 'https://your-app-domain.com',
      landingId: '1', // Your landing page ID
      vapidKey: 'BGv2Vm45eFGslcXFhakD-euIXAnOg6-bdqVWHoSw4gwvjvYYV1zBA_Q7uiNij5yvRqMwmDhpBYYSA1v5Z_GEv_k',
      botCheck: true,
      redirects: {
        allow: 'https://yourwebsite.com/welcome',
        block: 'https://yourwebsite.com/benefits'
      }
    };
    
    // Load push notification script
    const script = document.createElement('script');
    script.src = config.appUrl + '/js/push-widget.js';
    script.async = true;
    script.onload = function() {
      if (window.PushWidget) {
        window.PushWidget.init(config);
      }
    };
    document.head.appendChild(script);
  })();
</script>
```

## 🚀 Quick Start Options

### Option 1: Deploy to Vercel (Fastest)

1. **Push to GitHub:**
   ```bash
   cd "/Users/simran/Documents/Push Notification/push-notification-app"
   git init
   git add .
   git commit -m "Initial commit"
   # Create GitHub repo and push
   ```

2. **Deploy on Vercel:**
   - Connect GitHub repo
   - Add environment variables
   - Deploy automatically

3. **Use Vercel domain:**
   - Your app: `your-app.vercel.app`
   - Landing URL: `your-app.vercel.app/landing/bot-check`

### Option 2: Use Your Ubuntu Server

1. **Deploy to your server (185.161.209.188):**
   ```bash
   # On your server
   git clone your-repo
   npm install --production
   npm run build
   pm2 start npm --name "push-app" -- start
   ```

2. **Configure Nginx:**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

3. **Set up SSL:**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

## 📝 Next Steps After Deployment

1. **Test Landing Pages:**
   - Visit: `https://your-domain.com/landing/bot-check`
   - Verify bot protection works
   - Test notification permissions

2. **Update VAPID Subject:**
   ```env
   VAPID_SUBJECT=mailto:admin@your-actual-domain.com
   ```

3. **Configure Real Redirects:**
   - Create welcome pages
   - Set up benefits/info pages
   - Update landing page configurations

4. **Add to Your Websites:**
   - Insert integration code
   - Test cross-domain functionality
   - Monitor subscription rates

## 🔧 Required Files Update

Once you have a real domain, I'll help you:
1. Create the push widget JavaScript file
2. Update CORS settings for cross-domain requests
3. Configure proper service worker paths
4. Set up analytics tracking

**What's your preferred deployment option?**
- Vercel (easiest)
- Your Ubuntu server (185.161.209.188)
- Other hosting platform

Let me know and I'll help you deploy!