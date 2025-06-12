# PostgreSQL Setup Guide for Ubuntu Server

## Server Details
- **IP Address**: 185.161.209.188
- **OS**: Ubuntu 22.04 LTS (x64)
- **Purpose**: Push Notification App Database

## 1. Connect to Your Server

```bash
# Connect via SSH (replace 'root' with your username if different)
ssh root@185.161.209.188

# Or if you have an SSH key
ssh -i ~/.ssh/your-key.pem root@185.161.209.188
```

## 2. Install PostgreSQL

```bash
# Update package list
sudo apt update

# Install PostgreSQL and additional contrib package
sudo apt install postgresql postgresql-contrib -y

# Check PostgreSQL status
sudo systemctl status postgresql

# Check PostgreSQL version
psql --version
```

## 3. Configure PostgreSQL for Remote Connections

### 3.1 Edit PostgreSQL Configuration

```bash
# Find PostgreSQL version and config location
sudo -u postgres psql -c "SHOW config_file;"

# Edit postgresql.conf (adjust path based on your version, typically 14 or 15)
sudo nano /etc/postgresql/14/main/postgresql.conf

# Find and change this line:
# listen_addresses = 'localhost'
# To:
listen_addresses = '*'

# Save and exit (Ctrl+X, Y, Enter)
```

### 3.2 Configure Authentication

```bash
# Edit pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Add this line at the end to allow remote connections:
host    all             all             0.0.0.0/0               md5

# For better security, you can restrict to specific IPs:
# host    all             all             YOUR_LOCAL_IP/32        md5

# Save and exit
```

### 3.3 Restart PostgreSQL

```bash
sudo systemctl restart postgresql
```

## 4. Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt, run:
```

```sql
-- Create database
CREATE DATABASE push_notification_db;

-- Create user with encrypted password
CREATE USER push_app_user WITH ENCRYPTED PASSWORD 'YourStrongPassword123!';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE push_notification_db TO push_app_user;

-- Grant schema permissions
\c push_notification_db
GRANT ALL ON SCHEMA public TO push_app_user;

-- Exit PostgreSQL
\q
```

## 5. Configure Firewall

```bash
# If using UFW (Ubuntu Firewall)
sudo ufw allow 5432/tcp
sudo ufw reload

# Check firewall status
sudo ufw status

# If using iptables instead
sudo iptables -A INPUT -p tcp --dport 5432 -j ACCEPT
sudo iptables-save
```

## 6. Test Remote Connection

From your local machine:

```bash
# Test connection (install postgresql-client if needed)
psql -h 185.161.209.188 -U push_app_user -d push_notification_db

# Or using environment variable
export DATABASE_URL="postgresql://push_app_user:YourStrongPassword123!@185.161.209.188:5432/push_notification_db"
```

## 7. Update Your App Configuration

Update your `.env.local` file:

```env
# Remote PostgreSQL Database
DATABASE_URL="postgresql://push_app_user:YourStrongPassword123!@185.161.209.188:5432/push_notification_db"

# Or with SSL (recommended for production)
DATABASE_URL="postgresql://push_app_user:YourStrongPassword123!@185.161.209.188:5432/push_notification_db?sslmode=require"
```

## 8. Security Best Practices

### 8.1 Use Strong Passwords

```bash
# Generate a strong password
openssl rand -base64 32
```

### 8.2 Enable SSL/TLS (Recommended)

```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/14/main/postgresql.conf

# Add or modify:
ssl = on

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### 8.3 Restrict User Permissions

```sql
-- Connect as postgres superuser
sudo -u postgres psql -d push_notification_db

-- Revoke unnecessary permissions
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

-- Grant only what's needed
GRANT CREATE, USAGE ON SCHEMA public TO push_app_user;
```

### 8.4 Set up Automated Backups

```bash
# Create backup directory
sudo mkdir -p /var/backups/postgresql

# Create backup script
sudo nano /usr/local/bin/backup-postgres.sh
```

Add this content:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/postgresql"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="push_notification_db"

# Create backup
sudo -u postgres pg_dump $DB_NAME | gzip > $BACKUP_DIR/backup_$DB_NAME_$TIMESTAMP.sql.gz

# Remove backups older than 7 days
find $BACKUP_DIR -name "backup_$DB_NAME_*.sql.gz" -mtime +7 -delete
```

```bash
# Make executable and add to cron
sudo chmod +x /usr/local/bin/backup-postgres.sh
sudo crontab -e

# Add this line for daily backups at 2 AM:
0 2 * * * /usr/local/bin/backup-postgres.sh
```

## 9. Connection Strings for Different Environments

### Standard Connection String
```
postgresql://push_app_user:YourStrongPassword123!@185.161.209.188:5432/push_notification_db
```

### With SSL
```
postgresql://push_app_user:YourStrongPassword123!@185.161.209.188:5432/push_notification_db?sslmode=require
```

### Node.js (pg library)
```javascript
const config = {
  user: 'push_app_user',
  password: 'YourStrongPassword123!',
  host: '185.161.209.188',
  port: 5432,
  database: 'push_notification_db',
  ssl: {
    rejectUnauthorized: false
  }
}
```

### Prisma
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### TypeORM
```javascript
{
  type: "postgres",
  host: "185.161.209.188",
  port: 5432,
  username: "push_app_user",
  password: "YourStrongPassword123!",
  database: "push_notification_db",
  ssl: true
}
```

## 10. Troubleshooting

### Check PostgreSQL Logs
```bash
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Test Local Connection
```bash
sudo -u postgres psql -d push_notification_db
```

### Check Listening Ports
```bash
sudo ss -tlnp | grep 5432
```

### Check Active Connections
```sql
-- In PostgreSQL
SELECT pid, usename, application_name, client_addr, state 
FROM pg_stat_activity 
WHERE datname = 'push_notification_db';
```

### Common Issues

1. **Connection refused**
   - Check if PostgreSQL is running: `sudo systemctl status postgresql`
   - Verify firewall rules: `sudo ufw status`
   - Check listen_addresses in postgresql.conf

2. **Authentication failed**
   - Verify pg_hba.conf settings
   - Check username and password
   - Ensure user has connect privileges

3. **Timeout errors**
   - Check network connectivity: `ping 185.161.209.188`
   - Verify port is open: `telnet 185.161.209.188 5432`

## 11. Performance Tuning (Optional)

```bash
# Edit postgresql.conf for better performance
sudo nano /etc/postgresql/14/main/postgresql.conf

# Adjust these values based on your server specs:
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
```

## 12. Monitoring

### Install pg_stat_statements
```sql
-- As postgres superuser
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

### Monitor Slow Queries
```sql
SELECT query, calls, total_time, mean_time, max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## Security Checklist

- [ ] Changed default PostgreSQL password
- [ ] Created application-specific user (not using postgres superuser)
- [ ] Configured firewall rules
- [ ] Enabled SSL/TLS
- [ ] Set up automated backups
- [ ] Restricted database permissions
- [ ] Configured connection limits
- [ ] Enabled logging
- [ ] Regular security updates scheduled

## Next Steps

1. Run the database initialization from your local machine:
   ```bash
   npm run db:push
   npm run db:seed
   ```

2. Test the application with remote database

3. Monitor database performance and connections

4. Set up monitoring alerts for database health

Remember to keep your PostgreSQL server updated and monitor logs regularly for any suspicious activity.