#!/usr/bin/env node
import { ProductMigrator } from './migrate-products';
import { runCustomerMigration } from './customer-migrator';
import { runOrderMigration } from './order-migrator';
import path from 'path';
import fs from 'fs';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'migrate':
    case 'products':
      await runProductMigration();
      break;
    case 'customers':
      await runCustomers(args[1]);
      break;
    case 'orders':
      await runOrders(args[1]);
      break;
    case 'all':
      await runFullMigration();
      break;
    case 'test':
      await runTest();
      break;
    case 'help':
    default:
      showHelp();
      break;
  }
}

async function runProductMigration() {
  const csvFilePath = process.argv[3] || path.join(process.cwd(), 'products_export_1 (1).csv');
  
  console.log(`📁 Using CSV file: ${csvFilePath}`);
  console.log('📦 Starting product migration...\n');
  
  const migrator = new ProductMigrator();
  try {
    await migrator.migrateFromCSV(csvFilePath);
    console.log('\n✅ Product migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Product migration failed:', error);
    process.exit(1);
  }
}

async function runCustomers(filePath?: string) {
  const csvFilePath = filePath || path.join(process.cwd(), 'customers_export.csv');
  
  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ Customer file not found: ${csvFilePath}`);
    console.log('Please export customers from Shopify and place the CSV file in the project root.');
    process.exit(1);
  }
  
  console.log(`📁 Using customer CSV file: ${csvFilePath}`);
  console.log('👥 Starting customer migration...\n');
  
  try {
    await runCustomerMigration(csvFilePath);
    console.log('\n✅ Customer migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Customer migration failed:', error);
    process.exit(1);
  }
}

async function runOrders(filePath?: string) {
  const csvFilePath = filePath || path.join(process.cwd(), 'orders_export.csv');
  
  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ Order file not found: ${csvFilePath}`);
    console.log('Please export orders from Shopify and place the CSV file in the project root.');
    process.exit(1);
  }
  
  console.log(`📁 Using order CSV file: ${csvFilePath}`);
  console.log('📦 Starting order migration...\n');
  
  try {
    await runOrderMigration(csvFilePath);
    console.log('\n✅ Order migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Order migration failed:', error);
    process.exit(1);
  }
}

async function runFullMigration() {
  console.log('🎯 Starting FULL Shopify migration...\n');
  
  try {
    // 1. Migrate products
    console.log('📦 Step 1: Migrating products...');
    const productFile = path.join(process.cwd(), 'products_export_1 (1).csv');
    const productMigrator = new ProductMigrator();
    await productMigrator.migrateFromCSV(productFile);
    console.log('✅ Products migrated successfully!');
    
    // 2. Migrate customers (if file exists)
    const customerFile = path.join(process.cwd(), 'customers_export.csv');
    if (fs.existsSync(customerFile)) {
      console.log('\n👥 Step 2: Migrating customers...');
      await runCustomerMigration(customerFile);
      console.log('✅ Customers migrated successfully!');
    } else {
      console.log('\n⚠️  Step 2: Skipping customers (customers_export.csv not found)');
    }
    
    // 3. Migrate orders (if file exists)
    const orderFile = path.join(process.cwd(), 'orders_export.csv');
    if (fs.existsSync(orderFile)) {
      console.log('\n📋 Step 3: Migrating orders...');
      await runOrderMigration(orderFile);
      console.log('✅ Orders migrated successfully!');
    } else {
      console.log('\n⚠️  Step 3: Skipping orders (orders_export.csv not found)');
    }
    
    console.log('\n🎉 FULL migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('  1. Set up Shopify webhooks (see webhook setup guide)');
    console.log('  2. Test webhook endpoints: /api/webhooks/shopify');
    console.log('  3. Validate migrated data in database');
    console.log('  4. Set up real-time sync monitoring');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Full migration failed:', error);
    process.exit(1);
  }
}

async function runTest() {
  const csvFilePath = process.argv[3] || path.join(process.cwd(), 'products_export_1 (1).csv');
  const maxProducts = parseInt(process.argv[4]) || 5;
  
  console.log(`📁 Using CSV file: ${csvFilePath}`);
  console.log(`🧪 Testing parser with max ${maxProducts} products...\n`);
  
  const migrator = new ProductMigrator();
  try {
    await migrator.testParser(csvFilePath, maxProducts);
    console.log('\n✅ Test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🏪 Shopify to MongoDB Migration Tool - Phase 1.5 Complete

Usage:
  npm run migrate:shopify <command> [options]

Commands:
  products [csv-file]        - Migrate products only (default)
  customers [csv-file]       - Migrate customers from CSV
  orders [csv-file]          - Migrate orders from CSV  
  all                        - Run full migration (products + customers + orders)
  test [csv-file] [max]      - Test parser (default: 5 products)
  help                       - Show this help

Examples:
  npm run migrate:shopify products
  npm run migrate:shopify customers customers_export.csv
  npm run migrate:shopify orders orders_export.csv
  npm run migrate:shopify all
  npm run migrate:shopify test ./my-products.csv 10

Expected Files:
  📦 products_export_1 (1).csv (required - ✅ exists)
  👥 customers_export.csv (optional)
  📋 orders_export.csv (optional)

🔧 Before running migration:
  1. Ensure your database is running
  2. Run: npx prisma generate
  3. Check your DATABASE_URL in .env
  
📊 What gets migrated:
  ✅ Products with variants, images, metafields
  ✅ Categories (hierarchical structure)
  ✅ Customers with Shopify fields
  ✅ Order history with line items
  ✅ SEO data and inventory
  
🔄 Real-time Sync (Webhooks):
  Setup webhooks in Shopify Admin → Settings → Notifications
  Endpoint: https://yourdomain.com/api/webhooks/shopify
  Events: products/*, orders/*, customers/*
  `);
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 