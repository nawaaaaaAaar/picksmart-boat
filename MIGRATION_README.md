# 🏪 Shopify to MongoDB Migration Guide

This guide will help you migrate your Shopify product data to your MongoDB database.

## 📋 Prerequisites

1. **Database Setup**: Ensure your MongoDB database is running
2. **Environment**: Make sure your `.env` file has the correct `DATABASE_URL`
3. **Dependencies**: All required packages should be installed

## 🚀 Quick Start

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Generate Prisma Client
```bash
npx prisma generate
```

### Step 3: Test the Migration (Recommended)
```bash
npm run migrate:test
```

### Step 4: Run Full Migration
```bash
npm run migrate:shopify migrate
```

## 📊 What Gets Migrated

### ✅ Products
- **Basic Info**: Title, description (HTML), vendor, type
- **SEO Data**: Meta title, meta description
- **Pricing**: Price, compare at price, cost per item
- **Publishing**: Status (active/draft/archived), published state
- **Tags**: All product tags as array

### ✅ Product Variants
- **Options**: Up to 3 option types (color, size, etc.)
- **Pricing**: Variant-specific pricing
- **Inventory**: Stock quantity, inventory policy
- **Physical**: Weight, shipping requirements
- **SKU & Barcode**: Product identification

### ✅ Categories
- **Hierarchical Structure**: Parent-child relationships
- **Shopify Mapping**: Original category paths preserved
- **Auto-generated Slugs**: URL-friendly category slugs

### ✅ Images
- **Multiple Images**: All product images with positions
- **Alt Text**: SEO-friendly alternative text
- **Proper Ordering**: Images sorted by position

### ✅ Metafields
- **Color Patterns**: Product color information
- **Exercise Features**: Fitness equipment specifications
- **Custom Fields**: Any other Shopify metafields

## 🛠 Migration Commands

### Test Parser (Recommended First)
```bash
# Test with default 5 products
npm run migrate:test

# Test with custom number of products
npm run migrate:shopify test ./your-file.csv 10
```

### Full Migration
```bash
# Use default CSV file (products_export_1 (1).csv)
npm run migrate:shopify migrate

# Use custom CSV file
npm run migrate:shopify migrate ./path/to/your/products.csv
```

### Help
```bash
npm run migrate:help
```

## 📁 File Structure

```
src/lib/migration/
├── shopify-parser.ts    # CSV parsing and data transformation
├── migrate-products.ts  # Database migration logic
└── cli.ts              # Command-line interface
```

## 🔍 Migration Process

### Phase 1: Data Parsing
1. **CSV Reading**: Parses your Shopify CSV export
2. **Data Grouping**: Groups variants and images by product
3. **Validation**: Ensures data integrity

### Phase 2: Category Creation
1. **Path Analysis**: Extracts category hierarchies
2. **Parent-Child Mapping**: Creates proper relationships
3. **Slug Generation**: Creates URL-friendly slugs

### Phase 3: Product Migration
1. **Product Creation**: Main product records
2. **Variant Creation**: All product variants
3. **Image Assignment**: Product images with positions
4. **Metafield Storage**: Custom field data

## 📈 Expected Results

After successful migration, you'll have:

- **Products**: `~40-50` products (based on your CSV)
- **Categories**: Hierarchical structure (Sporting Goods > Fitness > Treadmills, etc.)
- **Variants**: Color/size/type variations
- **Images**: Multiple product images
- **Rich Data**: SEO, pricing, inventory, specifications

## 🐛 Troubleshooting

### Common Issues

#### 1. Database Connection Error
```bash
Error: PrismaClientInitializationError
```
**Solution**: Check your `DATABASE_URL` in `.env` file

#### 2. CSV File Not Found
```bash
Error: ENOENT: no such file or directory
```
**Solution**: Verify the CSV file path or place it in the root directory

#### 3. Schema Validation Error
```bash
Error: Invalid enum value
```
**Solution**: Run `npx prisma generate` to update the client

#### 4. Duplicate Product Error
```bash
Error: Unique constraint failed
```
**Solution**: Products with existing handles are skipped automatically

### Debug Mode

For detailed logging, you can modify the migration scripts or check:
- Console output during migration
- Database records using Prisma Studio: `npm run db:studio`

## 📊 Data Mapping

### Shopify → MongoDB Field Mapping

| Shopify Field | MongoDB Field | Notes |
|---------------|---------------|-------|
| Handle | `handle` | Unique identifier |
| Title | `title` | Product name |
| Body (HTML) | `bodyHtml` | Rich description |
| Vendor | `vendor` | Brand/manufacturer |
| Product Category | `category` | Hierarchical mapping |
| Variant Price | `variants.price` | Per-variant pricing |
| Image Src | `images.src` | Image URLs |
| SEO Title | `seoTitle` | Meta title |

## 🔄 Re-running Migration

If you need to re-run the migration:

1. **Clear existing data** (optional):
   ```bash
   # Use Prisma Studio to delete records
   npm run db:studio
   ```

2. **Re-run migration**:
   ```bash
   npm run migrate:shopify migrate
   ```

**Note**: Products with existing handles will be skipped to prevent duplicates.

## 📞 Support

If you encounter issues:

1. Check the console output for specific error messages
2. Verify your CSV file format matches Shopify export format
3. Ensure all dependencies are installed
4. Check database connectivity

## 🎯 Next Steps

After successful migration:

1. **Verify Data**: Use Prisma Studio to check migrated data
2. **Update UI**: Modify your frontend to use the new schema
3. **Test Functionality**: Ensure all features work with migrated data
4. **Set up Webhooks**: For real-time sync (next phase)

---

🎉 **Congratulations!** Your Shopify data should now be successfully migrated to MongoDB! 