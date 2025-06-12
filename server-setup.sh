#!/bin/bash

# Server setup script for Ubuntu 22.04
# Run this on your server to prepare it for the push notification app

echo "🚀 Setting up Ubuntu server for Push Notification App..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install nginx
echo "📦 Installing Nginx..."
sudo apt install -y nginx

# Create app directory
echo "📁 Creating application directory..."
sudo mkdir -p /var/www/push-notification-app
sudo chown $USER:$USER /var/www/push-notification-app

# Configure Nginx
echo "⚙️ Configuring Nginx..."
sudo tee /etc/nginx/sites-available/push-notification-app > /dev/null <<EOF
server {
    listen 80;
    server_name 185.161.209.188;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Allow larger payloads for push notifications
    client_max_body_size 10M;
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/push-notification-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
echo "🔄 Restarting Nginx..."
sudo nginx -t && sudo systemctl reload nginx

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw --force enable

# Setup PM2 to start on boot
echo "⚙️ Configuring PM2 startup..."
pm2 startup systemd -u $USER --hp /home/$USER
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER

# Create .env.production file
echo "📝 Creating environment file..."
cat > /var/www/push-notification-app/.env.production <<EOF
# Production Environment Variables
# IMPORTANT: Update these values!

DATABASE_URL="postgresql://postgres:your_password@localhost:5432/push_notifications"
NEXT_PUBLIC_APP_URL="http://185.161.209.188"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="generate_this_key"
VAPID_PRIVATE_KEY="generate_this_key"
VAPID_SUBJECT="mailto:admin@yourdomain.com"
EOF

echo "✅ Server setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Update PostgreSQL connection in /var/www/push-notification-app/.env.production"
echo "2. Generate VAPID keys: cd /var/www/push-notification-app && node scripts/generate-vapid-keys.js"
echo "3. Deploy your application using the deploy.sh script"
echo ""
echo "🔐 PostgreSQL setup (if not already done):"
echo "   sudo -u postgres psql"
echo "   CREATE DATABASE push_notifications;"
echo "   ALTER USER postgres PASSWORD 'your_secure_password';"
echo "   \\q"