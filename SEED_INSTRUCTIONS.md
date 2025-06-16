# Database Seeding Instructions

## Production Database Seeding

The production database needs to be seeded with an admin user and templates before you can create templates on the website.

### Method 1: Using the API Endpoint (Recommended)

Visit the following URL in your browser:
```
https://push-notification-app-steel.vercel.app/api/seed-database?secret=push-notification-seed-2024
```

You should see a success response like:
```json
{
  "success": true,
  "message": "Database seeded successfully",
  "results": {
    "adminUser": "created",
    "templates": 8,
    "landingPages": 1
  }
}
```

### Method 2: Using the Script

Run the following command from the project root:
```bash
node scripts/seed-production.js
```

### Method 3: Set Environment Variable on Vercel

1. Go to your Vercel project settings
2. Navigate to Environment Variables
3. Add the following variable:
   - Name: `SEED_SECRET`
   - Value: `push-notification-seed-2024`
4. Redeploy your application

Then use the URL with your custom secret.

## Admin Credentials

After seeding, you can log in with:
- Email: `admin@example.com`
- Password: `admin123`

## Important Security Note

⚠️ **Change the SEED_SECRET in production!** The default secret is only for initial setup. Update it in your Vercel environment variables for security.

## Troubleshooting

If you get "Admin user not found" error:
1. Make sure you've run the seed endpoint successfully
2. Check that your database connection is working
3. Verify the DATABASE_URL environment variable is set correctly in Vercel