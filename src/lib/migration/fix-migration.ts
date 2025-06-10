import { PrismaClient } from '@prisma/client';
import { ShopifyDataParser } from './working-parser';
import path from 'path';

const prisma = new PrismaClient();

export class FixedProductMigrator {
  private parser = new ShopifyDataParser();

  async migrateFromCSV(csvFilePath: string): Promise<void> {
    console.log('🚀 Starting FIXED Shopify product migration...');
    
    try {
      // Parse CSV data
      console.log('📖 Parsing CSV file...');
      const rows = this.parser.parseCSV(csvFilePath);
      console.log(`📊 Found ${rows.length} rows in CSV`);
      
      const products = this.parser.groupProductData(rows);
      
      console.log(`📦 Found ${products.size} unique products to migrate`);

      // Get existing products to skip duplicates
      const existingProducts = await prisma.product.findMany({
        select: { handle: true }
      });
      const existingHandles = new Set(existingProducts.map(p => p.handle));
      
      console.log(`⚠️  Found ${existingHandles.size} existing products - will skip these`);
      
      // Migrate products
      let successCount = 0;
      let errorCount = 0;
      let skippedCount = 0;

      for (const [handle, productData] of products) {
        try {
          if (existingHandles.has(handle)) {
            skippedCount++;
            console.log(`⏭️  Skipped: ${handle} (already exists)`);
            continue;
          }
          
          await this.migrateProduct(productData);
          successCount++;
          console.log(`✅ Migrated: ${handle} (${productData.variants.length} variants, ${productData.images.length} images)`);
        } catch (error) {
          errorCount++;
          console.error(`❌ Failed to migrate ${handle}:`, (error as Error).message);
        }
      }

      console.log(`
🎉 Migration completed!
✅ Successful: ${successCount}
⏭️  Skipped: ${skippedCount}
❌ Failed: ${errorCount}
📊 Total: ${products.size}
      `);

    } catch (error) {
      console.error('💥 Migration failed:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  private async migrateProduct(productData: any): Promise<void> {
    // Find category
    const category = await prisma.category.findFirst({
      where: { shopifyCategory: productData.productCategory }
    });

    // Determine primary variant data for product-level fields
    const primaryVariant = productData.variants[0];
    const totalStock = productData.variants.reduce((sum: number, v: any) => sum + v.inventoryQty, 0);

    // Create product - FIXED: don't set shopifyId, let it be null
    const product = await prisma.product.create({
      data: {
        handle: productData.handle,
        title: productData.title,
        bodyHtml: productData.bodyHtml,
        vendor: productData.vendor,
        productType: productData.type,
        tags: productData.tags,
        published: productData.published,
        seoTitle: productData.seoTitle,
        seoDescription: productData.seoDescription,
        status: productData.status.toUpperCase() as any,
        categoryId: category?.id,
        
        // Legacy fields for compatibility
        name: productData.title,
        description: this.stripHtml(productData.bodyHtml),
        imageUrl: productData.images[0]?.src,
        
        // Set price from first variant or default
        price: primaryVariant?.price || 0,
        compareAtPrice: primaryVariant?.compareAtPrice,
        costPerItem: primaryVariant?.costPerItem,
        stock: totalStock,
        
        // FIXED: Don't set shopifyId - let it be null
        // shopifyId: null (this is implicit)
      }
    });

    // Create variants (only if they exist)
    if (productData.variants.length > 0) {
      for (const variantData of productData.variants) {
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            title: variantData.title,
            sku: variantData.sku,
            price: variantData.price,
            compareAtPrice: variantData.compareAtPrice,
            costPerItem: variantData.costPerItem,
            inventoryQty: variantData.inventoryQty,
            weight: variantData.weight,
            option1Value: variantData.option1Value,
            // FIXED: Don't set shopifyVariantId - let it be null
          }
        });
      }
    }

    // Create images
    for (const imageData of productData.images) {
      if (imageData.src) { // Only create if src exists
        await prisma.productImage.create({
          data: {
            productId: product.id,
            src: imageData.src,
            altText: imageData.altText,
            position: imageData.position,
            // FIXED: Don't set shopifyImageId - let it be null
          }
        });
      }
    }

    // Create metafields
    for (const metafield of productData.metafields) {
      await prisma.productMetafield.create({
        data: {
          productId: product.id,
          namespace: metafield.namespace,
          key: metafield.key,
          value: metafield.value,
          type: metafield.type,
        }
      });
    }
  }

  private stripHtml(html: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').substring(0, 500);
  }
}

// CLI function
async function main() {
  const csvFilePath = path.join(process.cwd(), 'products_export_1 (1).csv');
  console.log(`📁 Using CSV file: ${csvFilePath}`);
  console.log('🚀 Starting FIXED migration...\n');
  
  const migrator = new FixedProductMigrator();
  try {
    await migrator.migrateFromCSV(csvFilePath);
    console.log('\n✅ FIXED Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ FIXED Migration failed:', error);
  }
}

main(); 