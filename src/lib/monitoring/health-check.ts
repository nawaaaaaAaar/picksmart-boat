import { PrismaClient } from '@prisma/client';
import { log } from './logger';
import { healthCheck } from './datadog';
import { checkWebhookHealth } from './webhook-monitor';
import * as Sentry from '@sentry/node';

const prisma = new PrismaClient();

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  error?: string;
  details?: any;
}

interface SystemHealth {
  overall: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  checks: HealthCheckResult[];
}

export class HealthChecker {
  private static instance: HealthChecker;

  static getInstance(): HealthChecker {
    if (!HealthChecker.instance) {
      HealthChecker.instance = new HealthChecker();
    }
    return HealthChecker.instance;
  }

  // Perform all health checks
  async performHealthCheck(): Promise<SystemHealth> {
    const startTime = Date.now();
    const checks: HealthCheckResult[] = [];

    // Database health check
    checks.push(await this.checkDatabase());

    // Webhook system health check
    checks.push(await this.checkWebhookSystem());

    // External services health checks
    checks.push(await this.checkExternalServices());

    // Memory and performance checks
    checks.push(await this.checkSystemResources());

    // Determine overall health
    const hasUnhealthy = checks.some(check => check.status === 'unhealthy');
    const hasDegraded = checks.some(check => check.status === 'degraded');
    
    let overall: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (hasUnhealthy) {
      overall = 'unhealthy';
    } else if (hasDegraded) {
      overall = 'degraded';
    }

    const result: SystemHealth = {
      overall,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
    };

    // Log health status
    if (overall === 'unhealthy') {
      log.error('System health check failed', { healthResult: result });
      Sentry.captureMessage('System health check failed', 'error');
    } else if (overall === 'degraded') {
      log.warn('System health degraded', { healthResult: result });
    } else {
      log.debug('System health check passed', { healthResult: result });
    }

    // Record metrics for each service
    checks.forEach(check => {
      healthCheck.recordStatus(check.service, check.status === 'healthy', check.responseTime);
    });

    return result;
  }

  // Check database connectivity and performance
  private async checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Simple connectivity test
      await prisma.$queryRaw`SELECT 1`;
      
      // Performance test - count products
      const productCount = await prisma.product.count();
      
      const responseTime = Date.now() - startTime;
      
      let status: 'healthy' | 'degraded' = 'healthy';
      if (responseTime > 1000) { // 1 second
        status = 'degraded';
      }

      return {
        service: 'database',
        status,
        responseTime,
        details: {
          productCount,
          connectionPool: 'active', // Could add actual pool stats
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        service: 'database',
        status: 'unhealthy',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown database error',
      };
    }
  }

  // Check webhook system health
  private async checkWebhookSystem(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const webhookHealth = checkWebhookHealth();
      const responseTime = Date.now() - startTime;

      return {
        service: 'webhooks',
        status: webhookHealth.healthy ? 'healthy' : 'degraded',
        responseTime,
        details: {
          recentEvents: webhookHealth.stats.recentEvents,
          successRate: webhookHealth.stats.successRate,
          averageProcessingTime: webhookHealth.stats.averageProcessingTime,
          issues: webhookHealth.issues,
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        service: 'webhooks',
        status: 'unhealthy',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown webhook error',
      };
    }
  }

  // Check external services (payment gateways, APIs, etc.)
  private async checkExternalServices(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const services = [];

    try {
      // Check Stripe (if configured)
      if (process.env.STRIPE_SECRET_KEY) {
        try {
          // Simple API call to verify Stripe connectivity
          const response = await fetch('https://api.stripe.com/v1/payment_methods?limit=1', {
            headers: {
              'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
            },
          });
          
          services.push({
            name: 'stripe',
            status: response.ok ? 'healthy' : 'unhealthy',
            responseTime: Date.now() - startTime,
          });
        } catch {
          services.push({
            name: 'stripe',
            status: 'unhealthy',
            error: 'Connection failed',
          });
        }
      }

      // Check Shopify (if configured)
      if (process.env.SHOPIFY_STORE_URL && process.env.SHOPIFY_ACCESS_TOKEN) {
        try {
          const response = await fetch(`${process.env.SHOPIFY_STORE_URL}/admin/api/2024-01/shop.json`, {
            headers: {
              'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
            },
          });
          
          services.push({
            name: 'shopify',
            status: response.ok ? 'healthy' : 'unhealthy',
            responseTime: Date.now() - startTime,
          });
        } catch {
          services.push({
            name: 'shopify',
            status: 'unhealthy',
            error: 'Connection failed',
          });
        }
      }

      const responseTime = Date.now() - startTime;
      const hasUnhealthy = services.some(s => s.status === 'unhealthy');
      
      return {
        service: 'external_services',
        status: hasUnhealthy ? 'degraded' : 'healthy',
        responseTime,
        details: { services },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        service: 'external_services',
        status: 'unhealthy',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown external service error',
      };
    }
  }

  // Check system resources (memory, CPU, etc.)
  private async checkSystemResources(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      // Convert bytes to MB
      const memoryUsageMB = {
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
      };

      // Determine status based on memory usage
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      // If heap usage is over 80% of heap total
      const heapUsagePercentage = (memoryUsageMB.heapUsed / memoryUsageMB.heapTotal) * 100;
      if (heapUsagePercentage > 90) {
        status = 'unhealthy';
      } else if (heapUsagePercentage > 80) {
        status = 'degraded';
      }

      // If RSS is over 1GB, consider degraded
      if (memoryUsageMB.rss > 1024) {
        status = status === 'healthy' ? 'degraded' : status;
      }

      const responseTime = Date.now() - startTime;

      return {
        service: 'system_resources',
        status,
        responseTime,
        details: {
          memory: memoryUsageMB,
          heapUsagePercentage: Math.round(heapUsagePercentage),
          uptime: process.uptime(),
          nodeVersion: process.version,
          platform: process.platform,
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        service: 'system_resources',
        status: 'unhealthy',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown system resource error',
      };
    }
  }

  // Quick health check (for load balancer health checks)
  async quickHealthCheck(): Promise<{ status: 'ok' | 'error'; timestamp: string }> {
    try {
      // Just check database connectivity
      await prisma.$queryRaw`SELECT 1`;
      
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      log.error('Quick health check failed', { error });
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Get health check for specific service
  async checkSpecificService(serviceName: string): Promise<HealthCheckResult> {
    switch (serviceName) {
      case 'database':
        return this.checkDatabase();
      case 'webhooks':
        return this.checkWebhookSystem();
      case 'external_services':
        return this.checkExternalServices();
      case 'system_resources':
        return this.checkSystemResources();
      default:
        return {
          service: serviceName,
          status: 'unhealthy',
          error: 'Unknown service',
        };
    }
  }
}

// Export singleton instance
export const healthChecker = HealthChecker.getInstance();

// Export utility functions
export const performHealthCheck = () => healthChecker.performHealthCheck();
export const quickHealthCheck = () => healthChecker.quickHealthCheck();
export const checkService = (serviceName: string) => healthChecker.checkSpecificService(serviceName);

// CLI script for manual health checks
if (require.main === module) {
  healthChecker.performHealthCheck()
    .then(result => {
      console.log('🏥 Health Check Results');
      console.log('======================');
      console.log(`Overall Status: ${result.overall.toUpperCase()}`);
      console.log(`Timestamp: ${result.timestamp}`);
      console.log(`Uptime: ${Math.round(result.uptime)}s`);
      console.log();
      
      result.checks.forEach(check => {
        const statusIcon = check.status === 'healthy' ? '✅' : 
                          check.status === 'degraded' ? '⚠️' : '❌';
        console.log(`${statusIcon} ${check.service}: ${check.status.toUpperCase()}`);
        
        if (check.responseTime) {
          console.log(`   Response Time: ${check.responseTime}ms`);
        }
        
        if (check.error) {
          console.log(`   Error: ${check.error}`);
        }
        
        if (check.details) {
          console.log(`   Details: ${JSON.stringify(check.details, null, 2)}`);
        }
        console.log();
      });
      
      process.exit(result.overall === 'unhealthy' ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Health check failed:', error);
      process.exit(1);
    });
} 