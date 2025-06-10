import { NextRequest, NextResponse } from 'next/server';
import { performHealthCheck, quickHealthCheck } from '@/lib/monitoring/health-check';
import { log } from '@/lib/monitoring/logger';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const quick = searchParams.get('quick') === 'true';
  
  try {
    if (quick) {
      // Quick health check for load balancers
      const result = await quickHealthCheck();
      return NextResponse.json(result, {
        status: result.status === 'ok' ? 200 : 503,
      });
    }
    
    // Full health check
    const result = await performHealthCheck();
    
    const statusCode = result.overall === 'healthy' ? 200 : 
                      result.overall === 'degraded' ? 200 : 503;
    
    return NextResponse.json(result, { status: statusCode });
    
  } catch (error) {
    log.error('Health check endpoint failed', { 
      component: 'monitoring',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return NextResponse.json(
      { 
        overall: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
} 