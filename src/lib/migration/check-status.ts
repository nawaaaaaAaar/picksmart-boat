import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMigrationStatus() {
  try {
    console.log('🔍 Checking migration status...\n');
    
    // Check categories
    const categories = await prisma.category.findMany();
    console.log(`📂 Categories created: ${categories.length}`);
    if (categories.length > 0) {
      console.log('   Sample categories:');
      categories.slice(0, 5).forEach(cat => {
        console.log(`   - ${cat.name} (Level: ${cat.level})`);
      });
    }
    
    console.log();
    
    // Check products
    const products = await prisma.product.findMany();
    console.log(`📦 Products created: ${products.length}`);
    if (products.length > 0) {
      console.log('   Sample products:');
      products.slice(0, 3).forEach(prod => {
        console.log(`   - ${prod.handle}: ${prod.title} - $${prod.price}`);
      });
    }
    
    console.log();
    
    // Check variants
    const variants = await prisma.productVariant.findMany();
    console.log(`🔢 Product variants created: ${variants.length}`);
    
    // Check images
    const images = await prisma.productImage.findMany();
    console.log(`🖼️  Product images created: ${images.length}`);
    
    // Check metafields
    const metafields = await prisma.productMetafield.findMany();
    console.log(`🔧 Product metafields created: ${metafields.length}`);
    
    console.log('\n✅ Status check completed!');
    
  } catch (error) {
    console.error('❌ Error checking status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMigrationStatus(); 