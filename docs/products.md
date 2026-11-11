# Products Module Documentation

## 📦 Module Overview

**Module Name**: Products & Inventory Management
**API Endpoints**: 20
**Status**: ✅ Complete
**Last Updated**: March 16, 2026

---

## 🔌 API Endpoints

### Product CRUD (8 endpoints)

#### 1. Get All Products
```http
GET /api/sales/products?page=1&limit=10&category=5&search=keyword
```

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `category`: Filter by category ID
- `search`: Search by name, SKU, or specification

**Response**:
```json
{
  "status": true,
  "message": "Products retrieved successfully",
  "data": [
    {
      "id": 102,
      "name": "ISPAHANI POTATO CRACKERS",
      "sku": "FZ-0178",
      "price": "0.68",
      "specification": "200g pack",
      "stock_quantity": 37,
      "min_stock_level": 10,
      "category": {
        "id": 5,
        "name": "Food Items"
      },
      "unit": {
        "id": 1,
        "name": "Pieces",
        "symbol": "PCS"
      }
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 10
  }
}
```

---

#### 2. Get Product by ID
```http
GET /api/sales/products/:id
```

**Features**:
- Full product details
- Category information
- Unit information
- Current stock level
- Stock movements history (if requested)

---

#### 3. Create Product
```http
POST /api/sales/products
```

**Request Body**:
```json
{
  "name": "New Product",
  "sku": "PROD-001",
  "price": "10.50",
  "description": "Product description",
  "specification": "Detailed specs",
  "category_id": 5,
  "unit_id": 1,
  "stock_quantity": 100,
  "min_stock_level": 20,
  "warehouse_id": 1,
  "barcode": "1234567890",
  "image_url": "/uploads/products/image.jpg"
}
```

**Features**:
- SKU validation (must be unique)
- Price validation (must be positive)
- Stock validation (must be non-negative)
- Auto-creates opening stock movement

---

#### 4. Update Product
```http
PUT /api/sales/products/:id
```

**Updatable Fields**:
- name, sku, price, description, specification
- category_id, unit_id, warehouse_id
- stock_quantity, min_stock_level
- barcode, image_url

**Note**: If stock_quantity changes, creates stock movement record

---

#### 5. Delete Product
```http
DELETE /api/sales/products/:id
```

**Validation**:
- Cannot delete if product has orders
- Cannot delete if product has stock movements (except opening)
- Returns error if validation fails

---

#### 6. Search Products
```http
GET /api/sales/products/search?q=keyword
```

**Features**:
- Fast product search
- Searches in: name, SKU, specification
- Returns top 20 matches

---

#### 7. Get Low Stock Products
```http
GET /api/sales/products/low-stock
```

**Returns**: Products where `stock_quantity <= min_stock_level`

**Use Case**: Dashboard alerts, reorder reports

---

#### 8. Get Product Stock Movements
```http
GET /api/sales/products/:id/stock-movements?page=1&limit=10
```

**Query Parameters**:
- `page`: Page number
- `limit`: Items per page
- `start_date`: Filter by date range (start)
- `end_date`: Filter by date range (end)
- `movement_type`: Filter by type (sale, purchase, return, etc.)

**Response**:
```json
{
  "status": true,
  "data": [
    {
      "id": 456,
      "movement_type": "sale",
      "quantity": -10,
      "reference_type": "order",
      "reference_id": 22,
      "notes": "Stock deducted for order SO-2026-001",
      "created_at": "2026-03-16T10:30:00.000Z",
      "created_by": {
        "id": 5,
        "name": "John Staff"
      }
    }
  ]
}
```

---

### Categories (5 endpoints)

#### 9-13. Category Endpoints
```http
GET /api/sales/categories           # List all categories
GET /api/sales/categories/:id       # Get category by ID
POST /api/sales/categories          # Create category
PUT /api/sales/categories/:id       # Update category
DELETE /api/sales/categories/:id    # Delete category
```

**Category Structure**:
```json
{
  "id": 5,
  "name": "Food Items",
  "description": "Consumable food products",
  "parent_id": null
}
```

---

### Units (4 endpoints)

#### 14-17. Unit Endpoints
```http
GET /api/sales/units                # List all units
GET /api/sales/units/:id            # Get unit by ID
POST /api/sales/units               # Create unit
DELETE /api/sales/units/:id         # Delete unit
```

**Unit Structure**:
```json
{
  "id": 1,
  "name": "Pieces",
  "symbol": "PCS",
  "description": "Individual pieces"
}
```

**Common Units**:
- PCS (Pieces)
- KG (Kilogram)
- LTR (Liter)
- MTR (Meter)
- BOX (Box)
- CTN (Carton)

---

### Warehouses (5 endpoints)

#### 18-22. Warehouse Endpoints
```http
GET /api/sales/warehouses           # List all warehouses
GET /api/sales/warehouses/:id       # Get warehouse by ID
POST /api/sales/warehouses          # Create warehouse
PUT /api/sales/warehouses/:id       # Update warehouse
DELETE /api/sales/warehouses/:id    # Delete warehouse
```

**Warehouse Structure**:
```json
{
  "id": 1,
  "name": "Main Warehouse",
  "location": "New York",
  "capacity": 10000,
  "is_active": true
}
```

---

## 📊 Database Tables

### Primary Tables:
1. **products** - Product master data
2. **product_categories** - Product categories
3. **units** - Measurement units
4. **warehouses** - Storage locations
5. **stock_movements** - Stock movement history

### products Table Structure
```sql
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  specification TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category_id INT,
  unit_id INT,
  warehouse_id INT,
  stock_quantity INT DEFAULT 0,
  min_stock_level INT DEFAULT 0,
  barcode VARCHAR(100),
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES product_categories(id),
  FOREIGN KEY (unit_id) REFERENCES units(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);
```

### stock_movements Table Structure
```sql
CREATE TABLE stock_movements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  movement_type ENUM('opening', 'purchase', 'sale', 'return', 'adjustment', 'transfer', 'consumption', 'production'),
  quantity INT NOT NULL,
  reference_type VARCHAR(50),
  reference_id INT,
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

---

## 🔄 Stock Movement Types

| Type | Description | Quantity | Example |
|------|-------------|----------|---------|
| **opening** | Initial stock when product created | Positive | +100 |
| **purchase** | Stock added from purchase order | Positive | +50 |
| **sale** | Stock deducted from sales order | Negative | -10 |
| **return** | Stock restored from sales return | Positive | +5 |
| **adjustment** | Manual stock correction | +/- | +2 / -1 |
| **transfer** | Stock moved between warehouses | +/- | -20 / +20 |
| **consumption** | Stock used in production | Negative | -30 |
| **production** | Stock created from production | Positive | +100 |

---

## 🎯 Stock Calculation

### Current Stock Formula
```javascript
current_stock = opening_stock
                + purchase_quantity
                + return_quantity
                + production_quantity
                + adjustment_positive
                - sale_quantity
                - consumption_quantity
                - adjustment_negative
```

### Stock Alert Condition
```javascript
if (stock_quantity <= min_stock_level) {
  // Product is in low stock
  // Show alert on dashboard
  // Send notification to purchasing
}
```

---

## 📱 Frontend Integration

### React Query Hooks
```typescript
import {
  useGetAllProductsQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetLowStockProductsQuery,
  useGetProductStockMovementsQuery,
} from "@/store/features/admin/productsApiService";
```

### Usage Examples

#### Product List with Stock
```tsx
import { useGetAllProductsQuery } from "@/store/features/admin/productsApiService";

export default function ProductList() {
  const { data, isLoading } = useGetAllProductsQuery({
    page: 1,
    limit: 20
  });

  return (
    <table>
      <thead>
        <tr>
          <th>SKU</th>
          <th>Product</th>
          <th>Stock</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {data?.data.map(product => (
          <tr key={product.id}>
            <td>{product.sku}</td>
            <td>{product.name}</td>
            <td>
              {product.stock_quantity} {product.unit?.symbol}
            </td>
            <td>
              {product.stock_quantity <= product.min_stock_level ? (
                <Badge variant="destructive">Low Stock</Badge>
              ) : (
                <Badge variant="secondary">In Stock</Badge>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

#### Stock Movements History
```tsx
import { useGetProductStockMovementsQuery } from "@/store/features/admin/productsApiService";

export default function StockMovements({ productId }) {
  const { data } = useGetProductStockMovementsQuery({
    productId,
    page: 1,
    limit: 10
  });

  return (
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Type</th>
          <th>Quantity</th>
          <th>Reference</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        {data?.data.map(movement => (
          <tr key={movement.id}>
            <td>{new Date(movement.created_at).toLocaleDateString()}</td>
            <td>
              <Badge variant={
                movement.quantity < 0 ? "destructive" : "default"
              }>
                {movement.movement_type}
              </Badge>
            </td>
            <td className={movement.quantity < 0 ? "text-red-600" : "text-green-600"}>
              {movement.quantity > 0 ? '+' : ''}{movement.quantity}
            </td>
            <td>{movement.reference_type} #{movement.reference_id}</td>
            <td>{movement.notes}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## 📝 Stock Validation

### Before Creating Order
```javascript
// Validate sufficient stock
const product = await Product.findById(productId);
if (product.stock_quantity < requestedQuantity) {
  throw new Error(`Insufficient stock. Available: ${product.stock_quantity}, Requested: ${requestedQuantity}`);
}

// Deduct stock
const newStock = product.stock_quantity - requestedQuantity;
await Product.update(productId, { stock_quantity: newStock });

// Create movement
await StockMovement.create({
  product_id: productId,
  movement_type: 'sale',
  quantity: -requestedQuantity,
  reference_type: 'order',
  reference_id: orderId,
  notes: `Stock deducted for order ${order_number}`
});
```

### Before Increasing Order Item Quantity
```javascript
const oldQuantity = item.quantity;
const newQuantity = requestedQuantity;
const difference = newQuantity - oldQuantity;

if (difference > 0) {
  // Check stock availability
  const product = await Product.findById(productId);
  if (product.stock_quantity < difference) {
    throw new Error(`Insufficient stock for increase. Available: ${product.stock_quantity}, Required: ${difference}`);
  }

  // Deduct difference
  const newStock = product.stock_quantity - difference;
  await Product.update(productId, { stock_quantity: newStock });

  // Create movement
  await StockMovement.create({
    product_id: productId,
    movement_type: 'sale',
    quantity: -difference,
    reference_type: 'order',
    reference_id: orderId,
    notes: `Stock adjusted for order (quantity increased from ${oldQuantity} to ${newQuantity})`
  });
}
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Stock Goes Negative
**Cause**: Stock not validated before deduction

**Solution**:
```javascript
// Always validate before deduction
if (product.stock_quantity < quantity) {
  throw new Error('Insufficient stock');
}
```

### Issue 2: Stock Not Updating
**Cause**: Stock movement not created

**Solution**:
```javascript
// Create stock movement for every stock change
await StockMovement.create({
  product_id: productId,
  movement_type: 'sale',
  quantity: -quantity,
  reference_type: 'order',
  reference_id: orderId,
  notes: 'Descriptive notes',
  created_by: userId
});
```

### Issue 3: Duplicate SKU
**Cause**: SKU not unique in database

**Solution**:
```javascript
// Add unique constraint to SKU
sku: {
  type: DataTypes.STRING,
  unique: true,
  allowNull: false
}
```

---

## 🔗 Related Modules

- **Sales**: Orders consume stock
- **Purchase**: Orders add stock
- **Production**: Creates finished goods stock
- **Raw Materials**: Consumed in production
- **Reports**: Stock reports and analytics
- **Inventory**: Complete inventory management

---

## 📈 Stock Reports

### Available Reports
1. **Current Stock Report** - All products with current quantities
2. **Low Stock Report** - Products below minimum level
3. **Stock Movement History** - Complete audit trail
4. **Stock Valuation** - Total inventory value
5. **Warehouse-wise Stock** - Stock by location
6. **Fast/Slow Moving** - Product movement analysis

---

*Documentation Version: 1.0.0*
*Last Updated: March 16, 2026*
