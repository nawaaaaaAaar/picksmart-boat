import { PrismaClient } from '@prisma/client';
import { ShopifyDataParser, ParsedProduct } from './shopify-parser';

const prisma = new PrismaClient();

export class ProductMigrator {
  private parser = new ShopifyDataParser();

  async migrateFromCSV(csvFilePath: string): Promise<void> {
    console.log('🚀 Starting Shopify product migration...');
    
    try {
      // Parse CSV data
      console.log('📖 Parsing CSV file...');
      const rows = this.parser.parseCSV(csvFilePath);
      console.log(`📊 Found ${rows.length} rows in CSV`);
      
      const products = this.parser.groupProductData(rows);
      
      console.log(`📦 Found ${products.size} unique products to migrate`);

      // Migrate categories first
      await this.migrateCategories(products);
      
      // Migrate products
      let successCount = 0;
      let errorCount = 0;

      for (const [handle, productData] of products) {
        try {
          await this.migrateProduct(productData);
          successCount++;
          console.log(`✅ Migrated: ${handle} (${productData.variants.length} variants, ${productData.images.length} images)`);
        } catch (error) {
          errorCount++;
          console.error(`❌ Failed to migrate ${handle}:`, error);
        }
      }

      console.log(`
🎉 Migration completed!
✅ Successful: ${successCount}
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

  private async migrateCategories(products: Map<string, ParsedProduct>): Promise<void> {
    console.log('📂 Creating categories...');
    
    const categories = new Set<string>();
    
    // Collect all unique categories
    for (const product of products.values()) {
      if (product.productCategory) {
        // Split category path (e.g., "Sporting Goods > Fitness > Treadmills")
        const categoryPath = product.productCategory.split(' > ');
        for (let i = 0; i < categoryPath.length; i++) {
          categories.add(categoryPath.slice(0, i + 1).join(' > '));
        }
      }
    }

    console.log(`📁 Found ${categories.size} unique categories`);

    // Create categories hierarchically
    const sortedCategories = Array.from(categories).sort();
    for (const categoryPath of sortedCategories) {
      await this.createCategoryHierarchy(categoryPath);
    }

    console.log(`✅ Categories created successfully`);
  }

  private async createCategoryHierarchy(categoryPath: string): Promise<void> {
    const parts = categoryPath.split(' > ');
    const categoryName = parts[parts.length - 1];
    const parentPath = parts.length > 1 ? parts.slice(0, -1).join(' > ') : null;

    // Check if category already exists
    const existing = await prisma.category.findFirst({
      where: { shopifyCategory: categoryPath }
    });

    if (existing) return;

    // Find parent category
    let parentId: string | undefined;
    if (parentPath) {
      const parent = await prisma.category.findFirst({
        where: { shopifyCategory: parentPath }
      });
      parentId = parent?.id;
    }

    // Generate unique name and slug for categories with same names at different levels
    const uniqueName = parts.length > 1 ? `${categoryName} (${parts[parts.length - 2]})` : categoryName;
    const baseSlug = this.generateSlug(categoryName);
    
    // Check if name/slug exists and make them unique
    let finalName = categoryName;
    let finalSlug = baseSlug;
    
    const existingWithSameName = await prisma.category.findFirst({
      where: { name: categoryName }
    });
    
    if (existingWithSameName) {
      finalName = uniqueName;
      finalSlug = this.generateSlug(uniqueName);
    }

    // Create category
    await prisma.category.create({
      data: {
        name: finalName,
        slug: finalSlug,
        shopifyCategory: categoryPath,
        parentId,
        level: parts.length - 1,
      }
    });

    console.log(`📁 Created category: ${categoryPath}`);
  }

  private async migrateProduct(productData: ParsedProduct): Promise<void> {
    // Find category
    const category = await prisma.category.findFirst({
      where: { shopifyCategory: productData.productCategory }
    });

    // Check if product already exists
    const existingProduct = await prisma.product.findUnique({
      where: { handle: productData.handle }
    });

    if (existingProduct) {
      console.log(`⚠️  Product ${productData.handle} already exists, skipping...`);
      return;
    }

    // Determine primary variant data for product-level fields
    const primaryVariant = productData.variants[0];
    const totalStock = productData.variants.reduce((sum, v) => sum + v.inventoryQty, 0);

    // Create product
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
          }
        });
      }
    }

    // Create metafields
    for (const metafieldData of productData.metafields) {
      if (metafieldData.value) { // Only create if value exists
        await prisma.productMetafield.create({
          data: {
            productId: product.id,
            namespace: metafieldData.namespace,
            key: metafieldData.key,
            value: metafieldData.value,
            type: metafieldData.type,
          }
        });
      }
    }
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private stripHtml(html: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  }

  // Utility method to test the parser without full migration
  async testParser(csvFilePath: string, maxProducts = 5): Promise<void> {
    console.log('🧪 Testing CSV parser...');
    
    const rows = this.parser.parseCSV(csvFilePath);
    const products = this.parser.groupProductData(rows);
    
    console.log(`📊 Total products found: ${products.size}`);
    
    let count = 0;
    for (const [handle, product] of products) {
      if (count >= maxProducts) break;
      
      console.log(`\n📦 Product: ${handle}`);
      console.log(`  Title: ${product.title}`);
      console.log(`  Vendor: ${product.vendor}`);
      console.log(`  Category: ${product.productCategory}`);
      console.log(`  Tags: ${product.tags.join(', ')}`);
      console.log(`  Variants: ${product.variants.length}`);
      console.log(`  Images: ${product.images.length}`);
      console.log(`  Metafields: ${product.metafields.length}`);
      
      if (product.variants.length > 0) {
        console.log(`  First variant: ${product.variants[0].title} - $${product.variants[0].price}`);
      }
      
      count++;
    }
  }
}

// Export for direct usage
export async function migrateShopifyData(csvFilePath: string) {
  const migrator = new ProductMigrator();
  await migrator.migrateFromCSV(csvFilePath);
}

export async function testShopifyParser(csvFilePath: string, maxProducts = 5) {
  const migrator = new ProductMigrator();
  await migrator.testParser(csvFilePath, maxProducts);
} 