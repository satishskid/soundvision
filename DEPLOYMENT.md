# Deployment Guide - Health Screener PWA

This guide covers deploying the Health Screener PWA to production.

## Prerequisites

- Node.js 18+ installed
- MySQL database (8.0+)
- Domain name with SSL certificate
- OAuth server credentials
- Email service for notifications (optional)

## Environment Setup

### 1. Database Setup

Create a MySQL database:

```sql
CREATE DATABASE health_screener CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'health_user'@'%' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON health_screener.* TO 'health_user'@'%';
FLUSH PRIVILEGES;
```

### 2. Environment Variables

Create a `.env` file in the project root:

```bash
# Application
VITE_APP_ID=your_app_id
VITE_APP_TITLE="Health Screener PWA"
VITE_APP_LOGO="https://yourdomain.com/logo.png"

# OAuth
VITE_OAUTH_PORTAL_URL=https://your-oauth-portal.com
OAUTH_SERVER_URL=https://your-oauth-server.com
JWT_SECRET=generate_a_secure_random_string_here

# Database
DATABASE_URL=mysql://health_user:secure_password@your-db-host:3306/health_screener

# Server
PORT=3000
NODE_ENV=production

# Admin
OWNER_ID=your_first_admin_user_id

# Analytics (optional)
VITE_ANALYTICS_ENDPOINT=https://your-analytics-server.com
VITE_ANALYTICS_WEBSITE_ID=your_website_id

# OpenAI (optional - for future AI features)
OPENAI_API_URL=https://api.openai.com/v1
OPENAI_API_KEY=your_openai_key
```

### 3. Generate Secure Secrets

```bash
# JWT Secret (use a strong random string)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Deployment Options

### Option 1: Single Server Deployment

#### Install Dependencies

```bash
pnpm install --frozen-lockfile
```

#### Build Application

```bash
pnpm build
```

#### Run Database Migrations

```bash
pnpm db:push
```

#### Start Production Server

```bash
pnpm start
```

#### Setup Process Manager (PM2)

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start dist/index.js --name health-screener

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Option 2: Containerized Deployment (Docker)

#### Create Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:18-alpine

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

#### Create docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=mysql://health_user:password@db:3306/health_screener
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=rootpassword
      - MYSQL_DATABASE=health_screener
      - MYSQL_USER=health_user
      - MYSQL_PASSWORD=password
    volumes:
      - mysql_data:/var/lib/mysql
    restart: unless-stopped

volumes:
  mysql_data:
```

#### Deploy with Docker

```bash
docker-compose up -d
```

### Option 3: Cloud Platform Deployment

#### Vercel (Frontend Only)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Set build command: `pnpm build`
4. Set output directory: `dist`
5. Deploy

#### Railway (Full Stack)

1. Connect your GitHub repository to Railway
2. Add MySQL database service
3. Configure environment variables
4. Railway will auto-detect and deploy

#### AWS/GCP/Azure

Follow platform-specific guides for Node.js applications.

## Nginx Configuration

### Reverse Proxy Setup

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval';" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service worker
    location /sw.js {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "no-cache";
    }

    # Manifest
    location /manifest.json {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "no-cache";
    }
}
```

## SSL Certificate Setup

### Using Let's Encrypt (Certbot)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal (already configured by certbot)
sudo certbot renew --dry-run
```

## Database Backup

### Automated Backup Script

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/health_screener"
DB_NAME="health_screener"
DB_USER="health_user"
DB_PASS="your_password"

mkdir -p $BACKUP_DIR

mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 30 days of backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
```

### Setup Cron Job

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/backup.sh
```

## Monitoring

### Health Check Endpoint

The application exposes a health check at `/api/health`:

```bash
curl https://yourdomain.com/api/health
```

### Uptime Monitoring

Use services like:
- UptimeRobot
- Pingdom
- StatusCake

### Application Monitoring

Consider using:
- Sentry for error tracking
- New Relic for performance monitoring
- DataDog for infrastructure monitoring

## Security Checklist

- [ ] SSL certificate installed and configured
- [ ] Environment variables secured (not in version control)
- [ ] Database credentials rotated regularly
- [ ] JWT secret is strong and unique
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Database backups automated
- [ ] Firewall rules configured
- [ ] Regular security updates scheduled

## Performance Optimization

### Database Indexing

```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription ON users(subscriptionStatus, subscriptionTier);
CREATE INDEX idx_vision_sessions_user ON vision_screening_sessions(userId, sessionDate);
CREATE INDEX idx_hearing_sessions_user ON hearing_screening_sessions(userId, sessionDate);
CREATE INDEX idx_access_requests_status ON access_requests(status, createdAt);
```

### CDN Configuration

Use a CDN for static assets:
- Cloudflare
- AWS CloudFront
- Fastly

### Caching Strategy

- Enable Redis for session caching (optional)
- Configure browser caching headers
- Implement API response caching where appropriate

## Scaling Considerations

### Horizontal Scaling

- Use load balancer (Nginx, HAProxy, AWS ALB)
- Deploy multiple application instances
- Use shared session store (Redis)
- Configure sticky sessions if needed

### Database Scaling

- Read replicas for read-heavy operations
- Connection pooling
- Query optimization
- Consider database sharding for very large datasets

## Troubleshooting

### Common Issues

**Database Connection Errors**
```bash
# Check database connectivity
mysql -h your-db-host -u health_user -p health_screener

# Verify DATABASE_URL format
echo $DATABASE_URL
```

**Port Already in Use**
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

**Permission Errors**
```bash
# Ensure proper file permissions
chmod -R 755 /path/to/app
chown -R appuser:appuser /path/to/app
```

## Rollback Procedure

1. Stop the application
2. Restore previous version from git
3. Restore database backup if needed
4. Restart application
5. Verify functionality

```bash
# Example rollback
pm2 stop health-screener
git checkout <previous-commit>
pnpm install
pnpm build
pm2 restart health-screener
```

## Support

For deployment assistance:
- Documentation: https://docs.healthscreener.app
- Email: devops@healthscreener.app
- Emergency: +1-XXX-XXX-XXXX

---

**Last Updated**: January 2024
