# Dashboard Module Documentation

## 📊 Module Overview

**Module Name**: Dashboard
**API Endpoints**: 3
**Status**: ✅ Complete
**Last Updated**: March 16, 2026

---

## 🔌 API Endpoints

### 1. Get Dashboard Stats
```http
GET /api/dashboard
```

**Description**: Fetch comprehensive dashboard statistics including orders, customers, revenue, and alerts.

**Authentication**: Required (JWT Token)

**Response**:
```json
{
  "success": true,
  "data": {
    "totalOrders": 18,
    "pendingOrders": 9,
    "activeCustomers": 7,
    "lowStock": 6,
    "revenue": 16425.50,
    "activeStaff": 5
  }
}
```

**Field Descriptions**:
- `totalOrders`: Total count of all orders in the system
- `pendingOrders`: Count of orders with status='pending'
- `activeCustomers`: Count of customers with is_active=true
- `lowStock`: Count of products where stock_quantity ≤ min_stock_level
- `revenue`: Sum of total_amount from all non-cancelled orders (status != 'cancelled')
- `activeStaff`: Count of staff with status='active'

**Database Queries**:
```javascript
// Total Orders
Order.count()

// Pending Orders
Order.count({ where: { status: 'pending' } })

// Active Customers
Customer.count({ where: { is_active: true } })

// Low Stock Products
Product.count({
  where: {
    stock_quantity: {
      [Op.lte]: sequelize.col('min_stock_level')
    }
  }
})

// Revenue (All Non-Cancelled Orders)
Order.sum('total_amount', {
  where: {
    status: { [Op.ne]: 'cancelled' }
  }
})

// Active Staff
Staff.count({ where: { status: 'active' } })
```

---

### 2. Get Charts Data
```http
GET /api/dashboard/charts
```

**Description**: Get monthly sales chart data for the current year.

**Authentication**: Required

**Response**:
```json
[
  { "name": "Jan", "total": 1500 },
  { "name": "Feb", "total": 2300 },
  { "name": "Mar", "total": 1800 },
  ...
  { "name": "Dec", "total": 0 }
]
```

**Database Query**:
```sql
SELECT
  MONTH(order_date) as month,
  SUM(total_amount) as total
FROM orders
WHERE YEAR(order_date) = :year
AND status != 'cancelled'
GROUP BY MONTH(order_date)
```

**Features**:
- Returns all 12 months (months with no sales show 0)
- Only includes non-cancelled orders
- Groups by month number (1-12)

---

### 3. Get Staff Charts Data
```http
GET /api/dashboard/staffs/charts?staff_id=1
```

**Description**: Get month-wise total sales for a specific staff member for the current year.

**Authentication**: Required

**Query Parameters**:
- `staff_id` (optional): Staff member ID. If not provided, uses logged-in user's ID.

**Response**:
```json
[
  { "name": "Jan", "total": 0 },
  { "name": "Feb", "total": 1544 },
  { "name": "Mar", "total": 353.16 },
  ...
  { "name": "Dec", "total": 0 }
]
```

**Database Query**:
```sql
SELECT
  MONTH(order_date) as month,
  SUM(total_amount) as total
FROM orders
WHERE YEAR(order_date) = :year
AND status != 'cancelled'
AND created_by = :staffId
GROUP BY MONTH(order_date)
```

**Features**:
- Shows sales created by specific staff member
- Returns all 12 months
- Only includes non-cancelled orders

---

## 📊 Database Tables Used

### Primary Tables:
1. **orders** - Sales orders table
2. **customers** - Customer information
3. **products** - Product inventory
4. **staffs** - Staff members

### Fields Accessed:

#### orders
- `id` - Order ID
- `order_number` - Unique order number
- `status` - Order status (pending, confirmed, in-transit, delivered, cancelled)
- `total_amount` - Order total value
- `order_date` - Order creation date
- `created_by` - Staff ID who created the order

#### customers
- `id` - Customer ID
- `is_active` - Active status (true/false)

#### products
- `id` - Product ID
- `name` - Product name
- `stock_quantity` - Current stock level
- `min_stock_level` - Minimum stock threshold

#### staffs
- `id` - Staff ID
- `status` - Staff status (active, inactive)

---

## 🎯 Frontend Integration

### React Query Hooks
```typescript
// No dedicated hooks (uses fetch/axios)
const fetchDashboardStats = async () => {
  const response = await fetch('/api/dashboard', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.json();
};

const fetchChartsData = async () => {
  const response = await fetch('/api/dashboard/charts', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.json();
};

const fetchStaffCharts = async (staffId) => {
  const response = await fetch(`/api/dashboard/staffs/charts?staff_id=${staffId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.json();
};
```

### Component Usage
```tsx
// Dashboard Component Example
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    // Fetch dashboard stats
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(data => setStats(data.data));

    // Fetch chart data
    fetch('/api/dashboard/charts')
      .then(res => res.json())
      .then(data => setChartData(data));
  }, []);

  return (
    <div>
      <StatsCards data={stats} />
      <SalesChart data={chartData} />
    </div>
  );
}
```

---

## 🔧 Key Features

### Revenue Calculation
- **Previous Implementation**: Only included paid orders (payment_status='paid')
- **Current Implementation**: Includes all non-cancelled orders (status != 'cancelled')
- **Reason**: Revenue should reflect all confirmed sales regardless of payment status

**Example**:
```
Order 1: status='pending', total=100 → Included in revenue ✅
Order 2: status='confirmed', total=200 → Included in revenue ✅
Order 3: status='cancelled', total=150 → NOT included ❌
Order 4: status='delivered', payment_status='unpaid', total=300 → Included ✅
```

### Low Stock Detection
- **Formula**: `stock_quantity <= min_stock_level`
- **Purpose**: Alert when products need reordering
- **Display**: Shows count of products below threshold

### Performance Metrics
- All queries use indexed fields (status, is_active)
- Parallel execution with Promise.all for faster response
- Efficient aggregation at database level

---

## 📈 Sample Use Cases

### Use Case 1: Admin Dashboard View
```javascript
// Get all dashboard metrics
GET /api/dashboard

// Response shows business health at a glance:
// - 18 total orders (9 pending attention)
// - 7 active customers
// - 6 products need restocking
// - RM 16,425.50 revenue from all sales
// - 5 active sales staff
```

### Use Case 2: Monthly Sales Analysis
```javascript
// Get monthly sales chart
GET /api/dashboard/charts

// Response shows sales trend:
// Jan: RM 1,500
// Feb: RM 2,300
// Mar: RM 1,800
// ...
```

### Use Case 3: Staff Performance Review
```javascript
// Get specific staff member's sales
GET /api/dashboard/staffs/charts?staff_id=5

// Response shows individual performance:
// Feb: RM 1,544 (best month)
// Mar: RM 353.16
```

---

## 🐛 Troubleshooting

### Issue: Revenue Shows 0
**Cause**:
- Old implementation checked payment_status='paid'
- Most orders have payment_status='unpaid'

**Solution**:
```javascript
// Changed from:
Order.sum('total_amount', { where: { payment_status: 'paid' } })

// To:
Order.sum('total_amount', {
  where: { status: { [Op.ne]: 'cancelled' } }
})
```

### Issue: Chart Shows Empty
**Cause**: No orders for current year

**Solution**:
- Query returns all 12 months with 0 for months without sales
- Create test orders to populate chart data

---

## 📝 API Version Information

**Root Endpoint**: `GET /`

**Response**:
```json
{
  "ok": true,
  "message": "ERP API (modular)",
  "version": "1.0.0",
  "timestamp": "2026-03-16T14:30:00.000Z",
  "environment": "development"
}
```

---

## 🔗 Related Modules

- **Sales**: Orders data source
- **Products**: Stock data source
- **Customers**: Customer data source
- **Staffs**: Staff performance data
- **Reports**: Detailed reporting

---

*Documentation Version: 1.0.0*
*Last Updated: March 16, 2026*
