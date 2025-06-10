import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface ShopifyCustomer {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  created_at: string;
  updated_at: string;
  accepts_marketing: string;
  total_spent: string;
  order_count: string;
  state: string;
  tags: string;
  note: string;
  verified_email: string;
  default_address_first_name: string;
  default_address_last_name: string;
  default_address_company: string;
  default_address_address1: string;
  default_address_address2: string;
  default_address_city: string;
  default_address_province: string;
  default_address_country: string;
  default_address_zip: string;
  default_address_phone: string;
}

export class CustomerMigrator {
  async migrateFromCSV(csvFilePath: string): Promise<void> {
    console.log('👥 Starting Shopify customer migration...');
    
    try {
      // Parse CSV data
      const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
      const customers: ShopifyCustomer[] = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      console.log(`📊 Found ${customers.length} customers to migrate`);

      // Get existing users to skip duplicates
      const existingUsers = await prisma.user.findMany({
        select: { email: true }
      });
      const existingEmails = new Set(existingUsers.map(u => u.email));
      
      console.log(`⚠️  Found ${existingEmails.size} existing users - will skip these`);

      let successCount = 0;
      let errorCount = 0;
      let skippedCount = 0;

      for (const customer of customers) {
        try {
          if (!customer.email || existingEmails.has(customer.email)) {
            skippedCount++;
            console.log(`⏭️  Skipped: ${customer.email || 'No email'}`);
            continue;
          }

          await this.migrateCustomer(customer);
          successCount++;
          console.log(`✅ Migrated: ${customer.email}`);
        } catch (error) {
          errorCount++;
          console.error(`❌ Failed to migrate ${customer.email}:`, (error as Error).message);
        }
      }

      console.log(`
🎉 Customer migration completed!
✅ Successful: ${successCount}
⏭️  Skipped: ${skippedCount}
❌ Failed: ${errorCount}
📊 Total: ${customers.length}
      `);

    } catch (error) {
      console.error('💥 Customer migration failed:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  private async migrateCustomer(customer: ShopifyCustomer): Promise<void> {
    // Generate a default password (users will need to reset)
    const defaultPassword = await bcrypt.hash('shopify-migration-temp', 10);

    const userData = {
      email: customer.email,
      password: defaultPassword,
      firstName: customer.first_name || '',
      lastName: customer.last_name || '',
      phone: customer.phone || '',
      
      // Shopify-specific fields
      shopifyCustomerId: customer.id,
      acceptsMarketing: customer.accepts_marketing === 'yes',
      totalSpent: parseFloat(customer.total_spent || '0'),
      orderCount: parseInt(customer.order_count || '0'),
      customerTags: customer.tags,
      customerNote: customer.note,
      verifiedEmail: customer.verified_email === 'yes',
      
      // Address information
      address: this.buildAddress(customer),
      
      createdAt: customer.created_at ? new Date(customer.created_at) : new Date(),
      updatedAt: customer.updated_at ? new Date(customer.updated_at) : new Date(),
    };

    await prisma.user.create({ data: userData });
  }

  private buildAddress(customer: ShopifyCustomer): string {
    const addressParts = [
      customer.default_address_address1,
      customer.default_address_address2,
      customer.default_address_city,
      customer.default_address_province,
      customer.default_address_country,
      customer.default_address_zip
    ].filter(Boolean);

    return addressParts.join(', ');
  }
}

// CLI function
export async function runCustomerMigration(csvFilePath?: string) {
  const filePath = csvFilePath || 'customers_export.csv';
  console.log(`📁 Using customer CSV file: ${filePath}`);
  
  const migrator = new CustomerMigrator();
  try {
    await migrator.migrateFromCSV(filePath);
    console.log('\n✅ Customer migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Customer migration failed:', error);
  }
} 