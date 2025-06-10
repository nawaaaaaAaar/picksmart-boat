import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Capture unhandled promise rejections
  captureUnhandledRejections: true,
  
  // Environment configuration
  environment: process.env.NODE_ENV,
  
  // Enhanced error context
  beforeSend(event) {
    // Filter out development errors in production
    if (process.env.NODE_ENV === 'production') {
      if (event.exception) {
        const error = event.exception.values?.[0];
        if (error?.value?.includes('ChunkLoadError')) {
          return null; // Don't send chunk loading errors
        }
      }
    }
    
    return event;
  },
  
  // Additional integrations
  integrations: [
    new Sentry.BrowserTracing({
      // Performance monitoring for pages
      tracePropagationTargets: [
        'localhost',
        /^https:\/\/[^/]*\.vercel\.app\//,
        /^https:\/\/www\.picksmartstores\.com/,
        /^https:\/\/picksmartstores\.com/,
      ],
    }),
  ],
  
  // Error filtering
  ignoreErrors: [
    // Browser extensions
    'Non-Error promise rejection captured',
    'ResizeObserver loop limit exceeded',
    // Network errors
    'Network request failed',
    'Load failed',
  ],
}); 