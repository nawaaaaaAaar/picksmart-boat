import { NextRequest, NextResponse } from 'next/server';
import { getWebhookStats, getRecentWebhooks, checkWebhookHealth } from '@/lib/monitoring/webhook-monitor';
import { log } from '@/lib/monitoring/logger';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'stats';
  const limit = parseInt(searchParams.get('limit') || '50');
  
  try {
    switch (action) {
      case 'stats':
        // Get webhook statistics
        const stats = getWebhookStats();
        return NextResponse.json({
          success: true,
          data: {
            ...stats,
            failuresByTopic: Object.fromEntries(stats.failuresByTopic),
          },
        });
        
      case 'recent':
        // Get recent webhook events
        const recentEvents = getRecentWebhooks(limit);
        return NextResponse.json({
          success: true,
          data: recentEvents,
        });
        
      case 'health':
        // Get webhook health status
        const health = checkWebhookHealth();
        const statusCode = health.healthy ? 200 : 503;
        return NextResponse.json({
          success: true,
          data: health,
        }, { status: statusCode });
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Available actions: stats, recent, health',
        }, { status: 400 });
    }
    
  } catch (error) {
    log.error('Webhook monitoring endpoint failed', {
      component: 'monitoring',
      action,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch webhook monitoring data',
    }, { status: 500 });
  }
} 