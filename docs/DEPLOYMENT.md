# 🚀 Deployment Guide

## Table of Contents
- [Deployment Overview](#deployment-overview)
- [Infrastructure Setup](#infrastructure-setup)
- [Environment Configuration](#environment-configuration)
- [Staging Deployment](#staging-deployment)
- [Production Deployment](#production-deployment)
- [Database Deployment](#database-deployment)
- [CDN & Assets](#cdn--assets)
- [Monitoring Setup](#monitoring-setup)
- [Backup Strategy](#backup-strategy)
- [Maintenance & Updates](#maintenance--updates)

## Deployment Overview

### Deployment Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Development   │ -> │     Staging     │ -> │   Production    │
│   localhost     │    │  staging.com    │    │ picksmart.com   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         |                       |                       |
         v                       v                       v
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Local MongoDB  │    │  Atlas Staging  │    │ Atlas Production│
│  Local Redis    │    │  Redis Cloud    │    │ Redis Cloud     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack
- **Frontend Hosting**: Vercel
- **Backend Hosting**: AWS ECS / DigitalOcean
- **Database**: MongoDB Atlas
- **Cache**: Redis Cloud
- **CDN**: Cloudflare
- **File Storage**: AWS S3
- **Monitoring**: Sentry + DataDog
- **CI/CD**: GitHub Actions

## Infrastructure Setup

### AWS Infrastructure (Production)

#### ECS Cluster Setup
```yaml
# docker-compose.production.yml
version: '3.8'
services:
  web:
    image: picksmart/web:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - api
    networks:
      - picksmart-network

  api:
    image: picksmart/api:latest
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    networks:
      - picksmart-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - web
      - api
    networks:
      - picksmart-network

networks:
  picksmart-network:
    driver: bridge
```

#### Nginx Configuration
```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream web_backend {
        server web:3000;
    }
    
    upstream api_backend {
        server api:3001;
    }
    
    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name picksmartstores.com www.picksmartstores.com;
        return 301 https://$server_name$request_uri;
    }
    
    # HTTPS Configuration
    server {
        listen 443 ssl http2;
        server_name picksmartstores.com www.picksmartstores.com;
        
        ssl_certificate /etc/ssl/certs/picksmartstores.com.crt;
        ssl_certificate_key /etc/ssl/private/picksmartstores.com.key;
        
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self'" always;
        
        # Frontend routes
        location / {
            proxy_pass http://web_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
        
        # API routes
        location /api/ {
            proxy_pass http://api_backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # CORS headers
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Authorization, Content-Type";
        }
        
        # Static assets caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            proxy_pass http://web_backend;
        }
    }
    
    # Arabic subdomain
    server {
        listen 443 ssl http2;
        server_name ar.picksmartstores.com;
        
        ssl_certificate /etc/ssl/certs/picksmartstores.com.crt;
        ssl_certificate_key /etc/ssl/private/picksmartstores.com.key;
        
        location / {
            proxy_pass http://web_backend;
            proxy_set_header Host $host;
            proxy_set_header Accept-Language "ar-QA,ar;q=0.9";
        }
    }
}
```

### MongoDB Atlas Setup
1. **Create Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create organization and project
   - Choose Qatar region (Middle East)

2. **Cluster Configuration**
   ```json
   {
     "clusterType": "REPLICASET",
     "mongoDBMajorVersion": "7.0",
     "providerSettings": {
       "providerName": "AWS",
       "regionName": "ME_SOUTH_1",
       "instanceSizeName": "M10"
     },
     "diskSizeGB": 10,
     "backupEnabled": true
   }
   ```

3. **Network Security**
   - Configure IP whitelist
   - Set up VPC peering (production)
   - Create database users

4. **Connection String**
   ```env
   DATABASE_URL="mongodb+srv://<username>:<password>@picksmart-cluster.me-south-1.mongodb.net/picksmart?retryWrites=true&w=majority"
   ```

### Redis Cloud Setup
1. **Create Redis Cloud Account**
2. **Configure Database**
   ```json
   {
     "name": "picksmart-cache",
     "region": "aws-me-south-1",
     "memoryLimitInGb": 1,
     "supportOSSClusterApi": false,
     "replication": true
   }
   ```

3. **Connection Details**
   ```env
   REDIS_URL="redis://:<password>@redis-12345.c123.me-south-1-1.ec2.cloud.redislabs.com:12345"
   ```

## Environment Configuration

### Production Environment Variables
```env
# App Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://picksmartstores.com
NEXT_PUBLIC_API_URL=https://api.picksmartstores.com/api/v1

# Database
DATABASE_URL="mongodb+srv://prod_user:secure_password@picksmart-prod.me-south-1.mongodb.net/picksmart"
REDIS_URL="redis://:secure_password@redis-prod.c123.me-south-1-1.ec2.cloud.redislabs.com:12345"

# Authentication
NEXTAUTH_SECRET="super-secure-production-secret-key-32-chars-min"
NEXTAUTH_URL="https://picksmartstores.com"
JWT_SECRET="secure-jwt-secret-for-api-authentication"

# Payment Gateways - Production Keys
TAP_SECRET_KEY="sk_live_your_actual_tap_secret_key"
TAP_PUBLIC_KEY="pk_live_your_actual_tap_public_key"
QPAY_MERCHANT_ID="actual_merchant_id"
QPAY_SECRET_KEY="actual_qpay_secret_key"
DIBSY_API_KEY="actual_dibsy_api_key"
STRIPE_SECRET_KEY="sk_live_your_actual_stripe_secret"
STRIPE_PUBLIC_KEY="pk_live_your_actual_stripe_public"

# Qatar Post API
QATAR_POST_API_KEY="actual_qatar_post_api_key"
QATAR_POST_ENDPOINT="https://api.qpost.qa"

# File Storage (AWS S3)
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="..."
AWS_S3_BUCKET="picksmart-production-assets"
AWS_REGION="me-south-1"
AWS_CLOUDFRONT_DOMAIN="d123456789.cloudfront.net"

# Email Service
SENDGRID_API_KEY="SG...."
SENDGRID_FROM_EMAIL="noreply@picksmartstores.com"

# SMS Gateway
SMS_GATEWAY_API_KEY="actual_sms_api_key"
SMS_GATEWAY_SENDER="PickSmart"

# External APIs
GOOGLE_ANALYTICS_ID="G-XXXXXXXXXX"
FACEBOOK_PIXEL_ID="123456789012345"

# Security
ENCRYPTION_KEY="32-byte-hex-encryption-key"
WEBHOOK_SECRET="webhook-signature-secret"

# Monitoring
SENTRY_DSN="https://abc123@sentry.io/123456"
DATADOG_API_KEY="your_datadog_api_key"
```

### Staging Environment Variables
```env
# Similar to production but with staging/test values
NODE_ENV=staging
NEXT_PUBLIC_APP_URL=https://staging.picksmartstores.com
NEXT_PUBLIC_API_URL=https://staging-api.picksmartstores.com/api/v1

# Use sandbox/test payment gateway keys
TAP_SECRET_KEY="sk_test_..."
QPAY_MERCHANT_ID="test_merchant_id"
# ... other staging configurations
```

## Staging Deployment

### GitHub Actions Workflow
```yaml
# .github/workflows/staging.yml
name: Deploy to Staging

on:
  push:
    branches: [develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:all
      
      - name: Build application
        run: npm run build

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel Staging
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod --confirm'
          working-directory: ./apps/web
      
      - name: Deploy API to Staging
        run: |
          echo "${{ secrets.STAGING_DEPLOY_KEY }}" > deploy_key
          chmod 600 deploy_key
          ssh -i deploy_key -o StrictHostKeyChecking=no user@staging-server.com "
            cd /opt/picksmart-api &&
            git pull origin develop &&
            npm ci --production &&
            npm run build &&
            pm2 restart picksmart-api
          "
      
      - name: Run staging tests
        run: |
          sleep 30 # Wait for deployment
          npm run test:e2e:staging
```

### Manual Staging Deployment
```bash
# 1. Build and test locally
npm run build
npm run test:all

# 2. Deploy frontend to Vercel
vercel --prod --confirm

# 3. Deploy API to staging server
ssh user@staging-server.com
cd /opt/picksmart-api
git pull origin develop
npm ci --production
npm run build
pm2 restart picksmart-api

# 4. Run database migrations
npm run db:migrate:staging

# 5. Verify deployment
curl -f https://staging.picksmartstores.com/health
curl -f https://staging-api.picksmartstores.com/api/v1/health
```

## Production Deployment

### Production Deployment Workflow
```yaml
# .github/workflows/production.yml
name: Deploy to Production

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run security audit
        run: npm audit --audit-level high
      
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        with:
          args: --severity-threshold=high

  deploy-production:
    needs: [test, security-scan]
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Create deployment
        uses: actions/github-script@v6
        with:
          script: |
            const deployment = await github.rest.repos.createDeployment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              ref: context.sha,
              environment: 'production',
              description: 'Production deployment'
            });
      
      - name: Deploy to Production
        run: |
          # Build and deploy steps
          npm ci
          npm run build
          
          # Deploy to production servers
          docker build -t picksmart/web:${{ github.sha }} ./apps/web
          docker build -t picksmart/api:${{ github.sha }} ./apps/api
          
          # Push to container registry
          docker push picksmart/web:${{ github.sha }}
          docker push picksmart/api:${{ github.sha }}
          
          # Update production deployment
          kubectl set image deployment/picksmart-web web=picksmart/web:${{ github.sha }}
          kubectl set image deployment/picksmart-api api=picksmart/api:${{ github.sha }}
      
      - name: Run smoke tests
        run: |
          npm run test:smoke:production
```

### Blue-Green Deployment Strategy
```bash
# 1. Deploy to green environment
kubectl apply -f k8s/green-deployment.yaml

# 2. Wait for green environment to be ready
kubectl rollout status deployment/picksmart-green

# 3. Run health checks
curl -f https://green.picksmartstores.com/health

# 4. Switch traffic to green
kubectl patch service picksmart-service -p '{"spec":{"selector":{"version":"green"}}}'

# 5. Monitor for issues
sleep 300

# 6. Cleanup blue environment (if successful)
kubectl delete deployment picksmart-blue
```

## Database Deployment

### Migration Strategy
```typescript
// Database migration script
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  console.log('Starting database migration...');
  
  try {
    // 1. Backup current database
    console.log('Creating backup...');
    await createBackup();
    
    // 2. Run migrations
    console.log('Running migrations...');
    await prisma.$executeRaw`SET session_replication_role = replica;`;
    
    // Run actual migrations
    await runMigrations();
    
    await prisma.$executeRaw`SET session_replication_role = DEFAULT;`;
    
    // 3. Verify data integrity
    console.log('Verifying data integrity...');
    await verifyDataIntegrity();
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    
    // Rollback if needed
    await rollbackMigration();
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function createBackup() {
  // Implementation for MongoDB backup
  const backupCommand = `mongodump --uri="${process.env.DATABASE_URL}" --out=./backup-${Date.now()}`;
  await execAsync(backupCommand);
}
```

### Database Deployment Script
```bash
#!/bin/bash
# deploy-db.sh

set -e

echo "Starting database deployment..."

# 1. Create backup
echo "Creating backup..."
mongodump --uri="$PRODUCTION_DB_URL" --out="./backup-$(date +%Y%m%d_%H%M%S)"

# 2. Test migration on copy
echo "Testing migration..."
node scripts/test-migration.js

# 3. Run actual migration
echo "Running production migration..."
npx prisma migrate deploy

# 4. Verify migration
echo "Verifying migration..."
node scripts/verify-migration.js

echo "Database deployment completed successfully"
```

## CDN & Assets

### AWS CloudFront Setup
```json
{
  "Distribution": {
    "CallerReference": "picksmart-assets-2024",
    "Comment": "Picksmart Stores CDN",
    "DefaultRootObject": "index.html",
    "Origins": [
      {
        "Id": "S3-picksmart-assets",
        "DomainName": "picksmart-production-assets.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": "origin-access-identity/cloudfront/E123456789"
        }
      }
    ],
    "DefaultCacheBehavior": {
      "TargetOriginId": "S3-picksmart-assets",
      "ViewerProtocolPolicy": "redirect-to-https",
      "CachePolicyId": "cache-optimized",
      "OriginRequestPolicyId": "CORS-S3Origin",
      "Compress": true
    },
    "CacheBehaviors": [
      {
        "PathPattern": "/api/*",
        "TargetOriginId": "API-origin",
        "ViewerProtocolPolicy": "https-only",
        "CachePolicyId": "no-cache",
        "TTL": 0
      }
    ],
    "Enabled": true,
    "PriceClass": "PriceClass_100"
  }
}
```

### Asset Optimization Pipeline
```bash
# Asset optimization script
#!/bin/bash

echo "Optimizing assets..."

# 1. Compress images
find ./public/images -name "*.jpg" -o -name "*.jpeg" | xargs jpegoptim --strip-all --max=85
find ./public/images -name "*.png" | xargs optipng -o5

# 2. Generate WebP versions
find ./public/images -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" | \
  xargs -I {} sh -c 'cwebp -q 85 "$1" -o "${1%.*}.webp"' _ {}

# 3. Upload to S3
aws s3 sync ./public/images s3://picksmart-production-assets/images/ \
  --cache-control "max-age=31536000" \
  --metadata-directive REPLACE

# 4. Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E123456789 \
  --paths "/images/*"

echo "Asset optimization completed"
```

## Monitoring Setup

### Sentry Configuration
```typescript
// sentry.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  
  // Error filtering
  beforeSend(event) {
    // Filter out non-critical errors
    if (event.exception) {
      const error = event.exception.values?.[0];
      if (error?.type === 'ChunkLoadError') {
        return null; // Don't send chunk load errors
      }
    }
    return event;
  },
  
  // Performance monitoring
  integrations: [
    new Sentry.BrowserTracing({
      tracingOrigins: ['picksmartstores.com', 'api.picksmartstores.com'],
    }),
  ],
});
```

### DataDog Monitoring
```typescript
// monitoring/datadog.ts
import { StatsD } from 'node-statsd';

const statsd = new StatsD({
  host: 'statsd.datadoghq.com',
  port: 8125,
  prefix: 'picksmart.',
  globalTags: [
    `env:${process.env.NODE_ENV}`,
    'service:api'
  ]
});

export const metrics = {
  increment: (metric: string, tags?: string[]) => {
    statsd.increment(metric, 1, tags);
  },
  
  histogram: (metric: string, value: number, tags?: string[]) => {
    statsd.histogram(metric, value, tags);
  },
  
  timing: (metric: string, time: number, tags?: string[]) => {
    statsd.timing(metric, time, tags);
  }
};

// Usage in API routes
export const withMetrics = (handler: Function) => {
  return async (req: Request, res: Response) => {
    const start = Date.now();
    
    try {
      const result = await handler(req, res);
      
      metrics.timing('api.response_time', Date.now() - start, [
        `endpoint:${req.route?.path}`,
        `method:${req.method}`,
        `status:${res.statusCode}`
      ]);
      
      metrics.increment('api.requests', [
        `endpoint:${req.route?.path}`,
        `method:${req.method}`,
        `status:${res.statusCode}`
      ]);
      
      return result;
    } catch (error) {
      metrics.increment('api.errors', [
        `endpoint:${req.route?.path}`,
        `method:${req.method}`
      ]);
      throw error;
    }
  };
};
```

### Health Checks
```typescript
// Health check endpoints
export async function healthCheck() {
  const checks = {
    database: false,
    redis: false,
    payments: false,
    storage: false
  };
  
  try {
    // Database check
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (error) {
    console.error('Database health check failed:', error);
  }
  
  try {
    // Redis check
    await redis.ping();
    checks.redis = true;
  } catch (error) {
    console.error('Redis health check failed:', error);
  }
  
  try {
    // Payment gateway check
    await tapPayments.healthCheck();
    checks.payments = true;
  } catch (error) {
    console.error('Payment gateway health check failed:', error);
  }
  
  try {
    // S3 storage check
    await s3.headBucket({ Bucket: process.env.AWS_S3_BUCKET }).promise();
    checks.storage = true;
  } catch (error) {
    console.error('Storage health check failed:', error);
  }
  
  const allHealthy = Object.values(checks).every(Boolean);
  
  return {
    status: allHealthy ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString()
  };
}
```

## Backup Strategy

### Database Backup
```bash
#!/bin/bash
# backup-database.sh

BACKUP_DIR="/opt/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="picksmart_backup_$DATE"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create MongoDB backup
mongodump --uri="$PRODUCTION_DB_URL" --out="$BACKUP_DIR/$BACKUP_NAME"

# Compress backup
tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" -C "$BACKUP_DIR" "$BACKUP_NAME"

# Upload to S3
aws s3 cp "$BACKUP_DIR/$BACKUP_NAME.tar.gz" "s3://picksmart-backups/database/"

# Clean up local files
rm -rf "$BACKUP_DIR/$BACKUP_NAME"
rm "$BACKUP_DIR/$BACKUP_NAME.tar.gz"

# Keep only last 30 days of backups
aws s3 ls s3://picksmart-backups/database/ | \
  grep "picksmart_backup_" | \
  sort -k1,2 | \
  head -n -30 | \
  awk '{print $4}' | \
  xargs -I {} aws s3 rm "s3://picksmart-backups/database/{}"

echo "Database backup completed: $BACKUP_NAME"
```

### Automated Backup Schedule
```yaml
# k8s/backup-cronjob.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: database-backup
spec:
  schedule: "0 2 * * *" # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: picksmart/backup:latest
            command:
            - /bin/bash
            - /scripts/backup-database.sh
            env:
            - name: PRODUCTION_DB_URL
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: url
          restartPolicy: OnFailure
```

## Maintenance & Updates

### Zero-Downtime Deployment
```bash
#!/bin/bash
# zero-downtime-deploy.sh

set -e

echo "Starting zero-downtime deployment..."

# 1. Deploy to secondary servers
kubectl apply -f k8s/deployment-v2.yaml

# 2. Wait for new version to be ready
kubectl rollout status deployment/picksmart-v2

# 3. Run health checks
curl -f https://v2.picksmartstores.com/health

# 4. Gradually shift traffic
for i in {10..100..10}; do
  echo "Shifting $i% traffic to new version..."
  kubectl patch service picksmart-service -p "{\"spec\":{\"selector\":{\"version\":\"v2\"},\"traffic\":$i}}"
  sleep 60
  
  # Monitor error rates
  ERROR_RATE=$(curl -s "https://api.datadog.com/api/v1/query?query=avg:api.error_rate" | jq '.series[0].pointlist[-1][1]')
  if (( $(echo "$ERROR_RATE > 0.05" | bc -l) )); then
    echo "Error rate too high, rolling back..."
    kubectl patch service picksmart-service -p '{"spec":{"selector":{"version":"v1"}}}'
    exit 1
  fi
done

# 5. Complete deployment
kubectl delete deployment picksmart-v1

echo "Zero-downtime deployment completed successfully"
```

### Update Procedures
```bash
# Security updates
npm audit fix
npm run test:all
npm run build

# Dependency updates
npm update
npm run test:all
npm run build

# Database maintenance
node scripts/db-maintenance.js

# Cache cleanup
redis-cli FLUSHDB

# Log rotation
logrotate /etc/logrotate.d/picksmart
```

### Rollback Procedures
```bash
#!/bin/bash
# rollback.sh

PREVIOUS_VERSION=$1

if [ -z "$PREVIOUS_VERSION" ]; then
  echo "Usage: ./rollback.sh <previous_version>"
  exit 1
fi

echo "Rolling back to version $PREVIOUS_VERSION..."

# 1. Rollback application
kubectl rollout undo deployment/picksmart-web --to-revision=$PREVIOUS_VERSION
kubectl rollout undo deployment/picksmart-api --to-revision=$PREVIOUS_VERSION

# 2. Rollback database (if needed)
# node scripts/rollback-migration.js $PREVIOUS_VERSION

# 3. Clear caches
redis-cli FLUSHALL

# 4. Verify rollback
curl -f https://picksmartstores.com/health

echo "Rollback completed to version $PREVIOUS_VERSION"
```

This comprehensive deployment guide ensures reliable, secure, and scalable deployment of the Picksmart Stores platform to both staging and production environments. 