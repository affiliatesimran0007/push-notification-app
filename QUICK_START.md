# 🚀 Quick Start Guide

Your app is running at: http://localhost:3001

## ⚠️ Next Steps Required:

### 1. Set Up PostgreSQL Database

**Option A: If you have PostgreSQL installed:**
```bash
# Run the setup script
./scripts/setup-database.sh
```

**Option B: Manual setup:**
```bash
# Create database
createdb push_notifications_db

# Or using psql
psql -U postgres -c "CREATE DATABASE push_notifications_db;"
```

### 2. Configure Environment

Create or update `.env.local`:
```env
# Database
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/push_notifications_db"

# VAPID Keys (run: npm run generate-vapid-keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_SUBJECT=mailto:admin@example.com

# Auth
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-here
```

### 3. Initialize Database

```bash
# Push schema to database
npm run db:push

# Seed with sample data
npm run db:seed
```

### 4. Generate VAPID Keys

```bash
npm run generate-vapid-keys
```

## 🧪 Test Credentials (after seeding)

- Admin: `admin@example.com` / `admin123`
- User: `user@example.com` / `user123`

## 🔍 Troubleshooting

### Database Connection Error
- Make sure PostgreSQL is running
- Verify DATABASE_URL in `.env.local`
- Check username/password

### Missing VAPID Keys
- Run `npm run generate-vapid-keys`
- Check `.env.local` has the keys

### Port Already in Use
- App is running on port 3001 instead of 3000
- Update NEXTAUTH_URL to use port 3001

## 📱 Test Push Notifications

1. Visit http://localhost:3001/dashboard
2. Click "Enable Push Notifications"
3. Allow browser permissions
4. Send test notification from Clients page