import { log } from './logger';
import { healthCheck } from './datadog';
import { checkWebhookHealth } from './webhook-monitor';
import * as Sentry from '@sentry/node';
import { PrismaClient } from '@prisma/client';

// Health check constants for better maintainability
const HEALTH_CHECK_CONSTANTS = {
  DB_SLOW_RESPONSE_THRESHOLD: 1000, // 1 second
  MEMORY_DEGRADED_THRESHOLD: 80, // 80% heap usage
  MEMORY_UNHEALTHY_THRESHOLD: 90, // 90% heap usage
  RSS_MEMORY_THRESHOLD: 1024, // 1GB in MB
  SHOPIFY_API_VERSION: '2024-04', // Configurable API version
} as const;

// Use centralized Prisma client to prevent connection leaks
let prisma: PrismaClient;

const getPrismaClient = () => {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
};

// Type-safe interfaces for health check results
interface ServiceDetails {
  [key: string]: unknown;
  productCount?: number;
  connectionPool?: string;
  recentEvents?: number;
  successRate?: number;
  averageProcessingTime?: number;
  issues?: string[];
  services?: ExternalServiceStatus[];
  memoryUsage?: {
    used: number;
    free: number;
    total: number;
  };
  cpuUsage?: number;
}

interface ExternalServiceStatus {
  name: string;
  status: 'healthy' | 'unhealthy';
  responseTime?: number;
  error?: string;
}

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  error?: string;
  details?: ServiceDetails;
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
      const client = getPrismaClient();
      
      // Simple connectivity and performance test - count products
      const productCount = await client.product.count();
      
      const responseTime = Date.now() - startTime;
      
      let status: 'healthy' | 'degraded' = 'healthy';
      if (responseTime > HEALTH_CHECK_CONSTANTS.DB_SLOW_RESPONSE_THRESHOLD) {
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
    const services: ExternalServiceStatus[] = [];

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
          const apiVersion = process.env.SHOPIFY_API_VERSION || HEALTH_CHECK_CONSTANTS.SHOPIFY_API_VERSION;
          const response = await fetch(`${process.env.SHOPIFY_STORE_URL}/admin/api/${apiVersion}/shop.json`, {
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
      
      // Check heap usage percentages using constants
      const heapUsagePercentage = (memoryUsageMB.heapUsed / memoryUsageMB.heapTotal) * 100;
      if (heapUsagePercentage > HEALTH_CHECK_CONSTANTS.MEMORY_UNHEALTHY_THRESHOLD) {
        status = 'unhealthy';
      } else if (heapUsagePercentage > HEALTH_CHECK_CONSTANTS.MEMORY_DEGRADED_THRESHOLD) {
        status = 'degraded';
      }

      // Check RSS memory usage
      if (memoryUsageMB.rss > HEALTH_CHECK_CONSTANTS.RSS_MEMORY_THRESHOLD) {
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
      const client = getPrismaClient();
      // Simple database connectivity check using count
      await client.product.count();
      
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
if (typeof require !== 'undefined' && require.main === module) {
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