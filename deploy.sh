#!/bin/bash

# Deployment script for Ubuntu server
# Usage: ./deploy.sh

echo "🚀 Starting deployment to Ubuntu server..."

# Configuration
SERVER_IP="185.161.209.188"
SERVER_USER="root"  # Change this to your server username
APP_DIR="/var/www/push-notification-app"
PM2_APP_NAME="push-notification-app"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Build the application locally
echo "📦 Building application..."
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed!${NC}"
    exit 1
fi

# Step 2: Create deployment package
echo "📦 Creating deployment package..."
tar -czf deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='.env.local' \
  --exclude='.next/cache' \
  --exclude='deploy.tar.gz' \
  .

# Step 3: Upload to server
echo "📤 Uploading to server..."
scp deploy.tar.gz $SERVER_USER@$SERVER_IP:/tmp/

# Step 4: Deploy on server
echo "🚀 Deploying on server..."
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
  # Create app directory if it doesn't exist
  mkdir -p /var/www/push-notification-app
  
  # Navigate to app directory
  cd /var/www/push-notification-app
  
  # Backup current deployment
  if [ -d ".next" ]; then
    echo "📦 Backing up current deployment..."
    tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz .next public package.json
  fi
  
  # Extract new deployment
  echo "📦 Extracting new deployment..."
  tar -xzf /tmp/deploy.tar.gz
  
  # Install dependencies
  echo "📦 Installing dependencies..."
  npm install --production
  
  # Run database migrations
  echo "🗄️ Running database migrations..."
  npx prisma generate
  npx prisma db push
  
  # Restart application with PM2
  echo "🔄 Restarting application..."
  pm2 delete push-notification-app 2>/dev/null || true
  pm2 start npm --name "push-notification-app" -- start
  pm2 save
  
  # Clean up
  rm /tmp/deploy.tar.gz
  
  echo "✅ Deployment complete!"
ENDSSH

# Clean up local files
rm deploy.tar.gz

echo -e "${GREEN}✅ Deployment successful!${NC}"
echo "🌐 Application should be running at: http://$SERVER_IP:3000"