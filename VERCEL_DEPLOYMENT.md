# Vercel Deployment Guide

## Quick Deployment Steps

### 1. Install Vercel CLI (if not already installed)
```bash
npm i -g vercel
```

### 2. Generate VAPID Keys
```bash
node scripts/generate-vapid-keys.js
```
Save these keys - you'll need them for environment variables.

### 3. Deploy to Vercel

#### Option A: Using Vercel CLI
```bash
vercel
```

Follow the prompts:
- Link to existing project or create new
- Configure project settings
- Deploy

#### Option B: Using Git Integration
1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Configure environment variables (see below)
5. Deploy

### 4. Configure Environment Variables

In Vercel Dashboard (or during CLI setup), add these environment variables:

```bash
# Database (Required)
DATABASE_URL=postgresql://postgres:your_password@185.161.209.188:5432/push_notifications

# VAPID Keys (Required - from step 2)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_SUBJECT=mailto:admin@yourdomain.com

# Optional
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 5. Set Up Database

After deployment, run database migrations:

```bash
# Using Vercel CLI
vercel env pull .env.local
npm run db:push

# Or manually create tables using Prisma
npx prisma db push
```

## Post-Deployment Steps

### 1. Update Integration Script

After deployment, update the `appUrl` in your integration scripts:

```javascript
const PUSH_CONFIG = {
  appUrl: 'https://your-app.vercel.app',  // Your Vercel URL
  landingId: '1',
  vapidKey: 'YOUR_VAPID_PUBLIC_KEY'
};
```

### 2. Test Your Deployment

1. Visit your Vercel URL
2. Create a landing page
3. Test the integration on a sample website

### 3. Custom Domain (Optional)

1. Go to your Vercel project settings
2. Add your custom domain
3. Update DNS records as instructed
4. Update integration scripts with new domain

## Troubleshooting

### Database Connection Issues

If you can't connect to your PostgreSQL database:

1. **Check firewall**: Ensure port 5432 is open on 185.161.209.188
2. **Allow Vercel IPs**: Configure PostgreSQL to accept connections from Vercel
3. **Consider cloud database**: Use Vercel Postgres, Supabase, or Neon for easier setup

### Environment Variables Not Working

- Use `NEXT_PUBLIC_` prefix for client-side variables
- Redeploy after adding/changing environment variables
- Check variable names match exactly (case-sensitive)

### Build Failures

Common solutions:
- Clear cache: `vercel --force`
- Check Prisma schema is valid
- Ensure all dependencies are in package.json

## Using Vercel PostgreSQL (Alternative)

For easier setup, consider using Vercel's PostgreSQL:

1. In Vercel Dashboard, go to Storage
2. Create a PostgreSQL database
3. Copy the connection string
4. Update `DATABASE_URL` in environment variables

## Monitoring

- Check Functions tab for API logs
- Use Analytics tab for performance metrics
- Set up error tracking with Vercel's integrations

## Quick Commands

```bash
# Deploy
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs

# Update environment variables
vercel env add DATABASE_URL

# Pull environment variables locally
vercel env pull .env.local
```

## Next Steps

1. Set up a landing page in your app
2. Get the VAPID public key from Settings
3. Use the simple integration guide to add push notifications to any website
4. Monitor subscribers and send campaigns!