import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

// Webhook verification
export function verifyShopifyWebhook(
  request: NextRequest,
  body: string,
  secret: string
): boolean {
  const crypto = require('crypto');
  const hmacHeader = request.headers.get('x-shopify-hmac-sha256');
  
  if (!hmacHeader) return false;
  
  const calculatedHmac = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');
    
  return crypto.timingSafeEqual(
    Buffer.from(hmacHeader),
    Buffer.from(calculatedHmac)
  );
}

// Product webhook handlers
export class ProductWebhookHandler {
  static async handleProductCreate(data: any): Promise<void> {
    console.log('🆕 Webhook: Product created', data.id);
    
    try {
      // Check if product already exists
      const existing = await prisma.product.findFirst({
        where: { handle: data.handle }
      });
      
      if (existing) {
        console.log('⚠️  Product already exists, updating instead');
        await this.handleProductUpdate(data);
        return;
      }
      
      // Create new product
      await prisma.product.create({
        data: {
          handle: data.handle,
          title: data.title,
          bodyHtml: data.body_html,
          vendor: data.vendor,
          productType: data.product_type,
          tags: data.tags,
          published: data.published_at !== null,
          seoTitle: data.title,
          seoDescription: data.body_html?.substring(0, 160),
          status: data.status?.toUpperCase() || 'ACTIVE',
          
          // Legacy fields
          name: data.title,
          description: data.body_html?.replace(/<[^>]*>/g, '')?.substring(0, 500) || '',
          imageUrl: data.images?.[0]?.src,
          price: data.variants?.[0]?.price || 0,
          stock: data.variants?.reduce((sum: number, v: any) => sum + (v.inventory_quantity || 0), 0) || 0,
        }
      });
      
      console.log('✅ Product created successfully');
    } catch (error) {
      console.error('❌ Failed to create product:', error);
      throw error;
    }
  }
  
  static async handleProductUpdate(data: any): Promise<void> {
    console.log('📝 Webhook: Product updated', data.id);
    
    try {
      const product = await prisma.product.findFirst({
        where: { handle: data.handle }
      });
      
      if (!product) {
        console.log('⚠️  Product not found, creating instead');
        await this.handleProductCreate(data);
        return;
      }
      
      // Update product
      await prisma.product.update({
        where: { id: product.id },
        data: {
          title: data.title,
          bodyHtml: data.body_html,
          vendor: data.vendor,
          productType: data.product_type,
          tags: data.tags,
          published: data.published_at !== null,
          seoTitle: data.title,
          seoDescription: data.body_html?.substring(0, 160),
          status: data.status?.toUpperCase() || 'ACTIVE',
          
          // Legacy fields
          name: data.title,
          description: data.body_html?.replace(/<[^>]*>/g, '')?.substring(0, 500) || '',
          imageUrl: data.images?.[0]?.src,
          price: data.variants?.[0]?.price || 0,
          stock: data.variants?.reduce((sum: number, v: any) => sum + (v.inventory_quantity || 0), 0) || 0,
          
          updatedAt: new Date(),
        }
      });
      
      console.log('✅ Product updated successfully');
    } catch (error) {
      console.error('❌ Failed to update product:', error);
      throw error;
    }
  }
  
  static async handleProductDelete(data: any): Promise<void> {
    console.log('🗑️  Webhook: Product deleted', data.id);
    
    try {
      const product = await prisma.product.findFirst({
        where: { handle: data.handle }
      });
      
      if (!product) {
        console.log('⚠️  Product not found');
        return;
      }
      
      // Soft delete by setting status to ARCHIVED
      await prisma.product.update({
        where: { id: product.id },
        data: {
          status: 'ARCHIVED',
          updatedAt: new Date(),
        }
      });
      
      console.log('✅ Product archived successfully');
    } catch (error) {
      console.error('❌ Failed to archive product:', error);
      throw error;
    }
  }
}

// Order webhook handlers
export class OrderWebhookHandler {
  static async handleOrderCreate(data: any): Promise<void> {
    console.log('🛒 Webhook: Order created', data.id);
    
    try {
      // Check if order already exists
      const existing = await prisma.order.findFirst({
        where: { shopifyOrderId: data.id.toString() }
      });
      
      if (existing) {
        console.log('⚠️  Order already exists');
        return;
      }
      
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: data.email }
      });
      
      // Map Shopify status
      const statusMapping: { [key: string]: string } = {
        'pending': 'PENDING',
        'paid': 'CONFIRMED',
        'partially_paid': 'PENDING',
        'refunded': 'CANCELLED',
        'voided': 'CANCELLED',
        'authorized': 'PENDING'
      };
      
      const orderStatus = statusMapping[data.financial_status] || 'PENDING';
      
      // Create order
      const order = await prisma.order.create({
        data: {
          userId: user?.id,
          customerEmail: data.email,
          status: orderStatus as any,
          totalAmount: parseFloat(data.total_price || '0'),
          shopifyOrderId: data.id.toString(),
          shopifyOrderName: data.name,
          financialStatus: data.financial_status,
          fulfillmentStatus: data.fulfillment_status,
          currency: data.currency,
          subtotalPrice: parseFloat(data.subtotal_price || '0'),
          totalTax: parseFloat(data.total_tax || '0'),
          shippingPrice: parseFloat(data.total_shipping_price_set?.shop_money?.amount || '0'),
          totalDiscounts: parseFloat(data.total_discounts || '0'),
          billingAddress: this.formatAddress(data.billing_address),
          shippingAddress: this.formatAddress(data.shipping_address),
        }
      });
      
      // Create order items
      for (const lineItem of data.line_items || []) {
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productName: lineItem.name,
            quantity: lineItem.quantity,
            price: parseFloat(lineItem.price),
            sku: lineItem.sku,
            shopifyVariantId: lineItem.variant_id?.toString(),
            shopifyProductId: lineItem.product_id?.toString(),
          }
        });
      }
      
      console.log('✅ Order created successfully');
    } catch (error) {
      console.error('❌ Failed to create order:', error);
      throw error;
    }
  }
  
  static async handleOrderUpdate(data: any): Promise<void> {
    console.log('📝 Webhook: Order updated', data.id);
    
    try {
      const order = await prisma.order.findFirst({
        where: { shopifyOrderId: data.id.toString() }
      });
      
      if (!order) {
        console.log('⚠️  Order not found, creating instead');
        await this.handleOrderCreate(data);
        return;
      }
      
      // Map status
      const statusMapping: { [key: string]: string } = {
        'pending': 'PENDING',
        'paid': 'CONFIRMED',
        'partially_paid': 'PENDING',
        'refunded': 'CANCELLED',
        'voided': 'CANCELLED',
        'authorized': 'PENDING'
      };
      
      const orderStatus = statusMapping[data.financial_status] || 'PENDING';
      
      // Update order
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: orderStatus as any,
          totalAmount: parseFloat(data.total_price || '0'),
          financialStatus: data.financial_status,
          fulfillmentStatus: data.fulfillment_status,
          subtotalPrice: parseFloat(data.subtotal_price || '0'),
          totalTax: parseFloat(data.total_tax || '0'),
          shippingPrice: parseFloat(data.total_shipping_price_set?.shop_money?.amount || '0'),
          totalDiscounts: parseFloat(data.total_discounts || '0'),
          updatedAt: new Date(),
        }
      });
      
      console.log('✅ Order updated successfully');
    } catch (error) {
      console.error('❌ Failed to update order:', error);
      throw error;
    }
  }
  
  private static formatAddress(address: any): string {
    if (!address) return '';
    
    const parts = [
      address.name,
      address.address1,
      address.address2,
      address.city,
      address.province,
      address.country,
      address.zip
    ].filter(Boolean);
    
    return parts.join(', ');
  }
}

// Customer webhook handlers
export class CustomerWebhookHandler {
  static async handleCustomerCreate(data: any): Promise<void> {
    console.log('👤 Webhook: Customer created', data.id);
    
    try {
      // Check if customer already exists
      const existing = await prisma.user.findUnique({
        where: { email: data.email }
      });
      
      if (existing) {
        console.log('⚠️  Customer already exists');
        return;
      }
      
      // Create customer with default password (they'll need to reset)
      const bcrypt = require('bcryptjs');
      const defaultPassword = await bcrypt.hash('shopify-migration-temp', 10);
      
      await prisma.user.create({
        data: {
          email: data.email,
          password: defaultPassword,
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          phone: data.phone || '',
          shopifyCustomerId: data.id.toString(),
          acceptsMarketing: data.accepts_marketing || false,
          totalSpent: parseFloat(data.total_spent || '0'),
          orderCount: parseInt(data.orders_count || '0'),
          verifiedEmail: data.verified_email || false,
          address: this.formatAddress(data.default_address),
        }
      });
      
      console.log('✅ Customer created successfully');
    } catch (error) {
      console.error('❌ Failed to create customer:', error);
      throw error;
    }
  }
  
  static async handleCustomerUpdate(data: any): Promise<void> {
    console.log('📝 Webhook: Customer updated', data.id);
    
    try {
      const user = await prisma.user.findUnique({
        where: { email: data.email }
      });
      
      if (!user) {
        console.log('⚠️  Customer not found, creating instead');
        await this.handleCustomerCreate(data);
        return;
      }
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          phone: data.phone || '',
          acceptsMarketing: data.accepts_marketing || false,
          totalSpent: parseFloat(data.total_spent || '0'),
          orderCount: parseInt(data.orders_count || '0'),
          verifiedEmail: data.verified_email || false,
          address: this.formatAddress(data.default_address),
          updatedAt: new Date(),
        }
      });
      
      console.log('✅ Customer updated successfully');
    } catch (error) {
      console.error('❌ Failed to update customer:', error);
      throw error;
    }
  }
  
  private static formatAddress(address: any): string {
    if (!address) return '';
    
    const parts = [
      address.name,
      address.address1,
      address.address2,
      address.city,
      address.province,
      address.country,
      address.zip
    ].filter(Boolean);
    
    return parts.join(', ');
  }
} 