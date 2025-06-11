import winston from 'winston';
import * as Sentry from '@sentry/node';

// Custom log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  webhook: 3,
  migration: 4,
  database: 5,
  debug: 6,
};

// Custom colors for console output
winston.addColors({
  error: 'red',
  warn: 'yellow',
  info: 'cyan',
  webhook: 'magenta',
  migration: 'blue',
  database: 'green',
  debug: 'gray',
});

// Create Winston logger
const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] })
  ),
  defaultMeta: {
    service: 'picksmart-stores',
    environment: process.env.NODE_ENV,
    version: process.env.DD_VERSION || '1.0.0',
    domain: 'www.picksmartstores.com',
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        })
      ),
    }),
    
    // File transport for errors (only if logs directory exists)
    ...(fs.existsSync(logsDir) ? [
      new winston.transports.File({
        filename: path.join(logsDir, 'error.log'),
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        handleExceptions: true,
        handleRejections: true,
      }),
      
      // File transport for all logs
      new winston.transports.File({
        filename: path.join(logsDir, 'combined.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        handleExceptions: true,
        handleRejections: true,
      }),
    ] : []),
  ],
});

// Enhanced logging methods
export const log = {
  // Standard logging
  error: (message: string, meta?: any, error?: Error) => {
    logger.error(message, { ...meta, error: error?.stack });
    
    // Send to Sentry
    if (error) {
      Sentry.captureException(error, {
        tags: { component: meta?.component || 'unknown' },
        extra: meta,
      });
    } else {
      Sentry.captureMessage(message, 'error');
    }
  },
  
  warn: (message: string, meta?: any) => {
    logger.warn(message, meta);
    Sentry.captureMessage(message, 'warning');
  },
  
  info: (message: string, meta?: any) => {
    logger.info(message, meta);
  },
  
  debug: (message: string, meta?: any) => {
    logger.debug(message, meta);
  },
  
  // Specialized logging methods
  webhook: (event: string, data: any, status: 'success' | 'error' | 'retry' = 'success') => {
    const message = `Webhook ${event} - ${status}`;
    const meta = {
      component: 'webhook',
      event,
      status,
      webhookData: data,
    };
    
    if (status === 'error') {
      logger.error(message, meta);
      Sentry.captureMessage(message, 'error');
    } else {
      logger.log('webhook', message, meta);
    }
  },
  
  migration: (operation: string, details: any, status: 'start' | 'success' | 'error' = 'success') => {
    const message = `Migration ${operation} - ${status}`;
    const meta = {
      component: 'migration',
      operation,
      status,
      details,
    };
    
    if (status === 'error') {
      logger.error(message, meta);
    } else {
      logger.log('migration', message, meta);
    }
  },
  
  database: (query: string, duration?: number, error?: Error) => {
    const message = error ? `Database error: ${query}` : `Database query: ${query}`;
    const meta = {
      component: 'database',
      query,
      duration,
      error: error?.message,
    };
    
    if (error) {
      logger.error(message, meta);
      Sentry.captureException(error, {
        tags: { component: 'database' },
        extra: { query, duration },
      });
    } else {
      logger.log('database', message, meta);
    }
  },
  
  api: (method: string, path: string, statusCode: number, duration: number, userId?: string) => {
    const message = `${method} ${path} - ${statusCode}`;
    const meta = {
      component: 'api',
      method,
      path,
      statusCode,
      duration,
      userId,
    };
    
    if (statusCode >= 400) {
      logger.error(message, meta);
    } else {
      logger.info(message, meta);
    }
  },
};

// Create logs directory if it doesn't exist (with proper error handling)
import fs from 'fs';
import path from 'path';

const createLogsDirectory = () => {
  const logsDir = path.join(process.cwd(), 'logs');
  try {
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true, mode: 0o755 }); // Secure permissions
    }
  } catch (error) {
    console.warn('Failed to create logs directory:', error);
    // Continue without file logging if directory creation fails
  }
  return logsDir;
};

const logsDir = createLogsDirectory();

export default logger; 