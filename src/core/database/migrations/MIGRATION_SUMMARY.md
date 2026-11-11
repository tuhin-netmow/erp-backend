# Database Migration Summary

## Overview
This document summarizes the newly created migration files that have been properly structured following Sequelize migration standards. All migrations are now located in `src/core/database/migrations/` directory.

## Newly Created Migration Files

### 1. **20260611000001-create-notifications-table.js**
- **Purpose**: Creates the `notifications` table for managing user notifications
- **Features**: 
  - Supports different notification types (order, stock, payment, customer, system, return, delivery)
  - Priority levels (low, medium, high, urgent)
  - User-specific or global notifications
  - Reference tracking for related entities
- **Indexes**: user_id, is_read, type, created_at, priority

### 2. **20260611000002-create-staff-checkins-table.js**
- **Purpose**: Creates the `staff_checkins` table for tracking staff customer visits
- **Features**:
  - GPS location tracking (latitude, longitude)
  - Distance calculation from customer location
  - Check-in timestamps and notes
- **Indexes**: customer_id, staff_id, check_in_time, composite staff_id+check_in_time

### 3. **20260611000003-create-product-images-table.js**
- **Purpose**: Creates the `product_images` table for product image galleries
- **Features**:
  - Multiple images per product
  - Primary image designation
  - Sort order for display
  - Image captions
- **Indexes**: product_id, is_primary, sort_order

### 4. **20260611000004-create-customer-images-table.js**
- **Purpose**: Creates the `customer_images` table for customer image galleries
- **Features**: Similar to product_images but for customers
- **Indexes**: customer_id, is_primary, sort_order

### 5. **20260611000005-update-products-table-add-new-fields.js**
- **Purpose**: Adds enhanced fields to the `products` table
- **New Fields**:
  - `specification` - Detailed product specifications
  - `product_type` - ENUM: standard, raw_material, finished_good, service
  - `purchase_tax` and `sales_tax` - Tax percentages
  - `initial_stock` - Initial stock quantity
  - `weight`, `length`, `width`, `height` - Physical dimensions
  - `expiry_date` - Product expiry tracking
  - `created_by` - User who created the product
- **Updates**: Changed stock fields to DECIMAL(10,2) for decimal support

### 6. **20260611000006-update-customers-table-add-missing-fields.js**
- **Purpose**: Adds missing fields to the `customers` table
- **New Fields**:
  - `image_url` - Customer profile image
  - `sales_route_id` - Sales route assignment
  - `created_by` - User who created the customer
- **Updates**: Makes `company` field NOT NULL (if no existing NULL values)
- **Indexes**: sales_route_id, created_by

### 7. **20260611000007-update-users-table-auth-fields.js**
- **Purpose**: Consolidates authentication and staff fields into `users` table
- **Authentication Fields**:
  - `password` - Hashed password for authentication
  - `role_id` - Role assignment for permissions
- **Staff/Employee Fields**:
  - `first_name`, `last_name` - Name fields
  - `phone`, `thumb_url` - Contact info
  - `position`, `department_id`, `hire_date` - Employment info
  - `salary` - Employee salary
  - `address`, `city`, `state`, `country`, `postal_code` - Location info
  - `status` - Employee status (active, inactive, terminated, on_leave)
  - `notes`, `gallery_items` - Additional information
- **Indexes**: role_id, department_id, status, email (unique)

### 8. **20260611000008-update-sales-routes-table-add-map-columns.js**
- **Purpose**: Adds geographical map columns to `sales_routes` table
- **New Fields**:
  - `zoom_level` - Map zoom level
  - `country`, `state`, `city`, `postal_code` - Location info
  - `center_lat`, `center_lng` - Map center coordinates
  - `coverage_radius` - Route coverage radius
- **Indexes**: center_lat, center_lng for geographical queries

### 9. **20260611000009-create-purchase-invoices-payments-receipts-tables.js**
- **Purpose**: Creates comprehensive purchase management tables
- **Tables Created**:
  1. `purchase_invoices` - Invoice tracking
  2. `purchase_payments` - Payment tracking
  3. `purchase_receipts` - Goods receipt tracking
- **Features**:
  - Full foreign key relationships
  - Status tracking (draft, received, paid, overdue, cancelled)
  - Payment method tracking
  - Receipt status management

## Migration Structure

All migrations follow the standard Sequelize format:

```javascript
module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Migration logic here
    },
    down: async (queryInterface, Sequelize) => {
        // Rollback logic here
    }
};
```

## Running Migrations

To run these migrations, use the existing migration runner:

```bash
node migrations/migrate.js
```

Or use Sequelize CLI:

```bash
npx sequelize-cli db:migrate
```

## Notes

1. **Backward Compatibility**: All migrations include proper `down` functions for rollback capability
2. **Error Handling**: Migrations check for existing columns/tables before creating them
3. **Indexes**: Proper indexes are added for query performance optimization
4. **Foreign Keys**: All relationships are properly defined with CASCADE/SET NULL rules
5. **Data Types**: Appropriate data types are used (DECIMAL for financial/metric data, ENUM for status fields)

## Root Migrations Directory

The root `migrations/` directory contains ad-hoc scripts that have been consolidated into proper migrations:
- `20260109-add-auth-to-staffs.js` → Integrated into `20260611000007-update-users-table-auth-fields.js`
- `run_add_initial_stock.js` → Integrated into `20260611000005-update-products-table-add-new-fields.js`
- `run_update_sales_routes.js` → Integrated into `20260611000008-update-sales-routes-table-add-map-columns.js`
- `run_add_purchase_columns.js` → Covered by existing timestamped migrations
- `run_create_purchase_tables.js` → Integrated into `20260611000009-create-purchase-invoices-payments-receipts-tables.js`

## Recommendation

After running these migrations, you can safely remove or archive the root `migrations/` directory scripts as they have been consolidated into the proper migration structure.