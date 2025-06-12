#!/bin/bash

echo "🚀 Push Notification App - Database Setup"
echo "========================================"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed."
    echo "Please install PostgreSQL first:"
    echo "  - macOS: brew install postgresql"
    echo "  - Ubuntu: sudo apt-get install postgresql"
    echo "  - Windows: Download from https://www.postgresql.org/download/windows/"
    exit 1
fi

echo "✅ PostgreSQL is installed"

# Database configuration
DB_NAME="push_notifications_db"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"

echo ""
echo "📋 Database Configuration:"
echo "  Name: $DB_NAME"
echo "  User: $DB_USER"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo ""

# Prompt for database password
echo -n "Enter PostgreSQL password for user '$DB_USER': "
read -s DB_PASSWORD
echo ""

# Create database
echo "Creating database '$DB_NAME'..."
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -h $DB_HOST -p $DB_PORT -c "CREATE DATABASE $DB_NAME;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Database created successfully"
else
    echo "⚠️  Database might already exist or there was an error"
    echo "   Attempting to connect to existing database..."
fi

# Test connection
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Successfully connected to database"
else
    echo "❌ Failed to connect to database"
    echo "   Please check your PostgreSQL installation and credentials"
    exit 1
fi

# Create .env.local file
ENV_FILE=".env.local"
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"

if [ -f "$ENV_FILE" ]; then
    echo ""
    echo "⚠️  .env.local already exists"
    echo "   Adding DATABASE_URL to existing file..."
    
    # Check if DATABASE_URL already exists
    if grep -q "DATABASE_URL" "$ENV_FILE"; then
        echo "   DATABASE_URL already exists in .env.local"
        echo "   Current value:"
        grep "DATABASE_URL" "$ENV_FILE"
        echo ""
        echo -n "Do you want to update it? (y/n): "
        read UPDATE_DB
        if [ "$UPDATE_DB" = "y" ]; then
            # Remove old DATABASE_URL and add new one
            grep -v "DATABASE_URL" "$ENV_FILE" > "$ENV_FILE.tmp"
            mv "$ENV_FILE.tmp" "$ENV_FILE"
            echo "DATABASE_URL=\"$DATABASE_URL\"" >> "$ENV_FILE"
            echo "✅ DATABASE_URL updated"
        fi
    else
        echo "DATABASE_URL=\"$DATABASE_URL\"" >> "$ENV_FILE"
        echo "✅ DATABASE_URL added to .env.local"
    fi
else
    echo ""
    echo "Creating .env.local file..."
    cat > "$ENV_FILE" << EOF
# Database
DATABASE_URL="$DATABASE_URL"

# Push Notification Configuration
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@example.com

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# API Configuration
API_SECRET_KEY=$(openssl rand -base64 32)
EOF
    echo "✅ Created .env.local file"
fi

echo ""
echo "🎉 Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Run: npm install"
echo "2. Run: npm run generate-vapid-keys (if not already done)"
echo "3. Run: npm run db:generate"
echo "4. Run: npm run db:push"
echo "5. Run: npm run dev"
echo ""
echo "Your DATABASE_URL is:"
echo "$DATABASE_URL"