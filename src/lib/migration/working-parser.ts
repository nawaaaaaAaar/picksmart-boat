import { parse } from 'csv-parse/sync';
import fs from 'fs';

export interface ShopifyProductRow {
  Handle: string;
  Title: string;
  'Body (HTML)': string;
  Vendor: string;
  'Product Category': string;
  Type: string;
  Tags: string;
  Published: string;
  'Option1 Name': string;
  'Option1 Value': string;
  'Variant SKU': string;
  'Variant Grams': string;
  'Variant Inventory Qty': string;
  'Variant Price': string;
  'Variant Compare At Price': string;
  'Image Src': string;
  'Image Position': string;
  'Image Alt Text': string;
  'SEO Title': string;
  'SEO Description': string;
  'Cost per item': string;
  Status: string;
  'Color (product.metafields.shopify.color-pattern)': string;
  'Exercise machine features (product.metafields.shopify.exercise-machine-features)': string;
  [key: string]: string;
}

export interface ParsedProduct {
  handle: string;
  title: string;
  bodyHtml: string;
  vendor: string;
  productCategory: string;
  type: string;
  tags: string[];
  published: boolean;
  seoTitle?: string;
  seoDescription?: string;
  status: 'active' | 'draft' | 'archived';
  variants: ParsedVariant[];
  images: ParsedImage[];
  metafields: ParsedMetafield[];
}

export interface ParsedVariant {
  title: string;
  sku?: string;
  price: number;
  compareAtPrice?: number;
  costPerItem?: number;
  inventoryQty: number;
  weight?: number;
  option1Value?: string;
}

export interface ParsedImage {
  src: string;
  altText?: string;
  position: number;
}

export interface ParsedMetafield {
  namespace: string;
  key: string;
  value: string;
  type: string;
}

export class ShopifyDataParser {
  parseCSV(filePath: string): ShopifyProductRow[] {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  }

  groupProductData(rows: ShopifyProductRow[]): Map<string, ParsedProduct> {
    const products = new Map<string, ParsedProduct>();

    for (const row of rows) {
      const handle = row.Handle;
      
      if (!handle) continue;

      if (!products.has(handle)) {
        products.set(handle, {
          handle,
          title: row.Title,
          bodyHtml: row['Body (HTML)'] || '',
          vendor: row.Vendor || '',
          productCategory: row['Product Category'] || '',
          type: row.Type || '',
          tags: row.Tags ? row.Tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
          published: row.Published === 'true',
          seoTitle: row['SEO Title'],
          seoDescription: row['SEO Description'],
          status: this.normalizeStatus(row.Status),
          variants: [],
          images: [],
          metafields: []
        });
      }

      const product = products.get(handle)!;

      // Add variant if price exists
      if (row['Variant Price'] && parseFloat(row['Variant Price']) > 0) {
        const variant: ParsedVariant = {
          title: row['Option1 Value'] || 'Default Title',
          sku: row['Variant SKU'] || undefined,
          price: parseFloat(row['Variant Price']) || 0,
          compareAtPrice: row['Variant Compare At Price'] ? parseFloat(row['Variant Compare At Price']) : undefined,
          costPerItem: row['Cost per item'] ? parseFloat(row['Cost per item']) : undefined,
          inventoryQty: parseInt(row['Variant Inventory Qty']) || 0,
          weight: row['Variant Grams'] ? parseFloat(row['Variant Grams']) / 1000 : undefined,
          option1Value: row['Option1 Value'] || undefined,
        };
        
        // Check for duplicates
        if (!product.variants.some(v => v.sku === variant.sku && v.option1Value === variant.option1Value)) {
          product.variants.push(variant);
        }
      }

      // Add image if exists
      if (row['Image Src']) {
        const image: ParsedImage = {
          src: row['Image Src'],
          altText: row['Image Alt Text'] || undefined,
          position: parseInt(row['Image Position']) || 1,
        };
        
        if (!product.images.some(img => img.src === image.src)) {
          product.images.push(image);
        }
      }

      // Add metafields
      this.extractMetafields(row, product);
    }

    // Sort images by position
    for (const product of products.values()) {
      product.images.sort((a, b) => a.position - b.position);
    }

    return products;
  }

  private extractMetafields(row: ShopifyProductRow, product: ParsedProduct): void {
    // Color metafield
    const colorValue = row['Color (product.metafields.shopify.color-pattern)'];
    if (colorValue && !product.metafields.some(m => m.key === 'color-pattern')) {
      product.metafields.push({
        namespace: 'shopify',
        key: 'color-pattern',
        value: colorValue,
        type: 'string'
      });
    }

    // Exercise features metafield
    const exerciseValue = row['Exercise machine features (product.metafields.shopify.exercise-machine-features)'];
    if (exerciseValue && !product.metafields.some(m => m.key === 'exercise-machine-features')) {
      product.metafields.push({
        namespace: 'shopify',
        key: 'exercise-machine-features',
        value: exerciseValue,
        type: 'string'
      });
    }
  }

  private normalizeStatus(status: string): 'active' | 'draft' | 'archived' {
    if (!status) return 'active';
    const normalized = status.toLowerCase().trim();
    if (normalized === 'active') return 'active';
    if (normalized === 'draft') return 'draft';
    if (normalized === 'archived') return 'archived';
    return 'active';
  }
} 