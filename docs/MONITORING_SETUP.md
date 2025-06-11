# 📊 Monitoring System Setup Guide

This guide explains how to set up and use the comprehensive monitoring system for Picksmart Stores.

## 🎯 Overview

The monitoring system includes:
- **Sentry**: Error tracking and performance monitoring
- **DataDog**: APM, metrics, and infrastructure monitoring
- **Winston**: Structured logging
- **Webhook Monitoring**: Real-time webhook failure tracking and alerts
- **Health Checks**: System health monitoring
- **Dashboard**: Real-time monitoring dashboard

## 🔧 Setup Instructions

### 1. Install Dependencies

The monitoring dependencies are already included in `package.json`:

```bash
npm install
```

### 2. Environment Configuration

Copy and update your environment variables:

```bash
cp env.example .env
```

Update the monitoring section in `.env`:

```bash
# Monitoring & Error Tracking
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"
SENTRY_ORG="your-sentry-org"
SENTRY_PROJECT="your-sentry-project"
SENTRY_AUTH_TOKEN="your-sentry-auth-token"

# DataDog APM
DD_API_KEY="your-datadog-api-key"
DD_APP_KEY="your-datadog-app-key"
DD_SITE="datadoghq.com"
DD_SERVICE="picksmart-stores"
DD_ENV="production"
DD_VERSION="1.0.0"
DD_TRACE_ENABLED="true"

# Webhook Monitoring
WEBHOOK_MONITORING_ENABLED="true"
WEBHOOK_ALERT_EMAIL="picksmartstores@gmail.com.com"
WEBHOOK_FAILURE_THRESHOLD="5"
WEBHOOK_RETRY_ATTEMPTS="3"
```

### 3. Sentry Setup

1. **Create Sentry Account**: Sign up at [sentry.io](https://sentry.io)
2. **Create Project**: Choose "Next.js" as platform
3. **Get DSN**: Copy the DSN from project settings
4. **Configure Webhooks**: Set up Sentry webhooks for alerts

### 4. DataDog Setup

1. **Create DataDog Account**: Sign up at [datadoghq.com](https://datadoghq.com)
2. **Get API Keys**: From Organization Settings → API Keys
3. **Install DataDog Agent** (for production servers):
   ```bash
   DD_API_KEY=your-api-key bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script.sh)"
   ```

### 5. Deploy Configuration

The monitoring system is automatically configured when you deploy. For production:

1. Set all environment variables in your hosting platform
2. Ensure DataDog agent is running on your servers
3. Configure log forwarding to your logging service

## 🚀 Usage

### Monitoring Dashboard

Access the monitoring dashboard at:
```
https://www.picksmartstores.com/admin/monitoring
```

Features:
- Real-time system health status
- Webhook activity monitoring
- Recent webhook events
- Performance metrics
- Quick actions and API endpoints

### Health Check Endpoints

#### Quick Health Check (Load Balancer)
```bash
GET /api/monitoring/health?quick=true
```
Returns: `{ "status": "ok", "timestamp": "..." }`

#### Full Health Check
```bash
GET /api/monitoring/health
```
Returns comprehensive system health data.

#### Webhook Monitoring
```bash
# Get webhook statistics
GET /api/monitoring/webhooks?action=stats

# Get recent webhook events
GET /api/monitoring/webhooks?action=recent&limit=50

# Get webhook health status
GET /api/monitoring/webhooks?action=health
```

### CLI Commands

#### Health Check
```bash
npm run monitor:health
```

#### Webhook Monitoring
```bash
npm run monitor:webhooks
```

### Manual Monitoring

#### Check System Health
```typescript
import { performHealthCheck } from '@/lib/monitoring/health-check';

const health = await performHealthCheck();
console.log(health);
```

#### Record Custom Metrics
```typescript
import { metrics } from '@/lib/monitoring/datadog';

// Record business metrics
metrics.business.orderCreated(150.00, 'USD');
metrics.business.productViewed('product-123', 'electronics');

// Record API metrics
metrics.api.request('GET', '/api/products', 200, 150);

// Record custom metrics
metrics.increment('custom.metric', 1, ['tag:value']);
metrics.timing('custom.timing', 1500, ['operation:database']);
```

#### Custom Logging
```typescript
import { log } from '@/lib/monitoring/logger';

// Standard logging
log.info('Operation completed', { userId: '123', operation: 'checkout' });
log.error('Operation failed', { error: 'Payment declined' }, error);

// Specialized logging
log.webhook('products/create', webhookData, 'success');
log.migration('products', { count: 150 }, 'success');
log.database('SELECT * FROM products', 250);
log.api('GET', '/api/products', 200, 150, 'user-123');
```

## 📈 Monitoring Best Practices

### 1. Error Tracking
- All errors are automatically sent to Sentry
- Add custom error context for better debugging
- Set up Sentry alerts for critical errors

### 2. Performance Monitoring
- Monitor API response times
- Track database query performance
- Monitor webhook processing times
- Set up alerts for performance degradation

### 3. Business Metrics
- Track e-commerce KPIs (orders, revenue, conversions)
- Monitor user engagement metrics
- Set up business alerts (low sales, high cart abandonment)

### 4. Infrastructure Monitoring
- Monitor system resources (CPU, memory, disk)
- Track database connection pools
- Monitor external service dependencies

### 5. Webhook Monitoring
- Track webhook success rates
- Monitor processing times
- Set up failure alerts
- Implement retry mechanisms

## 🔍 Troubleshooting

### Common Issues

#### 1. Sentry Not Receiving Errors
- Check `SENTRY_DSN` is correctly set
- Verify Sentry configuration files exist
- Check network connectivity to Sentry

#### 2. DataDog Metrics Not Appearing
- Verify `DD_API_KEY` is correct
- Check DataDog agent is running (production)
- Ensure firewall allows DataDog traffic

#### 3. Webhook Monitoring Not Working
- Check `WEBHOOK_MONITORING_ENABLED=true`
- Verify webhook handlers are calling monitoring functions
- Check logs for monitoring errors

#### 4. Health Checks Failing
- Check database connectivity
- Verify external service configurations
- Review system resource usage

### Log Locations

Development:
- Console output
- `logs/combined.log`
- `logs/error.log`

Production:
- Application logs (stdout/stderr)
- DataDog logs (if configured)
- Sentry error reports

## 📊 Monitoring Checklist

### Pre-Production
- [ ] All environment variables configured
- [ ] Sentry project created and DSN set
- [ ] DataDog account setup and API key configured
- [ ] Health check endpoints tested
- [ ] Monitoring dashboard accessible
- [ ] Webhook monitoring enabled

### Production
- [ ] DataDog agent installed and running
- [ ] Log forwarding configured
- [ ] Alert thresholds set
- [ ] Monitoring dashboard accessible
- [ ] Error alerts configured
- [ ] Performance alerts configured
- [ ] Business metric alerts configured

### Ongoing Maintenance
- [ ] Review monitoring reports weekly
- [ ] Update alert thresholds based on usage
- [ ] Archive old logs regularly
- [ ] Review and update error tracking
- [ ] Monitor system performance trends

## 🔔 Alert Configuration

### Sentry Alerts
- Critical errors: Immediate notification
- High error rate: 5-minute threshold
- New error types: Daily digest

### DataDog Alerts
- API response time > 2s: Warning
- API response time > 5s: Critical
- Error rate > 5%: Warning
- Error rate > 10%: Critical
- Memory usage > 80%: Warning
- Memory usage > 90%: Critical

### Webhook Alerts
- Failure count > 5: Warning
- Success rate < 95%: Warning
- Processing time > 5s: Warning

## 📞 Support

For monitoring issues:
1. Check the troubleshooting section above
2. Review logs in the monitoring dashboard
3. Check Sentry and DataDog for specific errors
4. Review system resources and external dependencies

Remember: Good monitoring is essential for maintaining a reliable e-commerce platform! 