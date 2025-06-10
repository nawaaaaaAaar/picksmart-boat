import { StatsD } from 'hot-shots';

// Initialize DataDog StatsD client
const statsd = new StatsD({
  host: process.env.DD_AGENT_HOST || 'localhost',
  port: parseInt(process.env.DD_DOGSTATSD_PORT || '8125'),
  prefix: 'picksmart.',
  globalTags: {
    service: process.env.DD_SERVICE || 'picksmart-stores',
    env: process.env.DD_ENV || process.env.NODE_ENV || 'development',
    version: process.env.DD_VERSION || '1.0.0',
  },
});

// DataDog metrics interface
export const metrics = {
  // Counter metrics
  increment: (metric: string, value: number = 1, tags?: string[]) => {
    statsd.increment(metric, value, tags);
  },
  
  decrement: (metric: string, value: number = 1, tags?: string[]) => {
    statsd.decrement(metric, value, tags);
  },
  
  // Gauge metrics (current value)
  gauge: (metric: string, value: number, tags?: string[]) => {
    statsd.gauge(metric, value, tags);
  },
  
  // Timing metrics
  timing: (metric: string, value: number, tags?: string[]) => {
    statsd.timing(metric, value, tags);
  },
  
  // Histogram metrics
  histogram: (metric: string, value: number, tags?: string[]) => {
    statsd.histogram(metric, value, tags);
  },
  
  // Application-specific metrics
  webhook: {
    received: (webhookType: string, success: boolean = true) => {
      metrics.increment('webhook.received', 1, [
        `webhook_type:${webhookType}`,
        `success:${success}`,
      ]);
    },
    
    processingTime: (webhookType: string, duration: number) => {
      metrics.timing('webhook.processing_time', duration, [
        `webhook_type:${webhookType}`,
      ]);
    },
    
    error: (webhookType: string, errorType: string) => {
      metrics.increment('webhook.error', 1, [
        `webhook_type:${webhookType}`,
        `error_type:${errorType}`,
      ]);
    },
  },
  
  database: {
    query: (operation: string, duration: number, success: boolean = true) => {
      metrics.timing('database.query.duration', duration, [
        `operation:${operation}`,
        `success:${success}`,
      ]);
      
      metrics.increment('database.query.count', 1, [
        `operation:${operation}`,
        `success:${success}`,
      ]);
    },
    
    connection: {
      active: (count: number) => {
        metrics.gauge('database.connections.active', count);
      },
      
      error: () => {
        metrics.increment('database.connections.error');
      },
    },
  },
  
  api: {
    request: (method: string, endpoint: string, statusCode: number, duration: number) => {
      metrics.timing('api.request.duration', duration, [
        `method:${method}`,
        `endpoint:${endpoint}`,
        `status_code:${statusCode}`,
      ]);
      
      metrics.increment('api.request.count', 1, [
        `method:${method}`,
        `endpoint:${endpoint}`,
        `status_code:${statusCode}`,
      ]);
    },
    
    error: (method: string, endpoint: string, errorType: string) => {
      metrics.increment('api.error', 1, [
        `method:${method}`,
        `endpoint:${endpoint}`,
        `error_type:${errorType}`,
      ]);
    },
  },
  
  migration: {
    start: (migrationType: string) => {
      metrics.increment('migration.started', 1, [
        `migration_type:${migrationType}`,
      ]);
    },
    
    complete: (migrationType: string, duration: number, recordCount: number) => {
      metrics.timing('migration.duration', duration, [
        `migration_type:${migrationType}`,
      ]);
      
      metrics.gauge('migration.records_processed', recordCount, [
        `migration_type:${migrationType}`,
      ]);
      
      metrics.increment('migration.completed', 1, [
        `migration_type:${migrationType}`,
      ]);
    },
    
    error: (migrationType: string, errorType: string) => {
      metrics.increment('migration.error', 1, [
        `migration_type:${migrationType}`,
        `error_type:${errorType}`,
      ]);
    },
  },
  
  business: {
    // E-commerce specific metrics
    orderCreated: (amount: number, currency: string = 'USD') => {
      metrics.increment('business.order.created', 1, [
        `currency:${currency}`,
      ]);
      
      metrics.histogram('business.order.amount', amount, [
        `currency:${currency}`,
      ]);
    },
    
    productViewed: (productId: string, category?: string) => {
      metrics.increment('business.product.viewed', 1, [
        `product_id:${productId}`,
        ...(category ? [`category:${category}`] : []),
      ]);
    },
    
    cartAction: (action: 'add' | 'remove' | 'update', productId: string) => {
      metrics.increment('business.cart.action', 1, [
        `action:${action}`,
        `product_id:${productId}`,
      ]);
    },
    
    userRegistration: () => {
      metrics.increment('business.user.registration');
    },
    
    paymentProcessed: (success: boolean, paymentMethod: string, amount: number) => {
      metrics.increment('business.payment.processed', 1, [
        `success:${success}`,
        `payment_method:${paymentMethod}`,
      ]);
      
      if (success) {
        metrics.histogram('business.payment.amount', amount, [
          `payment_method:${paymentMethod}`,
        ]);
      }
    },
  },
};

// Performance monitoring utilities
export const performance = {
  // Measure execution time of async functions
  measureAsync: async <T>(
    metric: string,
    fn: () => Promise<T>,
    tags?: string[]
  ): Promise<T> => {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      metrics.timing(metric, duration, [...(tags || []), 'success:true']);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      metrics.timing(metric, duration, [...(tags || []), 'success:false']);
      throw error;
    }
  },
  
  // Measure execution time of sync functions
  measure: <T>(
    metric: string,
    fn: () => T,
    tags?: string[]
  ): T => {
    const start = Date.now();
    try {
      const result = fn();
      const duration = Date.now() - start;
      metrics.timing(metric, duration, [...(tags || []), 'success:true']);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      metrics.timing(metric, duration, [...(tags || []), 'success:false']);
      throw error;
    }
  },
};

// Health check metrics
export const healthCheck = {
  recordStatus: (service: string, healthy: boolean, responseTime?: number) => {
    metrics.gauge(`health.${service}.status`, healthy ? 1 : 0);
    if (responseTime !== undefined) {
      metrics.timing(`health.${service}.response_time`, responseTime);
    }
  },
};

export default statsd; 