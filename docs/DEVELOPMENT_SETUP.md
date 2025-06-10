# 🛠️ Development Setup Guide

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Project Structure](#project-structure)
- [Database Setup](#database-setup)
- [Payment Gateway Setup](#payment-gateway-setup)
- [Development Workflow](#development-workflow)
- [Testing Setup](#testing-setup)
- [Debugging](#debugging)
- [Performance Optimization](#performance-optimization)
- [Deployment Preparation](#deployment-preparation)

## Prerequisites

### Required Software
- **Node.js**: Version 20+ (LTS recommended)
- **npm**: Version 9+ (comes with Node.js)
- **Git**: Latest version
- **VS Code**: Recommended IDE with extensions
- **MongoDB**: Version 7.2+ (or MongoDB Atlas account)
- **Redis**: Version 7.2+ (or Redis Cloud account)

### VS Code Extensions
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode.vscode-json",
    "rangav.vscode-thunder-client",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-todo-highlight",
    "gruntfuggly.todo-tree"
  ]
}
```

### VS Code Settings
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "typescript",
    "typescriptreact": "typescriptreact"
  },
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

## Environment Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-org/picksmart-stores.git
cd picksmart-stores
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install workspace dependencies (if using monorepo)
npm run install:all
```

### 3. Environment Variables
Create environment files for different stages:

#### `.env.local` (Development)
```env
# App Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# Database
DATABASE_URL="mongodb://localhost:27017/picksmart_dev"
REDIS_URL="redis://localhost:6379"

# Authentication
NEXTAUTH_SECRET="your-development-secret-key"
NEXTAUTH_URL="http://localhost:3000"
JWT_SECRET="your-jwt-secret"

# Payment Gateways - Sandbox/Test Keys
TAP_SECRET_KEY="sk_test_your_tap_secret_key"
TAP_PUBLIC_KEY="pk_test_your_tap_public_key"
QPAY_MERCHANT_ID="test_merchant_id"
QPAY_SECRET_KEY="test_secret_key"
DIBSY_API_KEY="test_dibsy_api_key"
STRIPE_SECRET_KEY="sk_test_your_stripe_secret"
STRIPE_PUBLIC_KEY="pk_test_your_stripe_public"

# Qatar Post API
QATAR_POST_API_KEY="test_qatar_post_key"
QATAR_POST_ENDPOINT="https://api-test.qpost.qa"

# File Storage (AWS S3)
AWS_ACCESS_KEY_ID="your_aws_access_key"
AWS_SECRET_ACCESS_KEY="your_aws_secret_key"
AWS_S3_BUCKET="picksmart-dev-assets"
AWS_REGION="me-south-1"

# Email Service (SendGrid)
SENDGRID_API_KEY="your_sendgrid_api_key"
SENDGRID_FROM_EMAIL="dev@picksmartstores.com"

# SMS Gateway
SMS_GATEWAY_API_KEY="your_sms_api_key"
SMS_GATEWAY_SENDER="PickSmart"

# External APIs
GOOGLE_ANALYTICS_ID="GA-XXXXXXXXX"
FACEBOOK_PIXEL_ID="your_facebook_pixel_id"

# Development Tools
NEXT_PUBLIC_ENVIRONMENT="development"
DEBUG="picksmart:*"
LOG_LEVEL="debug"
```

#### `.env.staging`
```env
NODE_ENV=staging
NEXT_PUBLIC_APP_URL=https://staging.picksmartstores.com
NEXT_PUBLIC_API_URL=https://staging-api.picksmartstores.com/api/v1
# ... other staging configurations
```

#### `.env.production`
```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://picksmartstores.com
NEXT_PUBLIC_API_URL=https://api.picksmartstores.com/api/v1
# ... other production configurations
```

### 4. Install Development Tools
```bash
# Install global tools
npm install -g @vercel/cli
npm install -g prisma
npm install -g nodemon
npm install -g concurrently

# Install database tools
npm install -g mongodb-tools
```

## Project Structure

### Monorepo Structure (Recommended)
```
picksmart-stores/
├── apps/
│   ├── web/                    # Next.js frontend
│   ├── api/                    # Express.js backend
│   └── admin/                  # Admin dashboard
├── packages/
│   ├── ui/                     # Shared UI components
│   ├── config/                 # Shared configurations
│   ├── types/                  # TypeScript definitions
│   └── utils/                  # Shared utilities
├── tools/
│   ├── build/                  # Build scripts
│   ├── docker/                 # Docker configurations
│   └── scripts/                # Development scripts
├── docs/                       # Documentation
├── tests/                      # Test files
├── .github/                    # GitHub workflows
├── package.json
├── turbo.json                  # Turborepo configuration
└── README.md
```

### Frontend Structure (apps/web/)
```
apps/web/
├── app/                        # Next.js App Router
│   ├── (auth)/                # Auth routes group
│   ├── (shop)/                # Shop routes group
│   ├── (account)/             # Account routes group
│   ├── admin/                 # Admin routes
│   ├── api/                   # API routes
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Home page
│   └── not-found.tsx          # 404 page
├── components/                 # React components
│   ├── ui/                    # Base UI components
│   ├── forms/                 # Form components
│   ├── layout/                # Layout components
│   └── features/              # Feature-specific components
├── lib/                       # Utility libraries
│   ├── auth.ts               # Auth configuration
│   ├── db.ts                 # Database client
│   ├── utils.ts              # General utilities
│   └── validations.ts        # Form validations
├── hooks/                     # Custom React hooks
├── store/                     # State management
├── styles/                    # Additional styles
├── types/                     # TypeScript types
├── middleware.ts              # Next.js middleware
├── next.config.js             # Next.js configuration
├── tailwind.config.js         # Tailwind configuration
└── tsconfig.json              # TypeScript configuration
```

### Backend Structure (apps/api/)
```
apps/api/
├── src/
│   ├── routes/                # API routes
│   ├── controllers/           # Route controllers
│   ├── services/              # Business logic
│   ├── models/                # Database models
│   ├── middleware/            # Express middleware
│   ├── utils/                 # Utility functions
│   ├── types/                 # TypeScript types
│   ├── config/                # Configuration files
│   └── app.ts                 # Express app setup
├── prisma/                    # Database schema
│   ├── schema.prisma          # Prisma schema
│   ├── migrations/            # Database migrations
│   └── seed.ts                # Database seeding
├── tests/                     # Test files
├── package.json
└── tsconfig.json
```

## Database Setup

### MongoDB Setup

#### Local MongoDB Installation
```bash
# macOS (using Homebrew)
brew tap mongodb/brew
brew install mongodb-community

# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### MongoDB Atlas Setup (Recommended)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create new cluster (M0 free tier for development)
3. Configure network access (allow your IP)
4. Create database user
5. Get connection string

### Redis Setup

#### Local Redis Installation
```bash
# macOS (using Homebrew)
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt update
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Test Redis connection
redis-cli ping
```

#### Redis Cloud Setup (Alternative)
1. Create account at [Redis Cloud](https://redis.com/redis-enterprise-cloud/)
2. Create new database
3. Get connection details

### Database Initialization
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (development)
npx prisma db push

# Run migrations (production)
npx prisma migrate deploy

# Seed database with sample data
npm run db:seed

# Open Prisma Studio (database browser)
npx prisma studio
```

### Sample Data Seeding
Create `prisma/seed.ts`:
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create sample categories
  const audioCategory = await prisma.category.create({
    data: {
      name: {
        en: 'Audio & Headphones',
        ar: 'الصوتيات والسماعات'
      },
      slug: {
        en: 'audio-headphones',
        ar: 'الصوتيات-والسماعات'
      },
      isActive: true,
      order: 1
    }
  });

  // Create sample products
  await prisma.product.create({
    data: {
      sku: 'WE-PRO-001',
      name: {
        en: 'Wireless Earbuds Pro',
        ar: 'سماعات لاسلكية برو'
      },
      description: {
        en: 'Premium wireless earbuds with noise cancellation',
        ar: 'سماعات لاسلكية مميزة مع إلغاء الضوضاء'
      },
      price: {
        amount: 299,
        currency: 'QAR',
        vatIncluded: true
      },
      categories: {
        connect: { id: audioCategory.id }
      },
      inventory: {
        inStock: true,
        quantity: 100,
        lowStockThreshold: 10
      },
      status: 'published',
      featured: true
    }
  });

  console.log('Database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

## Payment Gateway Setup

### Tap Payments Setup
1. Create account at [Tap Payments](https://www.tap.company)
2. Get API keys from dashboard
3. Configure webhook endpoint: `https://yourdomain.com/api/webhooks/tap`
4. Test with sandbox environment

### QPAY Setup
1. Contact Qatar National Payment Gateway
2. Complete merchant onboarding
3. Get merchant ID and secret key
4. Configure test environment

### Stripe Setup (International)
1. Create account at [Stripe](https://stripe.com)
2. Get API keys
3. Configure webhook endpoint
4. Test with test cards

### Payment Gateway Testing
```typescript
// Test payment integration
import { PaymentService } from '../services/payment';

const paymentService = new PaymentService();

// Test Tap Payments
const tapResult = await paymentService.processPayment('tap', {
  amount: 100,
  currency: 'QAR',
  orderId: 'test_order_123',
  customer: {
    email: 'test@example.com',
    name: 'Test Customer'
  }
});

console.log('Tap Payment Result:', tapResult);
```

## Development Workflow

### 1. Start Development Servers
```bash
# Start all services concurrently
npm run dev

# Or start individually
npm run dev:web          # Frontend (Next.js)
npm run dev:api          # Backend (Express)
npm run dev:admin        # Admin dashboard
```

### 2. Development Scripts
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:web\" \"npm run dev:api\"",
    "dev:web": "cd apps/web && npm run dev",
    "dev:api": "cd apps/api && npm run dev",
    "build": "turbo run build",
    "build:web": "cd apps/web && npm run build",
    "build:api": "cd apps/api && npm run build",
    "test": "turbo run test",
    "test:web": "cd apps/web && npm run test",
    "test:api": "cd apps/api && npm run test",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check",
    "db:studio": "prisma studio",
    "db:seed": "cd apps/api && npx prisma db seed",
    "db:migrate": "cd apps/api && npx prisma migrate dev",
    "db:reset": "cd apps/api && npx prisma migrate reset"
  }
}
```

### 3. Git Workflow
```bash
# Create feature branch
git checkout -b feature/product-catalog

# Make changes and commit
git add .
git commit -m "feat: add product catalog with Arabic support"

# Push and create PR
git push origin feature/product-catalog
```

### 4. Commit Message Convention
```
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting changes
refactor: code refactoring
test: add or update tests
chore: maintenance tasks
```

## Testing Setup

### Unit Testing (Jest + React Testing Library)
```bash
# Install testing dependencies
npm install -D jest @testing-library/react @testing-library/jest-dom
```

#### Jest Configuration (`jest.config.js`)
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1'
  },
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

#### Sample Test
```typescript
// components/__tests__/ProductCard.test.tsx
import { render, screen } from '@testing-library/react';
import { ProductCard } from '../ProductCard';

const mockProduct = {
  id: '1',
  name: { en: 'Test Product', ar: 'منتج تجريبي' },
  price: { amount: 100, currency: 'QAR' },
  images: [{ url: '/test.jpg', alt: { en: 'Test', ar: 'تجربة' } }]
};

describe('ProductCard', () => {
  it('renders product name in English', () => {
    render(<ProductCard product={mockProduct} locale="en" />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('renders product name in Arabic', () => {
    render(<ProductCard product={mockProduct} locale="ar" />);
    expect(screen.getByText('منتج تجريبي')).toBeInTheDocument();
  });

  it('applies RTL direction for Arabic', () => {
    render(<ProductCard product={mockProduct} locale="ar" />);
    const card = screen.getByTestId('product-card');
    expect(card).toHaveAttribute('dir', 'rtl');
  });
});
```

### E2E Testing (Playwright)
```bash
# Install Playwright
npm install -D @playwright/test
npx playwright install
```

#### Playwright Configuration
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 2,
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: { browserName: 'chromium' }
    },
    {
      name: 'Mobile Safari',
      use: { 
        browserName: 'webkit',
        viewport: { width: 375, height: 667 }
      }
    }
  ]
});
```

#### Sample E2E Test
```typescript
// tests/e2e/product-catalog.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Product Catalog', () => {
  test('should display products in grid layout', async ({ page }) => {
    await page.goto('/products');
    
    // Check if products are displayed
    await expect(page.locator('[data-testid="product-card"]')).toHaveCount(20);
    
    // Test search functionality
    await page.fill('[data-testid="search-input"]', 'wireless');
    await page.click('[data-testid="search-button"]');
    
    // Verify search results
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
  });

  test('should support Arabic language', async ({ page }) => {
    await page.goto('/ar/products');
    
    // Check RTL direction
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    
    // Check Arabic text
    await expect(page.locator('h1')).toContainText('المنتجات');
  });
});
```

## Debugging

### VS Code Debug Configuration
Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    },
    {
      "name": "Debug API Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/apps/api/src/app.ts",
      "env": {
        "NODE_ENV": "development"
      },
      "runtimeArgs": ["-r", "ts-node/register"]
    }
  ]
}
```

### Database Debugging
```bash
# MongoDB debug commands
mongosh "mongodb://localhost:27017/picksmart_dev"

# Check collections
show collections

# Find products
db.products.find().pretty()

# Check indexes
db.products.getIndexes()
```

### Redis Debugging
```bash
# Redis CLI commands
redis-cli

# Check all keys
KEYS *

# Get specific key
GET cart:user123

# Monitor Redis activity
MONITOR
```

## Performance Optimization

### Bundle Analysis
```bash
# Analyze Next.js bundle
npm run build
npm run analyze

# Check bundle size
npx bundlesize
```

### Image Optimization
```bash
# Install image optimization tools
npm install -D imagemin imagemin-webp imagemin-mozjpeg

# Optimize images script
npm run optimize:images
```

### Performance Monitoring
```typescript
// Performance monitoring setup
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to your analytics service
  gtag('event', metric.name, {
    event_category: 'Web Vitals',
    value: Math.round(metric.value),
    non_interaction: true,
  });
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

## Deployment Preparation

### Production Build
```bash
# Build all applications
npm run build

# Test production build locally
npm run start

# Check build output
npm run build:analyze
```

### Environment Validation
```typescript
// Environment validation script
const requiredEnvVars = [
  'DATABASE_URL',
  'REDIS_URL',
  'NEXTAUTH_SECRET',
  'TAP_SECRET_KEY',
  'QPAY_MERCHANT_ID'
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});
```

### Pre-deployment Checklist
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates configured
- [ ] CDN setup completed
- [ ] Monitoring configured
- [ ] Backup strategy implemented
- [ ] Performance benchmarks met

This development setup guide provides everything needed to get started with the Picksmart Stores project development environment. 