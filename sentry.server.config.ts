import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Performance monitoring (lower sample rate for server)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,
  
  // Environment configuration
  environment: process.env.NODE_ENV,
  
  // Enhanced context for server errors
  beforeSend(event, hint) {
    // Add webhook context if available
    if (event.request?.url?.includes('/api/webhooks/')) {
      event.tags = {
        ...event.tags,
        component: 'webhook',
        webhook_type: event.request.url.split('/').pop(),
      };
    }
    
    // Add migration context
    if (event.request?.url?.includes('/api/migrate') || 
        hint.originalException?.stack?.includes('migration')) {
      event.tags = {
        ...event.tags,
        component: 'migration',
      };
    }
    
    // Add database context
    if (hint.originalException?.message?.includes('Prisma') ||
        hint.originalException?.message?.includes('MongoDB')) {
      event.tags = {
        ...event.tags,
        component: 'database',
      };
    }
    
    return event;
  },
  
  // Server-specific integrations
  integrations: [
    // HTTP integration for request tracking
    new Sentry.Integrations.Http({ tracing: true }),
  ],
  
  // Additional context
  initialScope: {
    tags: {
      service: 'picksmart-stores',
      version: process.env.DD_VERSION || '1.0.0',
    },
  },
}); 