# 🧪 Testing Strategy Documentation

## Table of Contents
- [Testing Philosophy](#testing-philosophy)
- [Testing Pyramid](#testing-pyramid)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [End-to-End Testing](#end-to-end-testing)
- [Performance Testing](#performance-testing)
- [Security Testing](#security-testing)
- [Accessibility Testing](#accessibility-testing)
- [Cross-Browser Testing](#cross-browser-testing)
- [Mobile Testing](#mobile-testing)
- [Localization Testing](#localization-testing)
- [Payment Testing](#payment-testing)

## Testing Philosophy

### Core Principles
1. **Test Early, Test Often**: Implement testing from day one
2. **Shift Left**: Catch issues as early as possible in development
3. **Automated First**: Automate repetitive testing tasks
4. **User-Focused**: Test from user perspective
5. **Cultural Awareness**: Test for Arabic/RTL specific scenarios
6. **Payment Security**: Rigorous testing of payment flows

### Testing Objectives
- **Functionality**: All features work as specified
- **Performance**: Meet Qatar market speed requirements
- **Security**: Protect customer data and payments
- **Accessibility**: WCAG 2.1 AA compliance
- **Localization**: Proper Arabic/English support
- **Cross-Platform**: Work on all target devices and browsers

## Testing Pyramid

```
    /\
   /  \
  / E2E \     (10% - Critical user journeys)
 /______\
 \      /
  \ IT /      (20% - Service integration)
   \__/
   \  /
    \/         (70% - Component & unit tests)
   Unit
```

### Distribution Guidelines
- **70% Unit Tests**: Fast, isolated, component testing
- **20% Integration Tests**: API endpoints, database operations
- **10% E2E Tests**: Critical user journeys, payment flows

## Unit Testing

### Testing Framework: Jest + React Testing Library

#### Setup Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1'
  },
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testMatch: [
    '**/__tests__/**/*.(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)'
  ]
};
```

#### Component Testing Examples

##### Product Card Component
```typescript
// components/__tests__/ProductCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '../ProductCard';

const mockProduct = {
  id: '1',
  sku: 'WE-PRO-001',
  name: {
    en: 'Wireless Earbuds Pro',
    ar: 'سماعات لاسلكية برو'
  },
  price: {
    amount: 299,
    currency: 'QAR',
    vatIncluded: true
  },
  images: [{
    url: '/earbuds.jpg',
    alt: { en: 'Wireless Earbuds', ar: 'سماعات لاسلكية' }
  }],
  inventory: { inStock: true, quantity: 50 }
};

describe('ProductCard', () => {
  describe('English Locale', () => {
    it('renders product information correctly', () => {
      render(<ProductCard product={mockProduct} locale="en" />);
      
      expect(screen.getByText('Wireless Earbuds Pro')).toBeInTheDocument();
      expect(screen.getByText('299 QAR')).toBeInTheDocument();
      expect(screen.getByRole('img')).toHaveAttribute('alt', 'Wireless Earbuds');
    });

    it('shows add to cart button when in stock', () => {
      render(<ProductCard product={mockProduct} locale="en" />);
      
      const addButton = screen.getByRole('button', { name: /add to cart/i });
      expect(addButton).toBeEnabled();
    });

    it('applies LTR direction and styling', () => {
      render(<ProductCard product={mockProduct} locale="en" />);
      
      const card = screen.getByTestId('product-card');
      expect(card).toHaveAttribute('dir', 'ltr');
      expect(card).toHaveClass('text-left');
    });
  });

  describe('Arabic Locale', () => {
    it('renders Arabic product information', () => {
      render(<ProductCard product={mockProduct} locale="ar" />);
      
      expect(screen.getByText('سماعات لاسلكية برو')).toBeInTheDocument();
      expect(screen.getByText('٢٩٩ ريال قطري')).toBeInTheDocument();
    });

    it('applies RTL direction and styling', () => {
      render(<ProductCard product={mockProduct} locale="ar" />);
      
      const card = screen.getByTestId('product-card');
      expect(card).toHaveAttribute('dir', 'rtl');
      expect(card).toHaveClass('text-right');
    });

    it('shows Arabic add to cart text', () => {
      render(<ProductCard product={mockProduct} locale="ar" />);
      
      expect(screen.getByRole('button', { name: /أضف إلى السلة/i })).toBeInTheDocument();
    });
  });

  describe('Out of Stock', () => {
    it('disables add to cart when out of stock', () => {
      const outOfStockProduct = {
        ...mockProduct,
        inventory: { inStock: false, quantity: 0 }
      };
      
      render(<ProductCard product={outOfStockProduct} locale="en" />);
      
      const addButton = screen.getByRole('button', { name: /out of stock/i });
      expect(addButton).toBeDisabled();
    });
  });

  describe('Interactions', () => {
    it('calls onAddToCart when add button clicked', () => {
      const onAddToCart = jest.fn();
      render(
        <ProductCard 
          product={mockProduct} 
          locale="en" 
          onAddToCart={onAddToCart}
        />
      );
      
      fireEvent.click(screen.getByRole('button', { name: /add to cart/i }));
      expect(onAddToCart).toHaveBeenCalledWith(mockProduct.id);
    });

    it('navigates to product page on card click', () => {
      const mockPush = jest.fn();
      jest.mock('next/navigation', () => ({
        useRouter: () => ({ push: mockPush })
      }));
      
      render(<ProductCard product={mockProduct} locale="en" />);
      
      fireEvent.click(screen.getByTestId('product-card'));
      expect(mockPush).toHaveBeenCalledWith('/products/wireless-earbuds-pro');
    });
  });
});
```

##### Shopping Cart Hook
```typescript
// hooks/__tests__/useCart.test.ts
import { renderHook, act } from '@testing-library/react';
import { useCart } from '../useCart';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useCart Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('initializes with empty cart', () => {
    const { result } = renderHook(() => useCart());
    
    expect(result.current.items).toEqual([]);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.totalAmount).toBe(0);
  });

  it('adds item to cart', () => {
    const { result } = renderHook(() => useCart());
    
    act(() => {
      result.current.addItem('product-1', 2);
    });
    
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toEqual({
      productId: 'product-1',
      quantity: 2
    });
    expect(result.current.totalItems).toBe(2);
  });

  it('updates existing item quantity', () => {
    const { result } = renderHook(() => useCart());
    
    act(() => {
      result.current.addItem('product-1', 2);
      result.current.addItem('product-1', 1);
    });
    
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(3);
  });

  it('removes item from cart', () => {
    const { result } = renderHook(() => useCart());
    
    act(() => {
      result.current.addItem('product-1', 2);
      result.current.removeItem('product-1');
    });
    
    expect(result.current.items).toHaveLength(0);
  });

  it('persists cart to localStorage', () => {
    const { result } = renderHook(() => useCart());
    
    act(() => {
      result.current.addItem('product-1', 2);
    });
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'cart',
      JSON.stringify([{ productId: 'product-1', quantity: 2 }])
    );
  });
});
```

##### Utility Functions
```typescript
// lib/__tests__/currency.test.ts
import { formatPrice, convertCurrency } from '../currency';

describe('Currency Utilities', () => {
  describe('formatPrice', () => {
    it('formats QAR currency correctly for English', () => {
      expect(formatPrice(299, 'QAR', 'en')).toBe('299 QAR');
      expect(formatPrice(1234.56, 'QAR', 'en')).toBe('1,234.56 QAR');
    });

    it('formats QAR currency correctly for Arabic', () => {
      expect(formatPrice(299, 'QAR', 'ar')).toBe('٢٩٩ ريال قطري');
      expect(formatPrice(1234.56, 'QAR', 'ar')).toBe('١٬٢٣٤٫٥٦ ريال قطري');
    });

    it('handles zero and negative values', () => {
      expect(formatPrice(0, 'QAR', 'en')).toBe('0 QAR');
      expect(formatPrice(-50, 'QAR', 'en')).toBe('-50 QAR');
    });
  });

  describe('convertCurrency', () => {
    it('converts USD to QAR correctly', async () => {
      // Mock exchange rate API
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ rates: { QAR: 3.64 } })
      });

      const result = await convertCurrency(100, 'USD', 'QAR');
      expect(result).toBe(364);
    });
  });
});
```

### Coverage Requirements
- **Components**: 90%+ coverage
- **Utilities**: 95%+ coverage
- **Business Logic**: 85%+ coverage
- **Hooks**: 90%+ coverage

## Integration Testing

### API Integration Tests

#### Product API Tests
```typescript
// tests/integration/products.test.ts
import request from 'supertest';
import { app } from '../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Products API', () => {
  beforeEach(async () => {
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/v1/products', () => {
    it('returns empty array when no products exist', async () => {
      const response = await request(app)
        .get('/api/v1/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });

    it('returns products with Arabic content when locale=ar', async () => {
      // Create test product
      await prisma.product.create({
        data: {
          sku: 'TEST-001',
          name: { en: 'Test Product', ar: 'منتج تجريبي' },
          price: { amount: 100, currency: 'QAR' },
          status: 'published'
        }
      });

      const response = await request(app)
        .get('/api/v1/products?locale=ar')
        .expect(200);

      expect(response.body.data[0].name.ar).toBe('منتج تجريبي');
    });

    it('filters products by category', async () => {
      const category = await prisma.category.create({
        data: {
          name: { en: 'Electronics', ar: 'إلكترونيات' },
          slug: { en: 'electronics', ar: 'إلكترونيات' }
        }
      });

      await prisma.product.create({
        data: {
          sku: 'TEST-001',
          name: { en: 'Phone', ar: 'هاتف' },
          price: { amount: 100, currency: 'QAR' },
          categories: { connect: { id: category.id } },
          status: 'published'
        }
      });

      const response = await request(app)
        .get(`/api/v1/products?category=${category.id}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name.en).toBe('Phone');
    });

    it('applies price range filter correctly', async () => {
      await Promise.all([
        prisma.product.create({
          data: {
            sku: 'CHEAP-001',
            name: { en: 'Cheap Item', ar: 'عنصر رخيص' },
            price: { amount: 50, currency: 'QAR' },
            status: 'published'
          }
        }),
        prisma.product.create({
          data: {
            sku: 'EXPENSIVE-001',
            name: { en: 'Expensive Item', ar: 'عنصر مكلف' },
            price: { amount: 500, currency: 'QAR' },
            status: 'published'
          }
        })
      ]);

      const response = await request(app)
        .get('/api/v1/products?priceMin=100&priceMax=300')
        .expect(200);

      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('POST /api/v1/products', () => {
    it('creates product with admin authentication', async () => {
      const adminToken = await getAdminToken();
      
      const productData = {
        sku: 'NEW-001',
        name: { en: 'New Product', ar: 'منتج جديد' },
        description: { en: 'Description', ar: 'وصف' },
        price: { amount: 299, currency: 'QAR', vatIncluded: true },
        status: 'published'
      };

      const response = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sku).toBe('NEW-001');
    });

    it('rejects creation without authentication', async () => {
      const productData = {
        sku: 'NEW-001',
        name: { en: 'New Product', ar: 'منتج جديد' }
      };

      await request(app)
        .post('/api/v1/admin/products')
        .send(productData)
        .expect(401);
    });
  });
});
```

#### Cart API Tests
```typescript
// tests/integration/cart.test.ts
describe('Cart API', () => {
  let userToken: string;

  beforeEach(async () => {
    userToken = await getUserToken();
    await prisma.cart.deleteMany();
    await prisma.product.deleteMany();
  });

  describe('POST /api/v1/cart/items', () => {
    it('adds item to cart successfully', async () => {
      const product = await prisma.product.create({
        data: {
          sku: 'CART-TEST-001',
          name: { en: 'Cart Test', ar: 'اختبار السلة' },
          price: { amount: 100, currency: 'QAR' },
          inventory: { inStock: true, quantity: 10 },
          status: 'published'
        }
      });

      const response = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: product.id,
          quantity: 2
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].quantity).toBe(2);
    });

    it('prevents adding out of stock items', async () => {
      const product = await prisma.product.create({
        data: {
          sku: 'OUT-STOCK-001',
          name: { en: 'Out of Stock', ar: 'غير متوفر' },
          price: { amount: 100, currency: 'QAR' },
          inventory: { inStock: false, quantity: 0 },
          status: 'published'
        }
      });

      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: product.id,
          quantity: 1
        })
        .expect(400);
    });
  });
});
```

### Database Integration Tests
```typescript
// tests/integration/database.test.ts
describe('Database Operations', () => {
  describe('Product Queries', () => {
    it('performs text search in both languages', async () => {
      await prisma.product.create({
        data: {
          sku: 'SEARCH-001',
          name: { en: 'Wireless Headphones', ar: 'سماعات لاسلكية' },
          description: { en: 'High quality audio', ar: 'صوت عالي الجودة' },
          status: 'published'
        }
      });

      // English search
      const englishResults = await prisma.product.findMany({
        where: {
          OR: [
            { name: { path: ['en'], string_contains: 'wireless' } },
            { description: { path: ['en'], string_contains: 'wireless' } }
          ]
        }
      });

      expect(englishResults).toHaveLength(1);

      // Arabic search
      const arabicResults = await prisma.product.findMany({
        where: {
          OR: [
            { name: { path: ['ar'], string_contains: 'لاسلكية' } },
            { description: { path: ['ar'], string_contains: 'لاسلكية' } }
          ]
        }
      });

      expect(arabicResults).toHaveLength(1);
    });
  });
});
```

## End-to-End Testing

### Playwright E2E Tests

#### Critical User Journeys
```typescript
// tests/e2e/checkout-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup test data
    await page.goto('/');
  });

  test('complete purchase journey - English', async ({ page }) => {
    // 1. Browse products
    await page.click('[data-testid="products-link"]');
    await expect(page.locator('h1')).toContainText('Products');

    // 2. Add product to cart
    await page.click('[data-testid="product-card"]:first-child');
    await page.click('[data-testid="add-to-cart"]');
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1');

    // 3. Go to cart
    await page.click('[data-testid="cart-icon"]');
    await expect(page.locator('[data-testid="cart-item"]')).toBeVisible();

    // 4. Proceed to checkout
    await page.click('[data-testid="checkout-button"]');
    
    // 5. Fill shipping information
    await page.fill('[data-testid="shipping-street"]', '123 Test Street');
    await page.fill('[data-testid="shipping-area"]', 'West Bay');
    await page.fill('[data-testid="shipping-city"]', 'Doha');

    // 6. Select payment method
    await page.click('[data-testid="payment-tap"]');
    
    // 7. Complete order
    await page.click('[data-testid="place-order"]');
    
    // 8. Verify success
    await expect(page.locator('[data-testid="order-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-number"]')).toBeVisible();
  });

  test('complete purchase journey - Arabic', async ({ page }) => {
    // Switch to Arabic
    await page.goto('/ar');
    
    // Verify RTL direction
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    
    // 1. Browse products
    await page.click('[data-testid="products-link"]');
    await expect(page.locator('h1')).toContainText('المنتجات');

    // 2. Add product to cart
    await page.click('[data-testid="product-card"]:first-child');
    await page.click('[data-testid="add-to-cart"]');
    
    // Verify Arabic button text
    await expect(page.locator('[data-testid="add-to-cart"]')).toContainText('أضف إلى السلة');

    // Continue with Arabic checkout flow...
  });

  test('handles payment failure gracefully', async ({ page }) => {
    // Add product to cart
    await page.goto('/products');
    await page.click('[data-testid="product-card"]:first-child');
    await page.click('[data-testid="add-to-cart"]');
    
    // Go to checkout
    await page.click('[data-testid="cart-icon"]');
    await page.click('[data-testid="checkout-button"]');
    
    // Fill required information
    await page.fill('[data-testid="shipping-street"]', '123 Test Street');
    
    // Select test payment that will fail
    await page.click('[data-testid="payment-test-fail"]');
    await page.click('[data-testid="place-order"]');
    
    // Verify error handling
    await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-error"]')).toContainText('Payment failed');
    
    // Verify cart is preserved
    await page.click('[data-testid="cart-icon"]');
    await expect(page.locator('[data-testid="cart-item"]')).toBeVisible();
  });
});
```

#### Search and Filtering
```typescript
// tests/e2e/search.spec.ts
test.describe('Search and Filtering', () => {
  test('search works in both languages', async ({ page }) => {
    await page.goto('/products');
    
    // English search
    await page.fill('[data-testid="search-input"]', 'wireless');
    await page.press('[data-testid="search-input"]', 'Enter');
    
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-card"]')).toHaveCount.greaterThan(0);
    
    // Switch to Arabic
    await page.click('[data-testid="language-switch"]');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    
    // Arabic search
    await page.fill('[data-testid="search-input"]', 'لاسلكية');
    await page.press('[data-testid="search-input"]', 'Enter');
    
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
  });

  test('filters work correctly', async ({ page }) => {
    await page.goto('/products');
    
    // Apply price filter
    await page.click('[data-testid="price-filter"]');
    await page.click('[data-testid="price-100-500"]');
    
    // Apply category filter
    await page.click('[data-testid="category-filter"]');
    await page.click('[data-testid="category-audio"]');
    
    // Verify filtered results
    await expect(page.locator('[data-testid="filter-results"]')).toBeVisible();
    
    // Clear filters
    await page.click('[data-testid="clear-filters"]');
    await expect(page.locator('[data-testid="all-products"]')).toBeVisible();
  });
});
```

## Performance Testing

### Load Testing with Artillery
```yaml
# artillery-config.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50
    - duration: 60
      arrivalRate: 100
  variables:
    userAgent: 'Artillery Load Test'

scenarios:
  - name: 'Browse products'
    weight: 60
    flow:
      - get:
          url: '/products'
      - get:
          url: '/products?category=electronics'
      - get:
          url: '/products/{{ $randomString() }}'
  
  - name: 'Search products'
    weight: 20
    flow:
      - get:
          url: '/search?q=wireless'
      - get:
          url: '/search?q=headphones'
  
  - name: 'Add to cart'
    weight: 20
    flow:
      - post:
          url: '/api/v1/cart/items'
          json:
            productId: '{{ $randomString() }}'
            quantity: 1
```

### Lighthouse Performance Testing
```typescript
// tests/performance/lighthouse.test.ts
import lighthouse from 'lighthouse';
import { chromium } from 'playwright';

describe('Performance Tests', () => {
  test('homepage meets performance requirements', async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    const result = await lighthouse('http://localhost:3000', {
      port: 9222,
      output: 'json',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo']
    });

    expect(result.lhr.categories.performance.score).toBeGreaterThan(0.9);
    expect(result.lhr.categories.accessibility.score).toBeGreaterThan(0.9);
    
    await browser.close();
  });

  test('product page performance in Arabic', async () => {
    const result = await lighthouse('http://localhost:3000/ar/products/test-product', {
      port: 9222,
      output: 'json'
    });

    expect(result.lhr.categories.performance.score).toBeGreaterThan(0.85);
    
    // Check specific metrics
    const metrics = result.lhr.audits;
    expect(metrics['largest-contentful-paint'].numericValue).toBeLessThan(2100);
    expect(metrics['first-input-delay'].numericValue).toBeLessThan(200);
    expect(metrics['cumulative-layout-shift'].numericValue).toBeLessThan(0.1);
  });
});
```

## Security Testing

### Authentication Testing
```typescript
// tests/security/auth.test.ts
describe('Authentication Security', () => {
  test('prevents SQL injection in login', async () => {
    await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: "admin'; DROP TABLE users; --",
        password: 'password'
      })
      .expect(400);
  });

  test('rate limits login attempts', async () => {
    const attempts = Array(6).fill(null);
    
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(401);
    }
    
    // 6th attempt should be rate limited
    await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword'
      })
      .expect(429);
  });

  test('validates JWT tokens properly', async () => {
    // Test with invalid token
    await request(app)
      .get('/api/v1/profile')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
    
    // Test with expired token
    const expiredToken = jwt.sign(
      { userId: 'test', exp: Math.floor(Date.now() / 1000) - 60 },
      process.env.JWT_SECRET
    );
    
    await request(app)
      .get('/api/v1/profile')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);
  });
});
```

### Payment Security Testing
```typescript
// tests/security/payment.test.ts
describe('Payment Security', () => {
  test('never stores sensitive card data', async () => {
    const userToken = await getUserToken();
    
    await request(app)
      .post('/api/v1/payment/create')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        orderId: 'test-order',
        paymentMethod: 'tap',
        cardNumber: '4111111111111111', // Test card
        expiryMonth: '12',
        expiryYear: '2025',
        cvv: '123'
      })
      .expect(400); // Should reject card data
  });

  test('validates payment webhook signatures', async () => {
    const invalidWebhook = {
      id: 'evt_test',
      type: 'charge.succeeded',
      data: { object: { id: 'ch_test' } }
    };

    await request(app)
      .post('/api/v1/webhooks/tap')
      .send(invalidWebhook)
      .expect(400); // Should reject without valid signature
  });
});
```

## Payment Testing

### Test Payment Scenarios
```typescript
// tests/payment/scenarios.test.ts
describe('Payment Scenarios', () => {
  describe('Tap Payments', () => {
    test('successful payment flow', async () => {
      const order = await createTestOrder();
      
      const paymentResult = await paymentService.processPayment('tap', {
        amount: order.total,
        currency: 'QAR',
        orderId: order.id,
        customer: {
          email: 'test@example.com',
          name: 'Test Customer'
        }
      });

      expect(paymentResult.success).toBe(true);
      expect(paymentResult.redirectUrl).toBeDefined();
    });

    test('handles payment failure', async () => {
      // Use test card that triggers failure
      const order = await createTestOrder();
      
      const paymentResult = await paymentService.processPayment('tap', {
        amount: order.total,
        currency: 'QAR',
        orderId: order.id,
        testCard: '4000000000000002' // Declined card
      });

      expect(paymentResult.success).toBe(false);
      expect(paymentResult.error).toBeDefined();
    });
  });

  describe('QPAY Integration', () => {
    test('processes local payment', async () => {
      const order = await createTestOrder();
      
      const result = await paymentService.processPayment('qpay', {
        amount: order.total,
        currency: 'QAR',
        orderId: order.id
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Multi-currency Support', () => {
    test('handles USD to QAR conversion', async () => {
      const order = await createTestOrder({ currency: 'USD' });
      
      const result = await paymentService.processPayment('tap', {
        amount: order.total,
        currency: 'USD',
        orderId: order.id
      });

      expect(result.success).toBe(true);
      expect(result.convertedAmount).toBeDefined();
    });
  });
});
```

### Payment Gateway Test Cards
```typescript
// Test card numbers for different scenarios
export const TEST_CARDS = {
  visa: {
    success: '4111111111111111',
    declined: '4000000000000002',
    insufficient: '4000000000009995',
    expired: '4000000000000069'
  },
  mastercard: {
    success: '5555555555554444',
    declined: '5000000000000009'
  },
  amex: {
    success: '378282246310005',
    declined: '371449635398431'
  }
};
```

## Test Execution

### Running Tests
```bash
# Unit tests
npm run test
npm run test:watch
npm run test:coverage

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
npm run test:e2e:headed

# Performance tests
npm run test:performance

# All tests
npm run test:all

# Generate test report
npm run test:report
```

### CI/CD Integration
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:coverage
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Install Playwright
        run: npx playwright install
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

This comprehensive testing strategy ensures the Picksmart Stores platform is robust, secure, and provides an excellent user experience for both Arabic and English-speaking customers in Qatar. 