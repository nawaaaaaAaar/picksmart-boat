import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import fs from 'fs';

const prisma = new PrismaClient();

interface ShopifyOrder {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
  financial_status: string;
  fulfillment_status: string;
  total_price: string;
  subtotal_price: string;
  total_tax: string;
  total_discounts: string;
  shipping_price: string;
  currency: string;
  tags: string;
  note: string;
  
  // Billing address
  billing_name: string;
  billing_street: string;
  billing_city: string;
  billing_province: string;
  billing_country: string;
  billing_zip: string;
  billing_phone: string;
  
  // Shipping address
  shipping_name: string;
  shipping_street: string;
  shipping_city: string;
  shipping_province: string;
  shipping_country: string;
  shipping_zip: string;
  shipping_phone: string;
  
  // Line items (these might be in separate columns)
  lineitem_name: string;
  lineitem_sku: string;
  lineitem_quantity: string;
  lineitem_price: string;
  lineitem_variant_id: string;
  lineitem_product_id: string;
}

export class OrderMigrator {
  async migrateFromCSV(csvFilePath: string): Promise<void> {
    console.log('📦 Starting Shopify order migration...');
    
    try {
      // Parse CSV data
      const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
      const orderRows: ShopifyOrder[] = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      console.log(`📊 Found ${orderRows.length} order rows to process`);

      // Group orders by order ID (multiple rows per order due to line items)
      const groupedOrders = this.groupOrdersByOrderId(orderRows);
      console.log(`📦 Found ${groupedOrders.size} unique orders to migrate`);

      // Get existing orders to skip duplicates
      const existingOrders = await prisma.order.findMany({
        select: { shopifyOrderId: true }
      });
      const existingOrderIds = new Set(existingOrders.map(o => o.shopifyOrderId).filter(Boolean));
      
      console.log(`⚠️  Found ${existingOrderIds.size} existing orders - will skip these`);

      let successCount = 0;
      let errorCount = 0;
      let skippedCount = 0;

      for (const [orderId, orderData] of groupedOrders) {
        try {
          if (existingOrderIds.has(orderId)) {
            skippedCount++;
            console.log(`⏭️  Skipped: Order ${orderId} (already exists)`);
            continue;
          }

          await this.migrateOrder(orderId, orderData);
          successCount++;
          console.log(`✅ Migrated: Order ${orderId} (${orderData.lineItems.length} items)`);
        } catch (error) {
          errorCount++;
          console.error(`❌ Failed to migrate order ${orderId}:`, (error as Error).message);
        }
      }

      console.log(`
🎉 Order migration completed!
✅ Successful: ${successCount}
⏭️  Skipped: ${skippedCount}
❌ Failed: ${errorCount}
📊 Total: ${groupedOrders.size}
      `);

    } catch (error) {
      console.error('💥 Order migration failed:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  private groupOrdersByOrderId(rows: ShopifyOrder[]): Map<string, any> {
    const orders = new Map();

    for (const row of rows) {
      if (!orders.has(row.id)) {
        orders.set(row.id, {
          ...row,
          lineItems: []
        });
      }

      // Add line item if it exists
      if (row.lineitem_name) {
        orders.get(row.id).lineItems.push({
          name: row.lineitem_name,
          sku: row.lineitem_sku,
          quantity: parseInt(row.lineitem_quantity || '1'),
          price: parseFloat(row.lineitem_price || '0'),
          variantId: row.lineitem_variant_id,
          productId: row.lineitem_product_id
        });
      }
    }

    return orders;
  }

  private async migrateOrder(orderId: string, orderData: any): Promise<void> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: orderData.email }
    });

    // Map Shopify status to our enum
    const statusMapping: { [key: string]: string } = {
      'pending': 'PENDING',
      'paid': 'CONFIRMED',
      'partially_paid': 'PENDING',
      'refunded': 'CANCELLED',
      'voided': 'CANCELLED',
      'authorized': 'PENDING'
    };

    const fulfillmentMapping: { [key: string]: string } = {
      'fulfilled': 'DELIVERED',
      'partial': 'SHIPPED',
      'unfulfilled': 'PENDING',
      'restocked': 'CANCELLED'
    };

    const orderStatus = statusMapping[orderData.financial_status] || 'PENDING';
    
    // Calculate totals
    const totalAmount = parseFloat(orderData.total_price || '0');
    const subtotal = parseFloat(orderData.subtotal_price || '0');
    const tax = parseFloat(orderData.total_tax || '0');
    const shipping = parseFloat(orderData.shipping_price || '0');
    const discounts = parseFloat(orderData.total_discounts || '0');

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: user?.id,
        customerEmail: orderData.email,
        status: orderStatus as any,
        totalAmount,
        
        // Shopify-specific fields
        shopifyOrderId: orderId,
        shopifyOrderName: orderData.name,
        financialStatus: orderData.financial_status,
        fulfillmentStatus: orderData.fulfillment_status,
        currency: orderData.currency || 'USD',
        subtotalPrice: subtotal,
        totalTax: tax,
        shippingPrice: shipping,
        totalDiscounts: discounts,
        orderTags: orderData.tags,
        orderNote: orderData.note,
        
        // Addresses
        billingAddress: this.buildAddress(orderData, 'billing'),
        shippingAddress: this.buildAddress(orderData, 'shipping'),
        
        createdAt: orderData.created_at ? new Date(orderData.created_at) : new Date(),
        updatedAt: orderData.updated_at ? new Date(orderData.updated_at) : new Date(),
      }
    });

    // Create order items
    for (const lineItem of orderData.lineItems) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productName: lineItem.name,
          quantity: lineItem.quantity,
          price: lineItem.price,
          shopifyVariantId: lineItem.variantId,
          shopifyProductId: lineItem.productId,
          sku: lineItem.sku,
        }
      });
    }
  }

  private buildAddress(orderData: any, type: 'billing' | 'shipping'): string {
    const prefix = type === 'billing' ? 'billing' : 'shipping';
    
    const addressParts = [
      orderData[`${prefix}_name`],
      orderData[`${prefix}_street`],
      orderData[`${prefix}_city`],
      orderData[`${prefix}_province`],
      orderData[`${prefix}_country`],
      orderData[`${prefix}_zip`]
    ].filter(Boolean);

    return addressParts.join(', ');
  }
}

// CLI function
export async function runOrderMigration(csvFilePath?: string) {
  const filePath = csvFilePath || 'orders_export.csv';
  console.log(`📁 Using order CSV file: ${filePath}`);
  
  const migrator = new OrderMigrator();
  try {
    await migrator.migrateFromCSV(filePath);
    console.log('\n✅ Order migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Order migration failed:', error);
  }
} 