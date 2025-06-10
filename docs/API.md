# 🔌 API Documentation

## Table of Contents
- [API Overview](#api-overview)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Products API](#products-api)
- [Users API](#users-api)
- [Orders API](#orders-api)
- [Cart API](#cart-api)
- [Payment API](#payment-api)
- [Categories API](#categories-api)
- [Search API](#search-api)
- [Admin API](#admin-api)
- [Webhooks](#webhooks)
- [Localization](#localization)

## API Overview

### Base URL
```
Production: https://api.picksmartstores.com/v1
Staging: https://staging-api.picksmartstores.com/v1
Development: http://localhost:3001/api/v1
```

### API Versioning
The API uses URL versioning. Current version is `v1`.

### Content Types
- **Request**: `application/json`
- **Response**: `application/json`
- **File uploads**: `multipart/form-data`

### Standard Response Format
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}
```

### Success Response Example
```json
{
  "success": true,
  "data": {
    "id": "64a7b8c9d1e2f3a4b5c6d7e8",
    "name": {
      "en": "Wireless Earbuds Pro",
      "ar": "سماعات لاسلكية برو"
    },
    "price": {
      "amount": 299,
      "currency": "QAR"
    }
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_abc123",
    "version": "1.0.0"
  }
}
```

### Error Response Example
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Invalid product data provided",
  "details": {
    "field": "price.amount",
    "code": "INVALID_NUMBER",
    "message": "Price must be a positive number"
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_abc123",
    "version": "1.0.0"
  }
}
```

## Authentication

### JWT Token Authentication
The API uses JWT tokens for authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Login Endpoint
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "64a7b8c9d1e2f3a4b5c6d7e8",
      "email": "user@example.com",
      "profile": {
        "firstName": "Ahmed",
        "lastName": "Al-Rashid",
        "preferredLanguage": "ar"
      },
      "role": "customer"
    }
  }
}
```

### Register Endpoint
```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "Ahmed",
  "lastName": "Al-Rashid",
  "phone": "+97455123456",
  "preferredLanguage": "ar"
}
```

### Refresh Token
```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

### Logout
```http
POST /auth/logout
```

**Headers:**
```http
Authorization: Bearer <token>
```

## Error Handling

### Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

### Validation Error Details
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": [
    {
      "field": "email",
      "code": "INVALID_EMAIL",
      "message": "Please provide a valid email address"
    },
    {
      "field": "password",
      "code": "TOO_SHORT",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

## Rate Limiting

### Rate Limits by Endpoint Type
- **Authentication**: 5 requests per minute
- **Product Listing**: 100 requests per minute
- **Search**: 60 requests per minute
- **Cart Operations**: 30 requests per minute
- **Payment Processing**: 10 requests per minute

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642348800
```

## Products API

### Get All Products
```http
GET /products
```

**Query Parameters:**
```typescript
interface ProductQuery {
  page?: number;          // Page number (default: 1)
  limit?: number;         // Items per page (default: 20, max: 100)
  category?: string;      // Category ID filter
  brand?: string;         // Brand filter
  priceMin?: number;      // Minimum price filter
  priceMax?: number;      // Maximum price filter
  inStock?: boolean;      // Stock availability filter
  featured?: boolean;     // Featured products only
  sort?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'popular' | 'rating';
  search?: string;        // Search query
  locale?: 'en' | 'ar';   // Response language
}
```

**Example Request:**
```http
GET /products?page=1&limit=20&category=electronics&sort=newest&locale=ar
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "64a7b8c9d1e2f3a4b5c6d7e8",
      "sku": "WE-PRO-001",
      "name": {
        "en": "Wireless Earbuds Pro",
        "ar": "سماعات لاسلكية برو"
      },
      "description": {
        "en": "Premium wireless earbuds with noise cancellation",
        "ar": "سماعات لاسلكية مميزة مع إلغاء الضوضاء"
      },
      "price": {
        "amount": 299,
        "currency": "QAR",
        "vatIncluded": true,
        "originalPrice": 399,
        "discount": {
          "type": "percentage",
          "value": 25,
          "startDate": "2024-01-01T00:00:00Z",
          "endDate": "2024-01-31T23:59:59Z"
        }
      },
      "images": [
        {
          "url": "https://cdn.picksmartstores.com/products/we-pro-001-1.jpg",
          "alt": {
            "en": "Wireless Earbuds Pro - Front View",
            "ar": "سماعات لاسلكية برو - المنظر الأمامي"
          },
          "order": 1
        }
      ],
      "categories": ["64a7b8c9d1e2f3a4b5c6d7e8"],
      "brand": "AudioTech",
      "inventory": {
        "inStock": true,
        "quantity": 150,
        "lowStockThreshold": 10
      },
      "rating": {
        "average": 4.5,
        "count": 128
      },
      "specifications": {
        "battery_life": {
          "en": "24 hours",
          "ar": "24 ساعة"
        },
        "connectivity": {
          "en": "Bluetooth 5.2",
          "ar": "بلوتوث 5.2"
        }
      },
      "seo": {
        "slug": {
          "en": "wireless-earbuds-pro",
          "ar": "سماعات-لاسلكية-برو"
        }
      },
      "featured": true,
      "status": "published",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Get Product by ID
```http
GET /products/{id}
```

**Parameters:**
- `id` (string): Product ID
- `locale` (query): Response language ('en' | 'ar')

**Example:**
```http
GET /products/64a7b8c9d1e2f3a4b5c6d7e8?locale=ar
```

### Get Product by Slug
```http
GET /products/slug/{slug}
```

**Parameters:**
- `slug` (string): Product slug
- `locale` (query): Response language ('en' | 'ar')

**Example:**
```http
GET /products/slug/wireless-earbuds-pro?locale=en
```

### Get Related Products
```http
GET /products/{id}/related
```

**Query Parameters:**
- `limit` (number): Number of related products (default: 4, max: 12)
- `locale` (string): Response language

### Get Product Reviews
```http
GET /products/{id}/reviews
```

**Query Parameters:**
```typescript
interface ReviewQuery {
  page?: number;
  limit?: number;
  rating?: number;    // Filter by rating (1-5)
  sort?: 'newest' | 'oldest' | 'rating_high' | 'rating_low' | 'helpful';
}
```

## Users API

### Get Current User Profile
```http
GET /users/profile
```

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "64a7b8c9d1e2f3a4b5c6d7e8",
    "email": "ahmed@example.com",
    "phone": "+97455123456",
    "profile": {
      "firstName": "Ahmed",
      "lastName": "Al-Rashid",
      "avatar": "https://cdn.picksmartstores.com/avatars/user123.jpg",
      "dateOfBirth": "1990-05-15",
      "gender": "male",
      "preferredLanguage": "ar"
    },
    "addresses": [
      {
        "id": "addr_123",
        "type": "home",
        "street": "Al Corniche Street",
        "area": "West Bay",
        "city": "Doha",
        "building": "Tower 1",
        "floor": "15",
        "apartment": "1502",
        "landmark": "Near City Center Mall",
        "isDefault": true
      }
    ],
    "preferences": {
      "currency": "QAR",
      "notifications": {
        "email": true,
        "sms": true,
        "whatsapp": true
      }
    },
    "loyaltyPoints": 1250,
    "status": "active",
    "createdAt": "2023-06-01T00:00:00Z"
  }
}
```

### Update User Profile
```http
PUT /users/profile
```

**Request Body:**
```json
{
  "profile": {
    "firstName": "Ahmed",
    "lastName": "Al-Rashid",
    "dateOfBirth": "1990-05-15",
    "preferredLanguage": "ar"
  },
  "preferences": {
    "currency": "QAR",
    "notifications": {
      "email": true,
      "sms": false,
      "whatsapp": true
    }
  }
}
```

### Manage User Addresses
```http
GET /users/addresses
POST /users/addresses
PUT /users/addresses/{addressId}
DELETE /users/addresses/{addressId}
```

**Add Address Request:**
```json
{
  "type": "work",
  "street": "Al Sadd Street",
  "area": "Al Sadd",
  "city": "Doha",
  "building": "Office Complex B",
  "floor": "3",
  "apartment": "301",
  "landmark": "Near Qatar University",
  "isDefault": false
}
```

### Change Password
```http
POST /users/change-password
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

## Orders API

### Get User Orders
```http
GET /orders
```

**Query Parameters:**
```typescript
interface OrderQuery {
  page?: number;
  limit?: number;
  status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  dateFrom?: string;    // ISO date string
  dateTo?: string;      // ISO date string
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "64a7b8c9d1e2f3a4b5c6d7e8",
      "orderNumber": "PS2024010001",
      "status": "confirmed",
      "items": [
        {
          "productId": "64a7b8c9d1e2f3a4b5c6d7e8",
          "sku": "WE-PRO-001",
          "name": {
            "en": "Wireless Earbuds Pro",
            "ar": "سماعات لاسلكية برو"
          },
          "price": 299,
          "quantity": 1,
          "total": 299
        }
      ],
      "totals": {
        "subtotal": 299,
        "shipping": 25,
        "vat": 16.2,
        "discount": 0,
        "total": 340.2,
        "currency": "QAR"
      },
      "shipping": {
        "address": {
          "street": "Al Corniche Street",
          "area": "West Bay",
          "city": "Doha"
        },
        "method": "standard",
        "trackingNumber": "QP123456789",
        "estimatedDelivery": "2024-01-20T00:00:00Z"
      },
      "payment": {
        "method": "tap",
        "status": "completed",
        "transactionId": "txn_abc123",
        "paidAt": "2024-01-15T10:30:00Z"
      },
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

### Get Order by ID
```http
GET /orders/{orderId}
```

### Create Order
```http
POST /orders
```

**Request Body:**
```json
{
  "items": [
    {
      "productId": "64a7b8c9d1e2f3a4b5c6d7e8",
      "quantity": 1
    }
  ],
  "shippingAddressId": "addr_123",
  "shippingMethod": "standard",
  "paymentMethod": "tap",
  "notes": "Please call before delivery"
}
```

### Cancel Order
```http
POST /orders/{orderId}/cancel
```

**Request Body:**
```json
{
  "reason": "Changed mind"
}
```

### Track Order
```http
GET /orders/{orderId}/tracking
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "64a7b8c9d1e2f3a4b5c6d7e8",
    "trackingNumber": "QP123456789",
    "status": "shipped",
    "tracking": [
      {
        "status": "confirmed",
        "message": {
          "en": "Order confirmed",
          "ar": "تم تأكيد الطلب"
        },
        "timestamp": "2024-01-15T10:00:00Z"
      },
      {
        "status": "processing",
        "message": {
          "en": "Order is being prepared",
          "ar": "جاري تحضير الطلب"
        },
        "timestamp": "2024-01-15T14:00:00Z"
      },
      {
        "status": "shipped",
        "message": {
          "en": "Order shipped via Qatar Post",
          "ar": "تم شحن الطلب عبر بريد قطر"
        },
        "timestamp": "2024-01-16T09:00:00Z"
      }
    ],
    "estimatedDelivery": "2024-01-20T00:00:00Z"
  }
}
```

## Cart API

### Get Cart
```http
GET /cart
```

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cart_123",
    "items": [
      {
        "id": "item_456",
        "product": {
          "id": "64a7b8c9d1e2f3a4b5c6d7e8",
          "sku": "WE-PRO-001",
          "name": {
            "en": "Wireless Earbuds Pro",
            "ar": "سماعات لاسلكية برو"
          },
          "price": {
            "amount": 299,
            "currency": "QAR"
          },
          "images": [
            {
              "url": "https://cdn.picksmartstores.com/products/we-pro-001-1.jpg"
            }
          ],
          "inventory": {
            "inStock": true,
            "quantity": 150
          }
        },
        "quantity": 2,
        "subtotal": 598,
        "addedAt": "2024-01-15T10:00:00Z"
      }
    ],
    "totals": {
      "itemsCount": 2,
      "subtotal": 598,
      "shipping": 25,
      "vat": 31.15,
      "total": 654.15,
      "currency": "QAR"
    },
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Add Item to Cart
```http
POST /cart/items
```

**Request Body:**
```json
{
  "productId": "64a7b8c9d1e2f3a4b5c6d7e8",
  "quantity": 1
}
```

### Update Cart Item
```http
PUT /cart/items/{itemId}
```

**Request Body:**
```json
{
  "quantity": 3
}
```

### Remove Cart Item
```http
DELETE /cart/items/{itemId}
```

### Clear Cart
```http
DELETE /cart
```

### Apply Coupon
```http
POST /cart/coupon
```

**Request Body:**
```json
{
  "code": "WELCOME20"
}
```

### Remove Coupon
```http
DELETE /cart/coupon
```

## Payment API

### Get Payment Methods
```http
GET /payment/methods
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "tap",
      "name": {
        "en": "Tap Payments",
        "ar": "تاب للمدفوعات"
      },
      "description": {
        "en": "Credit/Debit cards and digital wallets",
        "ar": "بطاقات ائتمانية ومحافظ رقمية"
      },
      "supportedCards": ["visa", "mastercard", "amex"],
      "supportedWallets": ["apple_pay", "google_pay", "samsung_pay"],
      "fees": {
        "percentage": 2.5,
        "fixed": 1,
        "currency": "QAR"
      },
      "enabled": true
    },
    {
      "id": "qpay",
      "name": {
        "en": "QPay",
        "ar": "كيو باي"
      },
      "description": {
        "en": "Qatar National Payment Gateway",
        "ar": "بوابة قطر الوطنية للدفع"
      },
      "supportedCards": ["local_debit"],
      "fees": {
        "percentage": 2.0,
        "fixed": 0,
        "currency": "QAR"
      },
      "enabled": true
    }
  ]
}
```

### Create Payment
```http
POST /payment/create
```

**Request Body:**
```json
{
  "orderId": "64a7b8c9d1e2f3a4b5c6d7e8",
  "paymentMethod": "tap",
  "returnUrl": "https://picksmartstores.com/payment/success",
  "cancelUrl": "https://picksmartstores.com/payment/cancel"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "pay_abc123",
    "status": "pending",
    "redirectUrl": "https://tap.company/payment/redirect/xyz789",
    "expiresAt": "2024-01-15T11:00:00Z"
  }
}
```

### Get Payment Status
```http
GET /payment/{paymentId}/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "pay_abc123",
    "orderId": "64a7b8c9d1e2f3a4b5c6d7e8",
    "status": "completed",
    "transactionId": "txn_def456",
    "amount": 654.15,
    "currency": "QAR",
    "paymentMethod": "tap",
    "paidAt": "2024-01-15T10:45:00Z"
  }
}
```

### Process Refund
```http
POST /payment/{paymentId}/refund
```

**Request Body:**
```json
{
  "amount": 654.15,
  "reason": "Customer request"
}
```

## Categories API

### Get All Categories
```http
GET /categories
```

**Query Parameters:**
- `locale` (string): Response language ('en' | 'ar')
- `parent` (string): Parent category ID (for subcategories)
- `includeProducts` (boolean): Include product count

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "64a7b8c9d1e2f3a4b5c6d7e8",
      "name": {
        "en": "Audio & Headphones",
        "ar": "الصوتيات والسماعات"
      },
      "description": {
        "en": "High-quality audio devices and accessories",
        "ar": "أجهزة صوتية عالية الجودة وإكسسوارات"
      },
      "slug": {
        "en": "audio-headphones",
        "ar": "الصوتيات-والسماعات"
      },
      "image": "https://cdn.picksmartstores.com/categories/audio.jpg",
      "parentId": null,
      "order": 1,
      "isActive": true,
      "productCount": 45,
      "children": [
        {
          "id": "64a7b8c9d1e2f3a4b5c6d7e9",
          "name": {
            "en": "Wireless Earbuds",
            "ar": "سماعات لاسلكية"
          },
          "productCount": 15
        }
      ]
    }
  ]
}
```

### Get Category by ID
```http
GET /categories/{categoryId}
```

### Get Category Products
```http
GET /categories/{categoryId}/products
```

**Query Parameters:** Same as Products API

## Search API

### Search Products
```http
GET /search
```

**Query Parameters:**
```typescript
interface SearchQuery {
  q: string;              // Search query (required)
  page?: number;
  limit?: number;
  category?: string;      // Filter by category
  priceMin?: number;
  priceMax?: number;
  brand?: string;
  inStock?: boolean;
  sort?: 'relevance' | 'newest' | 'price_asc' | 'price_desc' | 'popular';
  locale?: 'en' | 'ar';
}
```

**Example:**
```http
GET /search?q=wireless%20earbuds&category=audio&sort=relevance&locale=ar
```

**Response:**
```json
{
  "success": true,
  "data": {
    "query": "wireless earbuds",
    "results": [
      {
        "id": "64a7b8c9d1e2f3a4b5c6d7e8",
        "name": {
          "en": "Wireless Earbuds Pro",
          "ar": "سماعات لاسلكية برو"
        },
        "price": {
          "amount": 299,
          "currency": "QAR"
        },
        "relevanceScore": 0.95,
        "highlights": {
          "name": ["<mark>Wireless</mark> <mark>Earbuds</mark> Pro"],
          "description": ["Premium <mark>wireless</mark> <mark>earbuds</mark> with noise cancellation"]
        }
      }
    ],
    "suggestions": [
      "wireless headphones",
      "bluetooth earbuds",
      "noise cancelling earbuds"
    ],
    "filters": {
      "categories": [
        {
          "id": "audio",
          "name": "Audio & Headphones",
          "count": 12
        }
      ],
      "brands": [
        {
          "name": "AudioTech",
          "count": 5
        }
      ],
      "priceRanges": [
        {
          "min": 50,
          "max": 200,
          "count": 8
        }
      ]
    }
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "pages": 2,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Search Suggestions
```http
GET /search/suggestions
```

**Query Parameters:**
- `q` (string): Partial search query
- `limit` (number): Maximum suggestions (default: 10)
- `locale` (string): Response language

**Response:**
```json
{
  "success": true,
  "data": [
    "wireless earbuds",
    "wireless headphones",
    "wireless speakers",
    "wireless charger"
  ]
}
```

## Admin API

### Products Management

#### Create Product
```http
POST /admin/products
```

**Headers:**
```http
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "sku": "WH-BT-002",
  "name": {
    "en": "Bluetooth Headphones",
    "ar": "سماعات بلوتوث"
  },
  "description": {
    "en": "High-quality Bluetooth headphones",
    "ar": "سماعات بلوتوث عالية الجودة"
  },
  "price": {
    "amount": 199,
    "currency": "QAR",
    "vatIncluded": true
  },
  "categories": ["64a7b8c9d1e2f3a4b5c6d7e8"],
  "brand": "AudioTech",
  "specifications": {
    "battery_life": {
      "en": "20 hours",
      "ar": "20 ساعة"
    }
  },
  "inventory": {
    "quantity": 100,
    "lowStockThreshold": 10
  },
  "status": "published",
  "featured": false
}
```

#### Update Product
```http
PUT /admin/products/{productId}
```

#### Delete Product
```http
DELETE /admin/products/{productId}
```

#### Bulk Update Products
```http
POST /admin/products/bulk-update
```

**Request Body:**
```json
{
  "productIds": ["id1", "id2", "id3"],
  "updates": {
    "status": "published",
    "featured": true
  }
}
```

### Orders Management

#### Get All Orders
```http
GET /admin/orders
```

**Query Parameters:**
```typescript
interface AdminOrderQuery {
  page?: number;
  limit?: number;
  status?: string;
  paymentStatus?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;       // Search by order number or customer email
}
```

#### Update Order Status
```http
PUT /admin/orders/{orderId}/status
```

**Request Body:**
```json
{
  "status": "shipped",
  "trackingNumber": "QP123456789",
  "notes": "Shipped via Qatar Post"
}
```

### Analytics

#### Dashboard Stats
```http
GET /admin/analytics/dashboard
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalRevenue": 125000,
      "totalOrders": 485,
      "totalCustomers": 320,
      "averageOrderValue": 257.73
    },
    "recentOrders": 25,
    "topProducts": [
      {
        "productId": "64a7b8c9d1e2f3a4b5c6d7e8",
        "name": "Wireless Earbuds Pro",
        "sales": 45,
        "revenue": 13455
      }
    ],
    "salesChart": {
      "labels": ["Jan", "Feb", "Mar", "Apr", "May"],
      "data": [15000, 18000, 22000, 25000, 28000]
    }
  }
}
```

## Webhooks

### Payment Webhooks

#### Tap Payments Webhook
```http
POST /webhooks/tap
```

**Request Body:**
```json
{
  "id": "evt_abc123",
  "object": "event",
  "api_version": "2.0",
  "created": 1642348800,
  "data": {
    "object": {
      "id": "chg_abc123",
      "object": "charge",
      "status": "CAPTURED",
      "amount": 654.15,
      "currency": "QAR",
      "metadata": {
        "orderId": "64a7b8c9d1e2f3a4b5c6d7e8"
      }
    }
  },
  "livemode": false,
  "pending_webhooks": 1,
  "request": "req_abc123",
  "type": "charge.updated"
}
```

#### QPAY Webhook
```http
POST /webhooks/qpay
```

### Order Webhooks

#### Order Status Update
```http
POST /webhooks/order-status
```

## Localization

### Language Headers
Include language preference in requests:

```http
Accept-Language: ar-QA,ar;q=0.9,en;q=0.8
```

### Locale Parameter
Add locale parameter to requests:

```http
GET /products?locale=ar
```

### Supported Locales
- `en` - English
- `ar` - Arabic

### Currency Support
- `QAR` - Qatari Riyal (primary)
- `USD` - US Dollar (secondary)

### Date Formats
- **English**: ISO 8601 format (`2024-01-15T10:30:00Z`)
- **Arabic**: Hijri calendar support where applicable

### Number Formats
- **English**: `1,234.56`
- **Arabic**: `١٬٢٣٤٫٥٦` (Arabic-Indic numerals)

---

This API documentation provides a comprehensive guide for integrating with the Picksmart Stores platform, covering all essential endpoints, authentication, payment processing, and localization features specific to the Qatar market. 