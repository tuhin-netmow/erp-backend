# Sales Module Documentation

## 🛒 Module Overview

**Module Name**: Sales Management
**API Endpoints**: 43
**Status**: ✅ Complete
**Last Updated**: March 16, 2026

---

## 🔌 API Endpoints

### Order Management (7 endpoints)

#### 1. Get All Orders
```http
GET /api/sales/orders?page=1&limit=10&status=pending&customer_id=15&search=keyword
```

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (pending, confirmed, in-transit, delivered, cancelled)
- `customer_id` (optional): Filter by customer
- `search` (optional): Search by order number

**Response**:
```json
{
  "status": true,
  "message": "Orders retrieved successfully",
  "data": [
    {
      "id": 22,
      "order_number": "SO-2026-001",
      "status": "pending",
      "customer": {
        "id": 15,
        "name": "John Doe",
        "company": "Acme Corporation"
      },
      "total_amount": "171.48",
      "order_date": "2026-03-13T00:00:00.000Z",
      "due_date": "2026-03-20T00:00:00.000Z",
      "items": [...]
    }
  ],
  "pagination": {
    "total": 18,
    "page": 1,
    "limit": 10
  }
}
```

---

#### 2. Get Order by ID
```http
GET /api/sales/orders/:id
```

**Path Parameters**:
- `id`: Order ID

**Features**:
- Includes full order details
- Includes all items with product information
- Includes customer details
- Includes stock quantities and units

---

#### 3. Create Order
```http
POST /api/sales/orders
```

**Request Body**:
```json
{
  "customer_id": 15,
  "order_date": "2026-03-13",
  "due_date": "2026-03-20",
  "delivery_date": "2026-03-25",
  "shipping_address": "123 Main St, City, Country",
  "staff_id": 5,
  "notes": "Urgent delivery requested",
  "items": [
    {
      "product_id": 102,
      "quantity": 10,
      "unit_price": 0.68,
      "discount": 2.00,
      "sales_tax": 10,
      "remark": "Customer requested extra packaging"
    }
  ]
}
```

**Features**:
- ✅ Validates stock availability before creating
- ✅ Deducts stock for all items (movement type: "sale")
- ✅ Creates stock movement records
- ✅ Auto-generates order number (SO-YYYY-NNN)
- ✅ Calculates line totals and order totals
- ✅ Sets initial status to "pending"

**Stock Movement Created**:
```json
{
  "product_id": 102,
  "movement_type": "sale",
  "quantity": -10,
  "reference_type": "order",
  "reference_id": 22,
  "notes": "Stock deducted for order SO-2026-001"
}
```

---

#### 4. Update Order
```http
PUT /api/sales/orders/:id
```

**Features**:
- Updates order-level fields (customer, dates, address, notes, staff)
- Can update items array (full update)
- Recalculates order totals
- **Only works for pending orders**

---

#### 5. Delete Order
```http
DELETE /api/sales/orders/:id
```

**Features**:
- Deletes order from database
- **Restores stock** for all items (movement type: "return")
- Creates stock movement records for each item

**Stock Restored**:
```json
{
  "product_id": 102,
  "movement_type": "return",
  "quantity": 10,
  "reference_type": "order",
  "reference_id": 22,
  "notes": "Stock restored due to order deletion SO-2026-001"
}
```

---

#### 6. Update Order Status
```http
PATCH /api/sales/orders/:id/status
```

**Request Body**:
```json
{
  "status": "confirmed"
}
```

**Status Flow**:
```
pending → confirmed → in-transit → delivered
         ↘ cancelled
```

---

#### 7. Get Dummy (Pending) Orders
```http
GET /api/sales/orders/dummy
```

**Alias for**: Get all orders with status='pending'

---

### Order Item CRUD (3 NEW endpoints)

#### 8. Add Order Item ⭐ NEW
```http
POST /api/sales/orders/:orderId/items
```

**Description**: Add a new product to an existing order

**Path Parameters**:
- `orderId`: Order ID

**Request Body**:
```json
{
  "product_id": 102,
  "quantity": 15,
  "unit_price": 0.68,
  "discount": 2.00,
  "sales_tax": 10,
  "remark": "New item added"
}
```

**Features**:
- ✅ Validates order is pending
- ✅ Validates stock availability
- ✅ Deducts stock by quantity (movement type: "sale")
- ✅ Creates stock movement record
- ✅ Recalculates order totals
- ✅ Returns updated item with product details

**Stock Movement Created**:
```json
{
  "product_id": 102,
  "movement_type": "sale",
  "quantity": -15,
  "reference_type": "order",
  "reference_id": 22,
  "notes": "Stock deducted for order SO-2026-001"
}
```

**Response**:
```json
{
  "status": true,
  "message": "Order item added successfully",
  "data": {
    "id": 46,
    "order_id": 22,
    "product_id": 102,
    "quantity": 15,
    "line_total": 8.43,
    "product": {
      "id": 102,
      "name": "ISPAHANI POTATO CRACKERS",
      "sku": "FZ-0178",
      "specification": "200g pack",
      "stock_quantity": 22,
      "unit": {
        "name": "Pieces",
        "symbol": "PCS"
      }
    }
  }
}
```

---

#### 9. Update Order Item ⭐ NEW
```http
PUT /api/sales/orders/:orderId/items/:itemId
```

**Description**: Update a single order item (quantity, price, discount, tax, remark)

**Path Parameters**:
- `orderId`: Order ID
- `itemId`: Order Item ID

**Request Body**:
```json
{
  "quantity": 20,
  "unit_price": 0.70,
  "discount": 2.50,
  "sales_tax": 10,
  "remark": "Updated quantity and price"
}
```

**Features**:
- ✅ Validates order is pending
- ✅ **Calculates quantity difference**: newQuantity - oldQuantity
- ✅ **Adjusts stock based on difference**:
  - If quantity INCREASES: Stock decreases by difference (movement type: "sale")
  - If quantity DECREASES: Stock increases by difference (movement type: "return")
- ✅ Creates stock movement record with audit trail
- ✅ Validates stock availability before increasing
- ✅ Recalculates line total and order totals
- ✅ Updates item values

**Stock Movement Examples**:

**Example 1: Increase Quantity (10 → 20, difference = +10)**
```json
{
  "product_id": 102,
  "movement_type": "sale",
  "quantity": -10,
  "reference_type": "order",
  "reference_id": 22,
  "notes": "Stock adjusted for order SO-2026-001 (quantity increased from 10 to 20)"
}
```

**Example 2: Decrease Quantity (20 → 15, difference = -5)**
```json
{
  "product_id": 102,
  "movement_type": "return",
  "quantity": 5,
  "reference_type": "order",
  "reference_id": 22,
  "notes": "Stock restored for order SO-2026-001 (quantity decreased from 20 to 15)"
}
```

---

#### 10. Delete Order Item ⭐ NEW
```http
DELETE /api/sales/orders/:orderId/items/:itemId
```

**Description**: Delete a single order item and restore its stock

**Path Parameters**:
- `orderId`: Order ID
- `itemId`: Order Item ID

**Features**:
- ✅ Validates order is pending
- ✅ **Restores full stock quantity** (movement type: "return")
- ✅ Creates stock movement record for audit
- ✅ Deletes item from database
- ✅ Recalculates order totals
- ✅ Returns confirmation with stock restored amount

**Stock Movement Created**:
```json
{
  "product_id": 102,
  "movement_type": "return",
  "quantity": 20,
  "reference_type": "order",
  "reference_id": 22,
  "notes": "Stock restored due to item deletion from order SO-2026-001"
}
```

**Response**:
```json
{
  "status": true,
  "message": "Order item deleted successfully",
  "data": {
    "itemId": 45,
    "quantity": 20,
    "stockRestored": 20
  }
}
```

---

### Invoices (6 endpoints)

#### 11-16. Invoice Endpoints
```http
GET /api/sales/invoices          # List all invoices
GET /api/sales/invoices/:id       # Get invoice by ID
POST /api/sales/invoices          # Create invoice
PUT /api/sales/invoices/:id       # Update invoice
PATCH /api/sales/invoices/:id/status # Update invoice status
DELETE /api/sales/invoices/:id     # Delete invoice
```

---

### Sales Returns (6 endpoints)

#### 17-22. Sales Return Endpoints
```http
GET /api/sales/returns            # List all returns
GET /api/sales/returns/:id         # Get return by ID
POST /api/sales/returns            # Create return
PUT /api/sales/returns/:id         # Update return
PATCH /api/sales/returns/:id/status # Update return status
DELETE /api/sales/returns/:id      # Delete return
```

**Return Status Flow**:
```
pending → approved → completed
         ↘ rejected
```

---

### Delivery Routes (5 endpoints)

#### 23-27. Route Endpoints
```http
GET /api/sales/routes             # List all routes
GET /api/sales/routes/:id          # Get route by ID
POST /api/sales/routes             # Create route
PUT /api/sales/routes/:id          # Update route
DELETE /api/sales/routes/:id       # Delete route
```

**Route Features**:
- Assign orders to routes
- Assign staff to routes
- Route date and status tracking

---

### E-Invoice (3 endpoints)

#### 28-30. E-Invoice Endpoints
```http
POST /api/sales/e-invoice          # Generate e-invoice
PUT /api/sales/e-invoice/:id/submit # Submit to tax authority
GET /api/sales/e-invoice/:id       # Get e-invoice status
```

---

### Products & Warehouses (5 endpoints)

#### 31-35. Product & Warehouse Endpoints
```http
GET /api/sales/products            # List products (for orders)
GET /api/sales/warehouses          # List warehouses
POST /api/sales/warehouses          # Create warehouse
PUT /api/sales/warehouses/:id       # Update warehouse
DELETE /api/sales/warehouses/:id    # Delete warehouse
```

---

### Staff & Customers (5 endpoints)

#### 36-40. Staff & Customer Endpoints
```http
GET /api/sales/customers           # List customers (for orders)
GET /api/sales/customers/:id       # Get customer by ID
GET /api/sales/staffs              # List sales staff
GET /api/sales/orders/by-route/:routeId # Get orders by route
PATCH /api/sales/orders/:orderId/assign-staff # Assign staff to order
```

---

### Reports & Analytics (3 endpoints)

#### 41-43. Reporting Endpoints
```http
GET /api/sales/orders-items        # Get all order items (for reports)
GET /api/sales/reports/daily-sales  # Daily sales summary
GET /api/sales/reports/customer-wise # Customer-wise sales
```

---

## 📊 Database Tables

### Primary Tables:
1. **orders** - Sales orders header
2. **order_items** - Sales order line items
3. **invoices** - Sales invoices
4. **sales_returns** - Sales return orders
5. **sales_return_items** - Sales return line items
6. **sales_routes** - Delivery routes
7. **stock_movements** - Stock movement history

### Key Relationships:
```
orders (1) → (many) order_items
orders (1) → (1) customers
orders (1) → (1) staffs
orders (1) → (many) invoices
orders (1) → (1) sales_routes
order_items (1) → (1) products
invoices (1) → (many) invoice_payments
```

---

## 🔄 Stock Movement Integration

### Automatic Stock Tracking

All order item operations automatically create stock_movement records:

| Operation | Stock Change | Movement Type | Quantity |
|-----------|-------------|---------------|----------|
| Add Item | Decrease | sale | Negative |
| Increase Qty | Decrease by diff | sale | Negative |
| Decrease Qty | Increase by diff | return | Positive |
| Delete Item | Increase | return | Positive |
| Delete Order | Increase | return | Positive |

### Stock Movement Record Structure
```javascript
{
  id: 123,
  product_id: 102,
  movement_type: "sale" | "return",
  quantity: -10, // Negative for out, positive for in
  reference_type: "order",
  reference_id: 22,
  notes: "Stock deducted for order SO-2026-001",
  created_by: 5,
  created_at: "2026-03-16T10:30:00.000Z"
}
```

### Audit Trail
Every stock change includes:
- ✅ Product ID
- ✅ Movement type (sale/return)
- ✅ Quantity (+/-)
- ✅ Reference (order ID)
- ✅ Descriptive notes
- ✅ User who made the change
- ✅ Timestamp

---

## 🎯 Frontend Implementation

### React Query Hooks
```typescript
import {
  useGetSalesOrdersQuery,
  useGetSalesOrderByIdQuery,
  useCreateSalesOrderMutation,
  useUpdateSalesOrderMutation,
  useDeleteSalesOrderMutation,
  useAddSalesOrderItemMutation,
  useUpdateSalesOrderItemMutation,
  useDeleteSalesOrderItemMutation,
} from "@/store/features/salesOrder/salesOrder";
```

### Usage Examples

#### Add Order Item
```typescript
const [addSalesOrderItem, { isLoading }] = useAddSalesOrderItemMutation();

const handleAddItem = async (orderId, itemData) => {
  try {
    const res = await addSalesOrderItem({
      orderId: orderId,
      data: itemData
    }).unwrap();

    if (res.status) {
      toast.success("Item added and stock deducted");
      // Refresh order data
      refetch();
    }
  } catch (error) {
    toast.error(error?.data?.message || "Failed to add item");
  }
};
```

#### Update Order Item
```typescript
const [updateSalesOrderItem, { isLoading }] = useUpdateSalesOrderItemMutation();

const handleUpdateItem = async (orderId, itemId, itemData) => {
  try {
    const res = await updateSalesOrderItem({
      orderId: orderId,
      itemId: itemId,
      data: itemData
    }).unwrap();

    if (res.status) {
      toast.success("Item updated, stock adjusted");
      refetch();
    }
  } catch (error) {
    toast.error(error?.data?.message || "Failed to update item");
  }
};
```

#### Delete Order Item
```typescript
const [deleteSalesOrderItem, { isLoading }] = useDeleteSalesOrderItemMutation();

const handleDeleteItem = async (orderId, itemId) => {
  try {
    const res = await deleteSalesOrderItem({
      orderId: orderId,
      itemId: itemId
    }).unwrap();

    if (res.status) {
      toast.success(`Item deleted, ${res.data.stockRestored} units restored`);
      refetch();
    }
  } catch (error) {
    toast.error(error?.data?.message || "Failed to delete item");
  }
};
```

---

## 📝 Customer Display Format

All sales pages use consistent customer display:

```
Acme Corporation          ← Company Name (small, muted gray)
John Doe                  ← Customer Name (bold, normal)
```

**Pages Updated** (14 total):
- Orders: Pending, All, Confirmed, Delivered, In-transit, Returned
- Invoices: All, E-Invoices
- Payments: All
- Delivery: All
- Returns: All, Approved, Pending, Return Payments

---

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot edit new item"
**Cause**: New items don't have IDs until order is saved

**Solution**:
```typescript
if (currentItem.id) {
  // Use single-item API
  await updateSalesOrderItem(...);
} else {
  // Save entire order first
  await updateSalesOrder(...);
}
```

### Issue 2: Stock Not Updating
**Cause**: Stock movement service not called

**Solution**: Ensure stockMovements are created in service layer:
```javascript
await StockMovement.create({
  product_id: item.product_id,
  movement_type: 'sale',
  quantity: -item.quantity,
  reference_type: 'order',
  reference_id: order.id,
  notes: `Stock deducted for order ${order_number}`,
  created_by: userId
});
```

---

## 🔗 Related Modules

- **Products**: Product data and stock management
- **Customers**: Customer information
- **Staffs**: Sales staff management
- **Inventory**: Stock movement tracking
- **Accounting**: Invoice posting to ledger
- **Reports**: Sales analytics and reporting

---

*Documentation Version: 1.0.0*
*Last Updated: March 16, 2026*
