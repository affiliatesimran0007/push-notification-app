# Vercel Environment Variables Setup

## Fix "database-url" Secret Error

The error occurs because the `vercel.json` file references secrets that don't exist yet. Here's how to fix it:

### Option 1: Add Environment Variables in Vercel Dashboard (Recommended)

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add these variables:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `DATABASE_URL` | `postgresql://postgres:your_password@185.161.209.188:5432/push_notifications` | Production, Preview, Development |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | (generate below) | Production, Preview, Development |
| `VAPID_PRIVATE_KEY` | (generate below) | Production, Preview, Development |
| `VAPID_SUBJECT` | `mailto:admin@yourdomain.com` | Production, Preview, Development |

### Option 2: Update vercel.json (Remove Secret References)

Edit `vercel.json` to remove the `@` secret references:

```json
{
  "buildCommand": "prisma generate && next build",
  "framework": "nextjs",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "regions": ["iad1"],
  "env": {
    "NODE_ENV": "production"
  },
  // Remove the "build" section with @database-url references
  "headers": [
    // ... keep existing headers
  ],
  "rewrites": [
    // ... keep existing rewrites
  ]
}
```

### Generate VAPID Keys

Run this locally to generate your VAPID keys:

```bash
cd push-notification-app
node scripts/generate-vapid-keys.js
```

This will output:
```
VAPID Keys Generated:
Public Key: BKd0...
Private Key: YXN0...
```

### Database Options

#### Option A: Use Your PostgreSQL Server (185.161.209.188)

1. Ensure PostgreSQL is accessible from external IPs:
   - Edit `/etc/postgresql/*/main/postgresql.conf`
   - Set `listen_addresses = '*'`
   - Edit `/etc/postgresql/*/main/pg_hba.conf`
   - Add: `host all all 0.0.0.0/0 md5`
   - Restart PostgreSQL

2. Use this connection string:
   ```
   postgresql://postgres:your_password@185.161.209.188:5432/push_notifications
   ```

#### Option B: Use Vercel Postgres (Easier)

1. In Vercel Dashboard → Storage → Create Database
2. Select "Postgres"
3. Copy the connection string provided
4. Use that as your `DATABASE_URL`

#### Option C: Use Free PostgreSQL Services

- **Supabase**: [supabase.com](https://supabase.com) (Free tier)
- **Neon**: [neon.tech](https://neon.tech) (Free tier)
- **Aiven**: [aiven.io](https://aiven.io) (Free trial)

### After Adding Variables

1. Redeploy your project:
   ```bash
   vercel --prod
   ```

2. Or trigger via Git:
   ```bash
   git commit --allow-empty -m "Trigger deployment"
   git push
   ```

### Verify Environment Variables

Check if variables are set:
```bash
vercel env ls
```

### Common Issues

1. **SSL Connection Required**: Add `?sslmode=require` to DATABASE_URL
2. **Connection Timeout**: Database firewall blocking Vercel IPs
3. **Invalid Password**: Special characters need URL encoding

### Quick Fix Commands

```bash
# Add environment variable via CLI
vercel env add DATABASE_URL

# Pull environment variables locally
vercel env pull .env.local

# Redeploy with new variables
vercel --prod --force
```