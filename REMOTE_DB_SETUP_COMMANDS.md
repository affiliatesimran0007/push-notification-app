# Remote PostgreSQL Configuration Commands

Since PostgreSQL is already installed, run these commands on your server:

## 1. Find PostgreSQL Version and Config Path

```bash
# Check PostgreSQL version
psql --version

# Find config file location (run as postgres user)
sudo -u postgres psql -c "SHOW config_file;"
```

## 2. Configure Remote Access

```bash
# The config file is usually at one of these locations:
# /etc/postgresql/14/main/postgresql.conf
# /etc/postgresql/15/main/postgresql.conf

# Edit postgresql.conf (replace 14 with your version)
sudo nano /etc/postgresql/14/main/postgresql.conf
```

**Find and change:**
```
#listen_addresses = 'localhost'
```
**To:**
```
listen_addresses = '*'
```

## 3. Configure Authentication

```bash
# Edit pg_hba.conf (replace 14 with your version)
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

**Add at the end:**
```
# Allow remote connections
host    all             all             0.0.0.0/0               md5
```

## 4. Restart PostgreSQL

```bash
sudo systemctl restart postgresql
```

## 5. Create Database and User

```bash
# Connect to PostgreSQL
sudo -u postgres psql
```

**Then run these SQL commands:**
```sql
-- Create database
CREATE DATABASE push_notification_db;

-- Create user (CHANGE THE PASSWORD!)
CREATE USER push_app_user WITH ENCRYPTED PASSWORD 'ChangeThisPassword123!';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE push_notification_db TO push_app_user;

-- Connect to the database
\c push_notification_db

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO push_app_user;

-- Exit
\q
```

## 6. Configure Firewall

```bash
# Allow PostgreSQL port
sudo ufw allow 5432/tcp
sudo ufw reload

# Check status
sudo ufw status
```

## 7. Test Connection

From your LOCAL machine, test the connection:

```bash
# Install PostgreSQL client if needed
brew install postgresql

# Test connection (replace password)
psql -h 185.161.209.188 -U push_app_user -d push_notification_db
```

## 8. Update Your App

Update `.env.local` on your local machine:

```env
# Replace with your actual password
DATABASE_URL="postgresql://push_app_user:ChangeThisPassword123!@185.161.209.188:5432/push_notification_db"
```

## Quick Copy-Paste Commands

Here's a single block you can copy and run (adjust PostgreSQL version):

```bash
# Configure PostgreSQL for remote access
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/14/main/postgresql.conf
echo "host    all             all             0.0.0.0/0               md5" | sudo tee -a /etc/postgresql/14/main/pg_hba.conf
sudo systemctl restart postgresql

# Open firewall
sudo ufw allow 5432/tcp
sudo ufw reload
```

Then create the database:

```bash
sudo -u postgres psql << EOF
CREATE DATABASE push_notification_db;
CREATE USER push_app_user WITH ENCRYPTED PASSWORD 'ChangeThisPassword123!';
GRANT ALL PRIVILEGES ON DATABASE push_notification_db TO push_app_user;
\c push_notification_db
GRANT ALL ON SCHEMA public TO push_app_user;
EOF
```

**IMPORTANT**: 
1. Replace `14` with your PostgreSQL version
2. Change `ChangeThisPassword123!` to a strong password
3. Save the password securely - you'll need it for the connection string