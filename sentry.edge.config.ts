import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Edge runtime specific configuration
  tracesSampleRate: 0.1,
  
  // Environment configuration
  environment: process.env.NODE_ENV,
  
  // Minimal configuration for edge runtime
  beforeSend(event) {
    // Add edge runtime context
    event.tags = {
      ...event.tags,
      runtime: 'edge',
    };
    
    return event;
  },
}); 