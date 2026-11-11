# Product Expiry Tracking Feature

## Overview
This feature provides comprehensive product expiry date tracking and automatic notification system for products approaching their expiration dates. It helps administrators monitor and manage products with limited shelf life, ensuring timely action before products expire.

## Features Implemented

### 1. Repository Methods (`products.repository.js`)

#### `getProductsExpiringSoon(months = 6)`
- Retrieves all active products expiring within the specified number of months
- Returns products sorted by expiry date (nearest first)
- Includes category and unit information

#### `getProductsExpiringInPeriod(startDate, endDate)`
- Retrieves products expiring within a specific date range
- Useful for periodic reviews and reports

#### `getExpiredProducts()`
- Retrieves all products that have already expired
- Helps identify expired inventory that needs removal

#### `getExpiringProductsStats()`
- Provides comprehensive expiry statistics:
  - Products expiring within 6 months
  - Products expiring within 3 months
  - Products expiring within 1 month
  - Already expired products

### 2. Service Methods (`products.service.js`)

#### `getProductsExpiringSoon(months = 6)`
- Returns products with calculated `days_until_expiry` and `expiry_status`
- Expiry statuses:
  - `expired`: Already expired
  - `critical`: Expiring within 30 days
  - `warning`: Expiring within 90 days
  - `notice`: Expiring within 180 days
  - `ok`: More than 180 days away

#### `getProductsExpiringInPeriod(startDate, endDate)`
- Returns products expiring in a custom date range
- Includes days calculation and expiry status

#### `getExpiredProducts()`
- Returns expired products with `days_expired` calculation

#### `getExpiringProductsStats()`
- Returns formatted statistics for dashboard display
- Color-coded by urgency level

#### `createExpiryNotification(productId, userId)`
- Creates a notification for a specific product
- Automatic priority assignment based on urgency
- Detailed message with stock information

#### `createBulkExpiryNotifications(months = 6, userId)`
- Creates notifications for all products expiring within specified period
- Efficient batch processing

### 3. Controller Endpoints (`products.controller.js`)

#### `GET /expiring-soon?months=6`
- Get products expiring within specified months

#### `GET /expiring/period?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`
- Get products expiring within specific date range

#### `GET /expired`
- Get all expired products

#### `GET /expiry-stats`
- Get expiry statistics for dashboard

#### `POST /:id/expiry-notification`
- Create expiry notification for specific product

#### `POST /expiry-notifications/bulk?months=6`
- Create bulk notifications for all expiring products

## API Endpoints

### 1. Get Products Expiring Soon
```http
GET /api/products/expiring-soon?months=6
```

**Query Parameters:**
- `months` (optional): Number of months to look ahead (default: 6, max recommended: 24)

**Response:**
```json
{
  "status": true,
  "message": "Products expiring within 6 months retrieved successfully",
  "data": [
    {
      "id": 5,
      "name": "Food Supplement",
      "sku": "SUP-001",
      "expiry_date": "2025-12-01",
      "stock_quantity": 50,
      "price": 29.99,
      "thumb_url": "http://example.com/supplement.jpg",
      "days_until_expiry": 45,
      "expiry_status": "notice",
      "category": {
        "id": 3,
        "name": "Health Supplements"
      },
      "unit": {
        "id": 1,
        "name": "Bottle",
        "symbol": "btl"
      }
    }
  ]
}
```

### 2. Get Products Expiring in Period
```http
GET /api/products/expiring/period?start_date=2026-01-01&end_date=2026-03-31
```

**Query Parameters:**
- `start_date` (required): Start date in YYYY-MM-DD format
- `end_date` (required): End date in YYYY-MM-DD format

### 3. Get Expired Products
```http
GET /api/products/expired
```

**Response includes:**
- `days_expired`: Number of days since expiry
- `expiry_status`: Always "expired"

### 4. Get Expiry Statistics
```http
GET /api/products/expiry-stats
```

**Response:**
```json
{
  "status": true,
  "message": "Product expiry statistics retrieved successfully",
  "data": [
    {
      "label": "Expiring Within 6 Months",
      "value": 25,
      "color": "bg-yellow-500"
    },
    {
      "label": "Expiring Within 3 Months",
      "value": 12,
      "color": "bg-orange-500"
    },
    {
      "label": "Expiring Within 1 Month",
      "value": 5,
      "color": "bg-red-500"
    },
    {
      "label": "Already Expired",
      "value": 3,
      "color": "bg-gray-700"
    }
  ]
}
```

### 5. Create Expiry Notification for Product
```http
POST /api/products/:id/expiry-notification
```

**Response:**
```json
{
  "status": true,
  "message": "Expiry notification created successfully",
  "data": {
    "success": true,
    "message": "Expiry notification created successfully",
    "notification": {
      "title": "Product Expiring Within 6 Months",
      "message": "Product "Food Supplement" (SKU: SUP-001) will expire in 180 days on 12/1/2025. Current stock: 50",
      "priority": "medium",
      "days_until_expiry": 180
    }
  }
}
```

### 6. Create Bulk Expiry Notifications
```http
POST /api/products/expiry-notifications/bulk?months=6
```

**Query Parameters:**
- `months` (optional): Number of months to look ahead (default: 6)

**Response:**
```json
{
  "status": true,
  "message": "Bulk expiry notifications created successfully",
  "data": {
    "success": true,
    "message": "Created 25 expiry notifications",
    "notifications_created": 25,
    "products": [
      {
        "id": 5,
        "name": "Food Supplement",
        "expiry_date": "2025-12-01"
      }
    ]
  }
}
```

## Notification Priority Levels

The system automatically assigns notification priority based on urgency:

| Days Until Expiry | Priority | Title Prefix |
|-------------------|----------|---------------|
| 0-30 days | urgent | URGENT: Product Expiring Within 1 Month |
| 31-90 days | high | Product Expiring Within 3 Months |
| 91-180 days | medium | Product Expiring Within 6 Months |
| 181+ days | low | Product Expiry Notice |

## Expiry Status Categories

| Status | Description | Color Coding |
|--------|-------------|--------------|
| expired | Already expired | bg-gray-700 |
| critical | Expiring within 30 days | bg-red-500 |
| warning | Expiring within 90 days | bg-orange-500 |
| notice | Expiring within 180 days | bg-yellow-500 |
| ok | More than 180 days away | bg-green-500 |

## Usage Examples

### 1. Dashboard Integration
```javascript
// Get expiry statistics for dashboard widgets
const stats = await fetch('/api/products/expiry-stats');
const expiringSoon = await fetch('/api/products/expiring-soon?months=6');
```

### 2. Scheduled Notifications
```javascript
// Create daily notifications for products expiring within 6 months
const response = await fetch('/api/products/expiry-notifications/bulk?months=6', {
  method: 'POST'
});
```

### 3. Monthly Expiry Report
```javascript
// Get products expiring this month
const today = new Date();
const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
const report = await fetch(
  `/api/products/expiring/period?start_date=${formatDate(today)}&end_date=${formatDate(lastDay)}`
);
```

### 4. Critical Items Alert
```javascript
// Get products expiring within 30 days (urgent)
const critical = await fetch('/api/products/expiring-soon?months=1');
```

## Database Requirements

The feature uses the existing `products` table structure:
- `expiry_date` (DATE): Product expiration date (already exists in model)
- `stock_quantity` (DECIMAL): Current stock level
- `is_active` (BOOLEAN): Product active status

## Authentication & Authorization

All endpoints require:
- Valid JWT token (`verifyToken` middleware)
- Products module access (`moduleCheck('products')` middleware)

## Files Modified

1. **src/modules/products/products.repository.js**
   - Added expiry tracking query methods
   - Added statistics calculation methods

2. **src/modules/products/products.service.js**
   - Added business logic for expiry calculations
   - Added notification creation methods
   - Added status determination helpers

3. **src/modules/products/products.controller.js**
   - Added 6 new controller methods for expiry endpoints

4. **src/modules/products/products.routes.js**
   - Added 6 new route definitions with comprehensive metadata
   - Includes sample requests/responses and documentation

## Integration with Notification System

The feature integrates with the existing notification system:
- Uses `NotificationService.createNotification()` method
- Creates notifications with type 'stock'
- Links directly to product details
- Supports user-specific or global notifications

## Future Enhancements

Potential improvements for future versions:
1. Automated scheduled job for daily expiry checks
2. Email notifications for critical expiry alerts
3. Report generation for expired products
4. Bulk actions for expired product management
5. Integration with purchase orders for expiry planning
6. Expiry date forecasting based on sales velocity

## Testing Recommendations

1. Create products with various expiry dates:
   - Expired products
   - Products expiring in 15 days
   - Products expiring in 45 days
   - Products expiring in 120 days
   - Products expiring in 200 days
   - Products without expiry dates

2. Test notification creation:
   - Single product notification
   - Bulk notifications
   - Verify priority assignment
   - Check notification content

3. Test statistics accuracy:
   - Compare manual counts with API results
   - Verify date range calculations
   - Test timezone handling

## Support & Troubleshooting

**Issue**: Products without expiry dates appear in results
- **Solution**: Ensure products have valid `expiry_date` values

**Issue**: Incorrect days calculation
- **Solution**: Check server timezone configuration

**Issue**: Notifications not being created
- **Solution**: Verify notification system is properly configured
