import { ShopifyDataParser } from './working-parser';
import path from 'path';

async function testParser() {
  try {
    const csvFilePath = path.join(process.cwd(), 'products_export_1 (1).csv');
    console.log('🧪 Testing ShopifyDataParser...\n');
    
    const parser = new ShopifyDataParser();
    
    // Parse CSV
    console.log('📖 Parsing CSV...');
    const rows = parser.parseCSV(csvFilePath);
    console.log(`✅ Parsed ${rows.length} rows`);
    
    // Group products
    console.log('📦 Grouping products...');
    const products = parser.groupProductData(rows);
    console.log(`✅ Found ${products.size} unique products\n`);
    
    // Show first 3 products
    console.log('🔍 First 3 products:');
    let count = 0;
    for (const [handle, product] of products) {
      if (count >= 3) break;
      
      console.log(`\n📦 ${handle}:`);
      console.log(`  📝 Title: ${product.title}`);
      console.log(`  🏪 Vendor: ${product.vendor}`);
      console.log(`  📂 Category: ${product.productCategory}`);
      console.log(`  🏷️  Tags: [${product.tags.join(', ')}]`);
      console.log(`  🔢 Variants: ${product.variants.length}`);
      console.log(`  🖼️  Images: ${product.images.length}`);
      console.log(`  🔧 Metafields: ${product.metafields.length}`);
      
      if (product.variants.length > 0) {
        const variant = product.variants[0];
        console.log(`  💰 First variant: ${variant.title} - $${variant.price}`);
      }
      
      count++;
    }
    
    console.log('\n✅ Parser test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testParser(); 