# Git + Vercel Automatic Deployment Setup

Follow these steps to connect your Git repository to Vercel for automatic deployments on every push.

## Step 1: Initialize Git Repository

```bash
cd push-notification-app
git init
git add .
git commit -m "Initial commit - Push Notification App"
```

## Step 2: Create GitHub Repository

1. Go to [GitHub.com](https://github.com)
2. Click the "+" icon → "New repository"
3. Name it: `push-notification-app`
4. Keep it private or public (your choice)
5. Don't initialize with README (we already have files)
6. Click "Create repository"

## Step 3: Connect Local to GitHub

Copy the commands from GitHub's quick setup, or use:

```bash
git remote add origin https://github.com/YOUR_USERNAME/push-notification-app.git
git branch -M main
git push -u origin main
```

## Step 4: Connect GitHub to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Click "Import Git Repository"
4. If not connected, click "Add GitHub Account" and authorize Vercel
5. Select your `push-notification-app` repository
6. Configure project:
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./` (leave as is)
   - Build Command: (leave default)
   - Output Directory: (leave default)

### Option B: Via Vercel CLI

```bash
vercel link
vercel git connect
```

## Step 5: Configure Environment Variables in Vercel

1. In your Vercel project dashboard
2. Go to "Settings" → "Environment Variables"
3. Add these variables:

```bash
DATABASE_URL=postgresql://postgres:password@185.161.209.188:5432/push_notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_generated_public_key
VAPID_PRIVATE_KEY=your_generated_private_key
VAPID_SUBJECT=mailto:admin@yourdomain.com
```

## Step 6: Deploy

Your first deployment will happen automatically when you connected the repo. For future deployments:

```bash
# Any changes you make
git add .
git commit -m "Your commit message"
git push

# Vercel will automatically deploy!
```

## Deployment Branches

By default:
- `main` branch → Production deployment
- Other branches → Preview deployments

You can change this in Vercel Settings → Git.

## Monitoring Deployments

### In GitHub:
- Check the ✓ or ✗ next to commits
- Click for deployment details

### In Vercel:
- Dashboard shows all deployments
- Click any deployment for logs

### Via CLI:
```bash
vercel ls
vercel inspect [deployment-url]
```

## Common Git Commands for Development

```bash
# Check status
git status

# Create new branch
git checkout -b feature/new-feature

# Stage changes
git add .

# Commit
git commit -m "Add new feature"

# Push branch
git push origin feature/new-feature

# Switch branches
git checkout main

# Pull latest changes
git pull origin main

# Merge branch
git merge feature/new-feature
```

## Troubleshooting

### Build Fails on Vercel
1. Check build logs in Vercel dashboard
2. Ensure all environment variables are set
3. Check if `npm run build` works locally

### Environment Variables Not Working
- Redeploy after adding variables
- Check variable names are exact
- Use `NEXT_PUBLIC_` prefix for client-side variables

### Database Connection Issues
- Ensure PostgreSQL allows connections from Vercel IPs
- Consider using a cloud database service

## Next Steps

1. Make a test change
2. Commit and push
3. Watch automatic deployment in Vercel
4. Share your Vercel URL!

Your app will be available at:
- `https://push-notification-app.vercel.app`
- Or `https://push-notification-app-[username].vercel.app`
- Or your custom domain if configured