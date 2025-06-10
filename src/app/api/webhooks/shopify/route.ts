import { NextRequest, NextResponse } from 'next/server';
import { 
  verifyShopifyWebhook,
  ProductWebhookHandler,
  OrderWebhookHandler,
  CustomerWebhookHandler 
} from '@/lib/shopify/webhook-handlers';
import { recordWebhook } from '@/lib/monitoring/webhook-monitor';
import { log } from '@/lib/monitoring/logger';
import { metrics } from '@/lib/monitoring/datadog';

const WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const topic = request.headers.get('x-shopify-topic') || 'unknown';
  const webhookId = `${topic}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // Get the raw body
    const body = await request.text();
    
    // Verify webhook signature
    if (!verifyShopifyWebhook(request, body, WEBHOOK_SECRET)) {
      log.error('Invalid webhook signature', { 
        component: 'webhook',
        topic,
        webhookId 
      });
      
      recordWebhook(topic, { error: 'Invalid signature' }, 'failed', Date.now() - startTime, 'Invalid signature', webhookId);
      
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse the body
    const data = JSON.parse(body);
    
    log.info(`Received webhook: ${topic}`, { 
      component: 'webhook',
      topic,
      webhookId,
      dataKeys: Object.keys(data),
    });
    
    // Route to appropriate handler
    switch (topic) {
      // Product webhooks
      case 'products/create':
        await ProductWebhookHandler.handleProductCreate(data);
        break;
        
      case 'products/update':
        await ProductWebhookHandler.handleProductUpdate(data);
        break;
        
      case 'products/delete':
        await ProductWebhookHandler.handleProductDelete(data);
        break;
        
      // Order webhooks
      case 'orders/create':
        await OrderWebhookHandler.handleOrderCreate(data);
        break;
        
      case 'orders/updated':
        await OrderWebhookHandler.handleOrderUpdate(data);
        break;
        
      case 'orders/paid':
        await OrderWebhookHandler.handleOrderUpdate(data);
        break;
        
      case 'orders/cancelled':
        await OrderWebhookHandler.handleOrderUpdate(data);
        break;
        
      case 'orders/fulfilled':
        await OrderWebhookHandler.handleOrderUpdate(data);
        break;
        
      // Customer webhooks
      case 'customers/create':
        await CustomerWebhookHandler.handleCustomerCreate(data);
        break;
        
      case 'customers/update':
        await CustomerWebhookHandler.handleCustomerUpdate(data);
        break;
        
      default:
        log.warn(`Unhandled webhook topic: ${topic}`, { 
          component: 'webhook',
          topic,
          webhookId 
        });
        break;
    }
    
    const processingTime = Date.now() - startTime;
    
    // Record successful webhook processing
    recordWebhook(topic, data, 'success', processingTime, undefined, webhookId);
    
    log.info(`Webhook processed successfully: ${topic}`, {
      component: 'webhook',
      topic,
      webhookId,
      processingTime,
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    log.error(`Webhook processing failed: ${topic}`, {
      component: 'webhook',
      topic,
      webhookId,
      processingTime,
      error: errorMessage,
    }, error instanceof Error ? error : undefined);
    
    // Record failed webhook processing
    recordWebhook(topic, {}, 'failed', processingTime, errorMessage, webhookId);
    
    // Record API error metric
    metrics.api.error('POST', '/api/webhooks/shopify', errorMessage);
    
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// Health check endpoint for webhook configuration
export async function GET() {
  return NextResponse.json({ 
    status: 'Shopify webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
} 