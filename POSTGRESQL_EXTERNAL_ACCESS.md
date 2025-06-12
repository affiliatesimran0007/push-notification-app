# PostgreSQL External Access Setup for Vercel

## On Your Ubuntu Server (185.161.209.188)

### 1. Configure PostgreSQL to Accept External Connections

SSH into your server and run these commands:

```bash
# Edit PostgreSQL configuration
sudo nano /etc/postgresql/*/main/postgresql.conf
```

Find and change:
```
listen_addresses = 'localhost'
```
To:
```
listen_addresses = '*'
```

### 2. Configure Authentication

```bash
# Edit pg_hba.conf
sudo nano /etc/postgresql/*/main/pg_hba.conf
```

Add this line at the end:
```
# Allow connections from anywhere (for Vercel)
host    all             all             0.0.0.0/0               md5
```

### 3. Restart PostgreSQL

```bash
sudo systemctl restart postgresql
```

### 4. Configure Firewall

```bash
# Allow PostgreSQL port
sudo ufw allow 5432/tcp
sudo ufw reload
```

### 5. Set/Reset PostgreSQL Password

```bash
sudo -u postgres psql
```

In PostgreSQL prompt:
```sql
ALTER USER postgres PASSWORD 'your_secure_password';
\q
```

### 6. Create Database

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE push_notifications;
\q
```

## In Vercel Dashboard

Add this environment variable:

```
DATABASE_URL = postgresql://postgres:your_secure_password@185.161.209.188:5432/push_notifications?sslmode=disable
```

## Security Considerations

⚠️ **Warning**: Opening PostgreSQL to the internet has security risks. Consider:

1. **Use a strong password**
2. **Limit connections by IP** (if possible, get Vercel's IP range)
3. **Enable SSL** for encrypted connections
4. **Monitor access logs**

## Alternative: SSH Tunnel (More Secure)

If you want better security, consider using a service like:
- **Supabase** (free tier)
- **Neon** (free tier)
- **Railway** (free trial)

These services are designed for cloud deployments and have better security.

## Test Your Connection

After setup, test locally:
```bash
DATABASE_URL="postgresql://postgres:your_password@185.161.209.188:5432/push_notifications" node scripts/test-db-connection.js
```

If it works locally, it should work on Vercel!