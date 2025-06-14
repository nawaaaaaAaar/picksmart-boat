import { log } from './logger';
import { metrics } from './datadog';
import * as Sentry from '@sentry/node';
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

// Use centralized Prisma client instance
let prisma: PrismaClient;

const getPrismaClient = () => {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
};

// Webhook monitoring interfaces
interface WebhookData {
  [key: string]: unknown;
  id?: string | number;
  handle?: string;
  title?: string;
  email?: string;
}

interface WebhookEvent {
  id: string;
  type: string;
  topic: string;
  status: 'success' | 'failed' | 'retry';
  attempts: number;
  lastAttempt: Date;
  error?: string;
  data: WebhookData;
  processingTime?: number;
}

// In-memory store for recent webhook events (for monitoring)
const recentWebhooks = new Map<string, WebhookEvent>();
const MAX_RECENT_WEBHOOKS = 1000;

// Failure tracking
interface WebhookFailure {
  topic: string;
  count: number;
  firstFailure: Date;
  lastFailure: Date;
  errors: string[];
}

const webhookFailures = new Map<string, WebhookFailure>();

export class WebhookMonitor {
  private static instance: WebhookMonitor;
  private alertThreshold: number;
  private retryAttempts: number;
  private monitoringEnabled: boolean;

  constructor() {
    this.alertThreshold = parseInt(process.env.WEBHOOK_FAILURE_THRESHOLD || '5');
    this.retryAttempts = parseInt(process.env.WEBHOOK_RETRY_ATTEMPTS || '3');
    this.monitoringEnabled = process.env.WEBHOOK_MONITORING_ENABLED === 'true';
    
    if (this.monitoringEnabled) {
      this.startMonitoring();
    }
  }

  static getInstance(): WebhookMonitor {
    if (!WebhookMonitor.instance) {
      WebhookMonitor.instance = new WebhookMonitor();
    }
    return WebhookMonitor.instance;
  }

  // Record webhook event
  recordWebhookEvent(
    topic: string,
    data: WebhookData,
    status: 'success' | 'failed' | 'retry',
    processingTime?: number,
    error?: string,
    eventId?: string
  ): void {
    const id = eventId || `${topic}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const event: WebhookEvent = {
      id,
      type: topic.split('/')[0], // e.g., 'products' from 'products/create'
      topic,
      status,
      attempts: 1,
      lastAttempt: new Date(),
      error,
      data,
      processingTime,
    };

    // Update existing event if retrying
    const existingEvent = recentWebhooks.get(id);
    if (existingEvent) {
      event.attempts = existingEvent.attempts + 1;
    }

    recentWebhooks.set(id, event);

    // Maintain size limit
    if (recentWebhooks.size > MAX_RECENT_WEBHOOKS) {
      const oldestKey = recentWebhooks.keys().next().value;
      recentWebhooks.delete(oldestKey);
    }

    // Record metrics
    metrics.webhook.received(topic, status === 'success');
    if (processingTime) {
      metrics.webhook.processingTime(topic, processingTime);
    }

    // Log event
    log.webhook(topic, { eventId: id, status, processingTime }, status === 'success' ? 'success' : 'error');

    // Handle failures
    if (status === 'failed') {
      this.handleWebhookFailure(topic, error || 'Unknown error');
      metrics.webhook.error(topic, error || 'unknown');
    }

    // Note: Database persistence is optional and can be added via custom implementation
    // For now, we use in-memory storage with cleanup
  }

  // Handle webhook failures
  private handleWebhookFailure(topic: string, error: string): void {
    if (!webhookFailures.has(topic)) {
      webhookFailures.set(topic, {
        topic,
        count: 0,
        firstFailure: new Date(),
        lastFailure: new Date(),
        errors: [],
      });
    }

    const failure = webhookFailures.get(topic);
    if (!failure) return;
    
    failure.count++;
    failure.lastFailure = new Date();
    failure.errors.push(error);

    // Keep only last 10 errors
    if (failure.errors.length > 10) {
      failure.errors = failure.errors.slice(-10);
    }

    // Check if alert threshold is reached
    if (failure.count >= this.alertThreshold) {
      this.sendAlert(failure);
    }

    // Send to Sentry
    Sentry.captureMessage(`Webhook failure: ${topic}`, 'error');
  }

  // Send alerts for webhook failures
  private async sendAlert(failure: WebhookFailure): Promise<void> {
    const message = `Webhook Alert: ${failure.topic} has failed ${failure.count} times since ${failure.firstFailure.toISOString()}`;
    
    log.error('Webhook failure alert', {
      component: 'webhook-monitor',
      topic: failure.topic,
      failureCount: failure.count,
      firstFailure: failure.firstFailure,
      lastFailure: failure.lastFailure,
      recentErrors: failure.errors.slice(-3),
    });

    // Send to Sentry with high priority
    Sentry.captureMessage(message, 'fatal');

    // TODO: Implement email/SMS alerts
    // await this.sendEmailAlert(failure);
    // await this.sendSlackAlert(failure);
  }

  // Get monitoring statistics
  getMonitoringStats(): {
    recentEvents: number;
    successRate: number;
    failuresByTopic: Map<string, WebhookFailure>;
    averageProcessingTime: number;
    topicStats: Record<string, { total: number; success: number; failures: number }>;
  } {
    const events = Array.from(recentWebhooks.values());
    const successCount = events.filter(e => e.status === 'success').length;
    const totalProcessingTime = events.reduce((sum, e) => sum + (e.processingTime || 0), 0);

    // Calculate stats by topic
    const topicStats: Record<string, { total: number; success: number; failures: number }> = {};
    
    events.forEach(event => {
      if (!topicStats[event.topic]) {
        topicStats[event.topic] = { total: 0, success: 0, failures: 0 };
      }
      
      topicStats[event.topic].total++;
      if (event.status === 'success') {
        topicStats[event.topic].success++;
      } else {
        topicStats[event.topic].failures++;
      }
    });

    return {
      recentEvents: events.length,
      successRate: events.length > 0 ? (successCount / events.length) * 100 : 100,
      failuresByTopic: webhookFailures,
      averageProcessingTime: events.length > 0 ? totalProcessingTime / events.length : 0,
      topicStats,
    };
  }

  // Note: Database persistence can be implemented later if needed
  // For now, we use efficient in-memory storage with automatic cleanup

  // Start monitoring processes with error handling
  private startMonitoring(): void {
    log.info('Starting webhook monitoring', { component: 'webhook-monitor' });

    // Clean up old events every hour
    cron.schedule('0 * * * *', () => {
      try {
        this.cleanupOldEvents();
      } catch (error) {
        log.error('Failed to cleanup old webhook events', { error });
      }
    });

    // Generate monitoring report every 15 minutes
    cron.schedule('*/15 * * * *', () => {
      try {
        this.generateMonitoringReport();
      } catch (error) {
        log.error('Failed to generate monitoring report', { error });
      }
    });

    // Reset failure counters daily
    cron.schedule('0 0 * * *', () => {
      try {
        this.resetFailureCounters();
      } catch (error) {
        log.error('Failed to reset failure counters', { error });
      }
    });
  }

  // Cleanup old events from memory
  private cleanupOldEvents(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    for (const [id, event] of recentWebhooks.entries()) {
      if (event.lastAttempt < oneDayAgo) {
        recentWebhooks.delete(id);
      }
    }

    log.debug('Cleaned up old webhook events', { 
      remainingEvents: recentWebhooks.size,
      component: 'webhook-monitor' 
    });
  }

  // Generate periodic monitoring report
  private generateMonitoringReport(): void {
    const stats = this.getMonitoringStats();
    
    log.info('Webhook monitoring report', {
      component: 'webhook-monitor',
      stats,
    });

    // Record system-level metrics
    metrics.gauge('webhook.recent_events', stats.recentEvents);
    metrics.gauge('webhook.success_rate', stats.successRate);
    metrics.gauge('webhook.average_processing_time', stats.averageProcessingTime);
    
    // Record failure metrics
    for (const [topic, failure] of stats.failuresByTopic.entries()) {
      metrics.gauge('webhook.failures_by_topic', failure.count, [`topic:${topic}`]);
    }
  }

  // Reset failure counters
  private resetFailureCounters(): void {
    webhookFailures.clear();
    log.info('Reset webhook failure counters', { component: 'webhook-monitor' });
  }

  // Get recent webhook events for dashboard
  getRecentEvents(limit: number = 50): WebhookEvent[] {
    return Array.from(recentWebhooks.values())
      .sort((a, b) => b.lastAttempt.getTime() - a.lastAttempt.getTime())
      .slice(0, limit);
  }

  // Check webhook health
  checkWebhookHealth(): {
    healthy: boolean;
    issues: string[];
    stats: ReturnType<typeof this.getMonitoringStats>;
  } {
    const stats = this.getMonitoringStats();
    const issues: string[] = [];
    
    // Check success rate
    if (stats.successRate < 95) {
      issues.push(`Low success rate: ${stats.successRate.toFixed(2)}%`);
    }
    
    // Check for high failure counts
    for (const [topic, failure] of stats.failuresByTopic.entries()) {
      if (failure.count >= this.alertThreshold) {
        issues.push(`High failure count for ${topic}: ${failure.count} failures`);
      }
    }
    
    // Check processing time
    if (stats.averageProcessingTime > 5000) { // 5 seconds
      issues.push(`High average processing time: ${stats.averageProcessingTime}ms`);
    }

    return {
      healthy: issues.length === 0,
      issues,
      stats,
    };
  }
}

// Export singleton instance
export const webhookMonitor = WebhookMonitor.getInstance();

// Export utility functions
export const recordWebhook = (
  topic: string,
  data: WebhookData,
  status: 'success' | 'failed' | 'retry',
  processingTime?: number,
  error?: string,
  eventId?: string
): void => {
  webhookMonitor.recordWebhookEvent(topic, data, status, processingTime, error, eventId);
};

export const getWebhookStats = () => webhookMonitor.getMonitoringStats();
export const getRecentWebhooks = (limit?: number) => webhookMonitor.getRecentEvents(limit);
export const checkWebhookHealth = () => webhookMonitor.checkWebhookHealth(); 