import { NextRequest, NextResponse } from 'next/server';
import { 
  verifyShopifyWebhook,
  ProductWebhookHandler,
  OrderWebhookHandler,
  CustomerWebhookHandler 
} from '@/lib/shopify/webhook-handlers';

const WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    // Get the raw body
    const body = await request.text();
    
    // Verify webhook signature
    if (!verifyShopifyWebhook(request, body, WEBHOOK_SECRET)) {
      console.error('❌ Invalid webhook signature');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse the body
    const data = JSON.parse(body);
    
    // Get webhook topic from headers
    const topic = request.headers.get('x-shopify-topic');
    
    console.log(`📡 Received webhook: ${topic}`);
    
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
        console.log(`⚠️  Unhandled webhook topic: ${topic}`);
        break;
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('❌ Webhook processing failed:', error);
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