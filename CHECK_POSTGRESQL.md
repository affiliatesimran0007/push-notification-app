# Check PostgreSQL Status on Ubuntu Server

## SSH into your server first:
```bash
ssh root@185.161.209.188
```

## Then run these commands to check PostgreSQL:

### 1. Check if PostgreSQL is installed
```bash
# Check PostgreSQL version
psql --version

# If not installed, install it:
sudo apt update
sudo apt install postgresql postgresql-contrib -y
```

### 2. Check if PostgreSQL service is running
```bash
# Check service status
sudo systemctl status postgresql

# If not running, start it:
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 3. Check PostgreSQL port
```bash
# Check if PostgreSQL is listening on port 5432
sudo ss -tlnp | grep 5432
# OR
sudo netstat -tlnp | grep 5432
```

### 4. Check PostgreSQL configuration
```bash
# Find PostgreSQL version
sudo -u postgres psql -c "SELECT version();"

# Check current databases
sudo -u postgres psql -l
```

### 5. Test local connection
```bash
# Try to connect as postgres user
sudo -u postgres psql

# If connected, you'll see:
# postgres=#

# Check databases:
\l

# Exit:
\q
```

### 6. Check if database exists
```bash
sudo -u postgres psql -c "\l" | grep push_notifications
```

### 7. Create database if it doesn't exist
```bash
# Create database
sudo -u postgres psql -c "CREATE DATABASE push_notifications;"

# Set password
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'YourStrongPassword123!';"
```

### 8. Check firewall
```bash
# Check if port 5432 is open
sudo ufw status | grep 5432

# If not open:
sudo ufw allow 5432/tcp
sudo ufw reload
```

### 9. Check PostgreSQL external access configuration
```bash
# Check listen_addresses
sudo grep listen_addresses /etc/postgresql/*/main/postgresql.conf

# Check authentication
sudo cat /etc/postgresql/*/main/pg_hba.conf | grep -v "^#" | grep -v "^$"
```

### 10. Quick test from outside (run this locally on your Mac)
```bash
# Test if port is reachable
nc -zv 185.161.209.188 5432

# Or use telnet
telnet 185.161.209.188 5432
```

## Expected outputs for working PostgreSQL:

1. **Service status**: Should show "active (running)"
2. **Port check**: Should show PostgreSQL listening on 0.0.0.0:5432 or :::5432
3. **Database list**: Should show "push_notifications" database
4. **Firewall**: Should show port 5432 as ALLOW
5. **External test**: Should show "Connection successful" or "Connected"

## If PostgreSQL is NOT installed:

Run this script to install and configure:
```bash
#!/bin/bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib -y

# Start and enable service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create user and database
sudo -u postgres psql <<EOF
ALTER USER postgres PASSWORD 'YourStrongPassword123!';
CREATE DATABASE push_notifications;
\q
EOF

# Configure for external access
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/*/main/postgresql.conf
echo "host all all 0.0.0.0/0 md5" | sudo tee -a /etc/postgresql/*/main/pg_hba.conf

# Restart PostgreSQL
sudo systemctl restart postgresql

# Open firewall
sudo ufw allow 5432/tcp
sudo ufw reload

echo "PostgreSQL setup complete!"
```