import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';

async function testCSVParsing() {
  try {
    const csvFilePath = path.join(process.cwd(), 'products_export_1 (1).csv');
    console.log('📁 Reading CSV file:', csvFilePath);
    
    const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
    const rows = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    
    console.log(`📊 Found ${rows.length} rows in CSV`);
    console.log('📋 Sample row keys:', Object.keys(rows[0]));
    
    // Group by handle to count unique products
    const handles = new Set();
    for (const row of rows) {
      if (row.Handle) {
        handles.add(row.Handle);
      }
    }
    
    console.log(`🏷️  Found ${handles.size} unique product handles`);
    
    // Show first few products
    console.log('\n🔍 First 5 products:');
    let count = 0;
    for (const handle of handles) {
      if (count >= 5) break;
      const productRows = rows.filter((r: any) => r.Handle === handle);
      console.log(`  📦 ${handle}: ${productRows[0].Title} (${productRows.length} rows)`);
      count++;
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testCSVParsing(); 