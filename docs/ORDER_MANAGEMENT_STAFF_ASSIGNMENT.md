# Order Management - Staff Assignment Feature

## Overview
Implemented a comprehensive Order Management system that allows assigning multiple staff members to orders for better task delegation and tracking.

## Database Changes

### New Table: `order_staff`
Junction table for many-to-many relationship between orders and staff.

**Columns:**
- `id` - Primary key
- `order_id` - Foreign key to orders table
- `staff_id` - Foreign key to staffs table
- `assigned_at` - Timestamp of assignment
- `assigned_by` - User ID who made the assignment
- `role` - Optional role (e.g., 'primary', 'support', 'driver')
- `created_at`, `updated_at` - Timestamps

**Migration File:** `/migrations/20260106_create_order_staff_table.sql`

To apply the migration, run:
```sql
SOURCE /Applications/MAMP/htdocs/backened-erp-minimal/migrations/20260106_create_order_staff_table.sql;
```

## API Endpoints

### 1. GET `/api/sales/orders/management`
Retrieve all orders with their assigned staff members.

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `status` - Filter by order status
- `search` - Search by order number

**Response:**
```json
{
  "success": true,
  "message": "Orders with staff retrieved successfully",
  "pagination": { "total": 100, "page": 1, "limit": 10 },
  "data": [
    {
      "id": 101,
      "order_number": "ORD-101",
      "customer": "Tech Solutions",
      "order_date": "2023-10-25",
      "status": "Pending",
      "total_amount": 1500.00,
      "assigned_staff": []
    },
    {
      "id": 102,
      "order_number": "ORD-102",
      "customer": "Global Traders",
      "order_date": "2023-10-24",
      "status": "Shipped",
      "total_amount": 8500.00,
      "assigned_staff": [
        {
          "id": 1,
          "name": "John Doe",
          "email": "john@example.com",
          "position": "Sales Rep"
        }
      ]
    }
  ]
}
```

### 2. POST `/api/sales/orders/:id/assign-staff`
Assign multiple staff members to a specific order.

**Request Body:**
```json
{
  "staff_ids": [1, 2, 3]
}
```

**Response:**
```json
{
  "status": true,
  "message": "Staff assigned to order successfully",
  "data": {
    "id": 101,
    "order_number": "ORD-101",
    "assignedStaff": [
      { "id": 1, "first_name": "John", "last_name": "Doe" },
      { "id": 2, "first_name": "Jane", "last_name": "Smith" }
    ]
  }
}
```

## Code Structure

### Models (`src/modules/sales/sales.models.js`)
- Added `OrderStaff` model
- Created many-to-many associations between Order and Staff

### Repository (`src/modules/sales/sales.repository.js`)
- `assignStaffToOrder(orderId, staffIds, assignedBy)` - Assign staff to order
- `getOrdersWithStaff(filters, limit, offset)` - Fetch orders with staff

### Service (`src/modules/sales/sales.service.js`)
- `assignStaffToOrder(orderId, staffIds, userId)` - Business logic for assignment
- `getOrdersWithStaff(filters, page, limit)` - Transform and paginate orders

### Controller (`src/modules/sales/sales.controller.js`)
- `assignStaffToOrder(req, res)` - Handle assignment requests
- `getOrdersWithStaff(req, res)` - Handle list requests

### Routes (`src/modules/sales/sales.routes.js`)
- Registered both endpoints with full documentation
- Includes sample requests/responses and examples

## Features

1. **Multiple Staff Assignment**: Assign multiple staff members to a single order
2. **Flexible Roles**: Optional role field for different staff responsibilities
3. **Assignment Tracking**: Records who assigned staff and when
4. **Pagination & Filtering**: Full support for search and status filters
5. **Validation**: Ensures all staff IDs exist before assignment
6. **Transaction Safety**: Uses database transactions for data integrity
7. **Comprehensive Documentation**: Full API documentation in routes metadata

## Usage Example

```javascript
// Assign staff to order
const response = await fetch('http://localhost:5000/api/sales/orders/101/assign-staff', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    staff_ids: [1, 2, 3]
  })
});

// Get orders with staff
const orders = await fetch('http://localhost:5000/api/sales/orders/management?page=1&limit=10');
```

## Next Steps

1. Run the database migration to create the `order_staff` table
2. Test the endpoints using the API documentation at `/routes-tree`
3. Integrate with your frontend order management interface
