# Kaosar ERP - Menu Navigation Documentation

## 📑 Complete Menu Structure

This documentation covers all menu items and their corresponding pages in the Kaosar ERP system.

---

## 1️⃣ Dashboard

### Menu Item: Dashboard
**Route**: `/dashboard`
**Permission**: All authenticated users

### Pages:
- **Main Dashboard** (`/dashboard`)
  - Business overview cards
  - Total orders, pending orders
  - Revenue statistics
  - Active customers
  - Low stock alerts
  - Active staff count
  - Monthly sales chart
  - Staff performance chart

### Features:
- Real-time statistics
- Interactive charts
- Quick access to important metrics
- Responsive design

### Documentation: [dashboard.md](dashboard.md)

---

## 2️⃣ My Gallery

### Menu Item: My Gallery
**Route**: `/gallery`
**Permission**: All authenticated users

### Pages:
- **My Gallery** (`/gallery`)
  - Uploaded images
  - Documents
  - User-uploaded files

### Features:
- Image preview
- File management
- Upload history
- Storage usage display

---

## 3️⃣ Products

### Menu Item: Products
**Route**: `/products`
**Permission**: Admin, Manager, Staff

### Submenus:

#### 3.1 Product List
**Route**: `/products`
**Page**: Product List
**Features**:
- View all products
- Search and filter
- Category-wise filter
- Stock status indicators
- Low stock alerts
- Quick actions (Edit, Delete)

#### 3.2 Add Product
**Route**: `/products/add`
**Page**: Create Product
**Features**:
- Product基本信息录入
- SKU generation
- Price management
- Specification input
- Category selection
- Unit selection
- Warehouse assignment
- Initial stock quantity
- Minimum stock level
- Image upload
- Barcode scanning

#### 3.3 Edit Product
**Route**: `/products/:id/edit`
**Page**: Edit Product
**Features**:
- Update product details
- Adjust stock levels
- Change category/unit
- Update specifications
- Modify pricing
- Upload new images

#### 3.4 Product Categories
**Route**: `/products/categories`
**Page**: Product Categories
**Features**:
- Category CRUD
- Category hierarchy
- Category-wise product count
- Parent-child relationships

#### 3.5 Units
**Route**: `/products/units`
**Page**: Measurement Units
**Features**:
- Unit management (PCS, KG, LTR, MTR, etc.)
- Unit symbols
- Add custom units

#### 3.6 Warehouses
**Route**: `/products/warehouses`
**Page**: Warehouses
**Features**:
- Warehouse locations
- Capacity management
- Active/inactive status
- Warehouse-wise stock

### Documentation: [products.md](products.md)

---

## 4️⃣ Customers

### Menu Item: Customers
**Route**: `/customers`
**Permission**: Admin, Manager, Staff

### Submenus:

#### 4.1 Customer List
**Route**: `/customers`
**Page**: Customer List
**Features**:
- View all customers
- Search by name, company, email
- Filter by status (Active/Inactive)
- Customer type display
- Contact information
- Outstanding balance

**Customer Display Format**:
```
Acme Corporation          ← Company Name (small, muted gray)
John Doe                  ← Customer Name (bold, normal)
```

#### 4.2 Add Customer
**Route**: `/customers/add`
**Page**: Create Customer
**Features**:
- Customer基本信息
- Company name
- Contact person name
- Email and phone
- Billing address
- Shipping address
- Tax ID / GSTIN
- Credit limit
- Payment terms
- Active status

#### 4.3 Edit Customer
**Route**: `/customers/:id/edit`
**Page**: Edit Customer
**Features**:
- Update customer information
- Add multiple addresses
- View order history
- View payment history
- View outstanding balance

#### 4.4 Customer Details
**Route**: `/customers/:id`
**Page**: Customer Profile
**Features**:
- Complete customer profile
- Order history (all orders)
- Invoice history
- Payment history
- Outstanding invoices
- Contact information
- Multiple addresses
- Transaction summary

---

## 5️⃣ Suppliers

### Menu Item: Suppliers
**Route**: `/suppliers`
**Permission**: Admin, Manager

### Submenus:

#### 5.1 Supplier List
**Route**: `/suppliers`
**Page**: Supplier List
**Features**:
- View all suppliers
- Search by name, company
- Filter by status
- Contact information
- Supplier rating

#### 5.2 Add Supplier
**Route**: `/suppliers/add`
**Page**: Create Supplier
**Features**:
- Supplier基本信息
- Company name
- Contact person name
- Email and phone
- Address
- Tax ID / GSTIN
- Bank details
- Payment terms
- Rating system

#### 5.3 Edit Supplier
**Route**: `/suppliers/:id/edit`
**Page**: Edit Supplier
**Features**:
- Update supplier information
- Add multiple contacts
- View purchase history
- View payment history
- Update rating

#### 5.4 Supplier Details
**Route**: `/suppliers/:id`
**Page**: Supplier Profile
**Features**:
- Complete supplier profile
- Purchase order history
- Goods received history
- Payment history
- Outstanding balance
- Contact information
- Performance metrics

---

## 6️⃣ Staffs

### Menu Item: Staffs
**Route**: `/staffs`
**Permission**: Admin, Manager

### Submenus:

#### 6.1 Staff List
**Route**: `/staffs`
**Page**: Staff List
**Features**:
- View all staff members
- Search by name, email
- Filter by department
- Filter by status (Active/Inactive)
- Staff type display
- Contact information
- Joining date

#### 6.2 Add Staff
**Route**: `/staffs/add`
**Page**: Create Staff
**Features**:
- Staff基本信息
- Full name
- Email and phone
- Department assignment
- Designation/Role
- Joining date
- Probation period
- Salary details
- Bank account information
- Emergency contact
- Address
- Profile photo

#### 6.3 Edit Staff
**Route**: `/staffs/:id/edit`
**Page**: Edit Staff
**Features**:
- Update staff information
- Change department/role
- Update salary details
- Change status
- Add documents

#### 6.4 Staff Details
**Route**: `/staffs/:id`
**Page**: Staff Profile
**Features**:
- Complete staff profile
- Attendance history
- Sales performance
- Commission earned
- Payroll history
- Leave records
- Department information

---

## 7️⃣ Purchase

### Menu Item: Purchase
**Route**: `/purchase`
**Permission**: Admin, Manager, Purchase Staff

### Submenus:

#### 7.1 Purchase Orders
**Route**: `/purchase/orders`
**Page**: Purchase Orders List
**Features**:
- View all purchase orders
- Filter by status (Pending, Approved, Received, Cancelled)
- Filter by supplier
- Search by order number
- Order summary cards
- Bulk actions

**Status Flow**:
```
Pending → Approved → Received → Completed
         ↘ Cancelled
```

#### 7.2 Add Purchase Order
**Route**: `/purchase/orders/add`
**Page**: Create Purchase Order
**Features**:
- Supplier selection
- Order date
- Expected delivery date
- Multiple products
- Quantity and price
- Tax calculation
- Discount management
- Terms and conditions
- Notes and remarks

**Stock Impact**: Creates stock movement (type: "purchase") when received

#### 7.3 Edit Purchase Order
**Route**: `/purchase/orders/:id/edit`
**Page**: Edit Purchase Order
**Features**:
- Update order details
- Add/remove products
- Modify quantities and prices
- Update delivery date
- Add notes
- **Only editable for Pending/Approved status**

#### 7.4 Purchase Order Details
**Route**: `/purchase/orders/:id`
**Page**: Purchase Order Details
**Features**:
- Complete order information
- Line items with products
- Supplier details
- Approval workflow
- Goods receipt notes
- Invoice linking
- Payment tracking
- Print purchase order

---

## 8️⃣ Purchase Return

### Menu Item: Purchase Return
**Route**: `/purchase/returns`
**Permission**: Admin, Manager, Purchase Staff

### Submenus:

#### 8.1 Purchase Returns
**Route**: `/purchase/returns`
**Page**: Purchase Returns List
**Features**:
- View all purchase returns
- Filter by status (Pending, Approved, Completed)
- Filter by supplier
- Return reasons
- Summary cards

**Return Flow**:
```
Pending → Approved → Completed
         ↘ Rejected
```

#### 8.2 Create Purchase Return
**Route**: `/purchase/returns/add`
**Page**: Create Purchase Return
**Features**:
- Select purchase invoice
- Select products to return
- Return quantity
- Return reason (Defective, Wrong Item, Damaged, etc.)
- Credit note generation
- Remarks

**Stock Impact**: Deducts stock (movement type: "return")

#### 8.3 Purchase Return Details
**Route**: `/purchase/returns/:id`
**Page**: Return Details
**Features**:
- Complete return information
- Line items
- Original purchase details
- Approval status
- Credit note details
- Refund tracking

---

## 9️⃣ Sales & Orders

### Menu Item: Sales & Orders
**Route**: `/sales/orders`
**Permission**: Admin, Manager, Sales Staff

### Submenus:

#### 9.1 All Orders
**Route**: `/sales/orders`
**Page**: All Sales Orders
**Features**:
- View all orders
- Filter by status
- Filter by customer
- Filter by date range
- Search by order number
- Order summary cards
- Bulk actions

**Status Tabs**:
- All Orders
- Pending (9)
- Confirmed
- In-transit
- Delivered
- Cancelled

**Customer Display**:
```
Acme Corporation
John Doe
```

#### 9.2 Add Sales Order
**Route**: `/sales/orders/add`
**Page**: Create Sales Order
**Features**:
- Customer selection
- Order date
- Due date
- Delivery date
- Shipping address
- Staff assignment
- Multiple products
- Quantity, price, discount, tax
- Automatic calculations
- Notes and remarks
- Order submission

**Stock Impact**: Deducts stock (movement type: "sale")

#### 9.3 Edit Sales Order ⭐ ENHANCED
**Route**: `/sales/orders/:id/edit`
**Page**: Edit Sales Order
**Features**:
- **Customer field: Read-only** ✅
- **Browse Products modal** - Search and add products
- **Product display with full details**:
  - SKU
  - Product Name
  - Specification (read-only)
  - Unit
  - Stock Quantity
  - Price
  - Quantity
  - Discount
  - Pre-tax Amount
  - Tax %
  - Tax Amount
  - Line Total
  - Remark
  - Actions (Edit, Delete)

**Actions**:
- ✅ **Edit Item** - Opens modal with single-item API
  - Edit quantity, price, discount, tax, remark
  - Stock automatically adjusted based on quantity change
  - Real-time calculation
- ✅ **Delete Item** - Deletes with stock restoration
  - Removes item from database
  - Fully restores stock
  - Creates audit trail
- ✅ **Add Row** - Opens product selection modal

**Stock Impact**:
- **Increase quantity**: Stock decreases (movement type: "sale")
- **Decrease quantity**: Stock increases (movement type: "return")
- **Delete item**: Stock fully restored (movement type: "return")

**APIs Used**:
- `POST /api/sales/orders/:orderId/items` - Add item
- `PUT /api/sales/orders/:orderId/items/:itemId` - Update item
- `DELETE /api/sales/orders/:orderId/items/:itemId` - Delete item

#### 9.4 Order Details
**Route**: `/sales/orders/:id`
**Page**: Order Details
**Features**:
- Complete order information
- Customer details (Company + Name)
- Line items with full details
- Order status workflow
- Invoice generation
- Payment tracking
- Delivery information
- Print order

#### 9.5 Confirmed Orders
**Route**: `/sales/orders/confirmed`
**Page**: Confirmed Orders List
**Features**:
- All confirmed orders
- Ready for delivery
- Filter by route
- Filter by staff
- Customer display format

#### 9.6 Delivered Orders
**Route**: `/sales/orders/delivered`
**Page**: Delivered Orders List
**Features**:
- Successfully delivered orders
- Delivery date
- Delivery confirmation
- Customer feedback

#### 9.7 In-transit Orders
**Route**: `/sales/orders/in-transit`
**Page**: In-transit Orders List
**Features**:
- Orders out for delivery
- Current location tracking
- Staff assigned
- Estimated delivery time

#### 9.8 Returned Orders
**Route**: `/sales/orders/returned`
**Page**: Returned Orders List
**Features**:
- Orders with returns
- Return reason
- Restocked items

### Documentation: [sales.md](sales.md)

---

## 🔟 Sales Return

### Menu Item: Sales Return
**Route**: `/sales/returns`
**Permission**: Admin, Manager, Sales Staff

### Submenus:

#### 10.1 All Returns
**Route**: `/sales/returns`
**Page**: All Sales Returns
**Features**:
- View all returns
- Filter by status (Pending, Approved, Rejected, Completed)
- Filter by customer
- Search by return number
- Summary cards

**Customer Display**:
```
Acme Corporation
John Doe
```

#### 10.2 Pending Returns
**Route**: `/sales/returns/pending`
**Page**: Pending Returns
**Features**:
- Returns awaiting approval
- Quick approve/reject
- Return reason review

#### 10.3 Approved Returns
**Route**: `/sales/returns/approved`
**Page**: Approved Returns
**Features**:
- Approved returns
- Ready for processing
- Refund status

#### 10.4 Create Sales Return
**Route**: `/sales/returns/add`
**Page**: Create Sales Return
**Features**:
- Select invoice or order
- Select products to return
- Return quantity
- Return reason
- Restock option
- Credit note generation

**Stock Impact**: Increases stock (movement type: "return")

#### 10.5 Return Details
**Route**: `/sales/returns/:id`
**Page**: Return Details
**Features**:
- Complete return information
- Line items
- Original invoice details
- Approval workflow
- Credit note details
- Refund tracking
- Print return invoice

#### 10.6 Return Payments
**Route**: `/sales/returns/payments`
**Page**: Return Payments
**Features**:
- All return refunds
- Payment status
- Payment method
- Refund date

**Customer Display**:
```
Acme Corporation
John Doe
```

---

## 1️⃣1️⃣ Invoices

### Menu Item: Invoices
**Route**: `/sales/invoices`
**Permission**: Admin, Manager, Sales Staff, Accountant

### Submenus:

#### 11.1 All Invoices
**Route**: `/sales/invoices`
**Page**: All Sales Invoices
**Features**:
- View all invoices
- Filter by status (Draft, Sent, Paid, Overdue)
- Filter by customer
- Search by invoice number
- Summary cards

**Customer Display**:
```
Acme Corporation
John Doe
```

#### 11.2 Create Invoice
**Route**: `/sales/invoices/add`
**Page**: Create Invoice
**Features**:
- Select order to invoice
- Edit line items
- Add/remove products
- Adjust quantities
- Tax calculation
- Invoice terms
- Generate invoice number

#### 11.3 Invoice Details
**Route**: `/sales/invoices/:id`
**Page**: Invoice Details
**Features**:
- Complete invoice information
- Line items
- Customer details
- Payment tracking
- Print invoice
- Email invoice
- Generate e-invoice

#### 11.4 E-Invoices
**Route**: `/sales/invoices/e-invoices`
**Page**: E-Invoice List
**Features**:
- All generated e-invoices
- Filter by status
- Submission tracking
- Tax authority responses

**Customer Display**:
```
Acme Corporation
John Doe
```

#### 11.5 Invoice Payments
**Route**: `/sales/invoices/payments`
**Page**: Invoice Payments
**Features**:
- All invoice payments
- Payment method
- Payment date
- Outstanding balance

---

## 1️⃣2️⃣ Payments

### Menu Item: Payments
**Route**: `/sales/payments`
**Permission**: Admin, Manager, Accountant

### Submenus:

#### 12.1 All Payments
**Route**: `/sales/payments`
**Page**: All Sales Payments
**Features**:
- View all payments
- Filter by customer
- Filter by date range
- Payment method breakdown
- Payment status

**Customer Display**:
```
Acme Corporation
John Doe
```

#### 12.2 Record Payment
**Route**: `/sales/payments/record`
**Page:** Record Payment
**Features**:
- Select invoice
- Payment amount
- Payment method (Cash, Bank Transfer, Card, etc.)
- Payment date
- Reference number
- Notes

#### 12.3 Payment Details
**Route**: `/sales/payments/:id`
**Page**: Payment Details
**Features**:
- Complete payment information
- Invoice details
- Customer information
- Payment receipt
- Print receipt

---

## 1️⃣3️⃣ Delivery

### Menu Item: Delivery
**Route**: `/sales/delivery`
**Permission**: Admin, Manager, Delivery Staff

### Submenus:

#### 13.1 Delivery Dashboard
**Route**: `/sales/delivery`
**Page**: Delivery Management
**Features**:
- All orders for delivery
- Filter by status
- Route-wise grouping
- Staff-wise grouping
- Delivery date
- Priority orders

**Customer Display**:
```
Acme Corporation
John Doe
```

#### 13.2 Update Delivery Status
**Route**: `/sales/delivery/update/:id`
**Page**: Update Status
**Features**:
- Confirm order
- Mark as picked up
- Mark as in-transit
- Mark as delivered
- Add delivery notes
- Add proof of delivery

#### 13.3 Delivery Routes
**Route**: `/sales/routes`
**Page**: Delivery Routes
**Features**:
- Route list
- Create route
- Assign orders to route
- Assign staff to route
- Route date
- Route status

---

## 1️⃣4️⃣ Route Operations

### Menu Item: Route Operations
**Route**: `/sales/routes`
**Permission**: Admin, Manager, Logistics Manager

### Submenus:

#### 14.1 Manage Routes
**Route**: `/sales/routes`
**Page**: Route Management
**Features**:
- View all routes
- Create new route
- Edit route
- Delete route
- Route status
- Route assignments

#### 14.2 Assign Orders to Route
**Route**: `/sales/routes/:id/assign`
**Page**: Route Assignment
**Features**:
- Select orders for route
- Sequence optimization
- Staff assignment
- Route date planning
- Generate route sheet

#### 14.3 Route Details
**Route**: `/sales/routes/:id`
**Page**: Route Details
**Features**:
- Complete route information
- Assigned orders
- Sequence order
- Staff assigned
- Map integration (future)
- Route optimization

---

## 1️⃣5️⃣ Accounting

### Menu Item: Accounting
**Route**: `/accounting`
**Permission**: Admin, Accountant

### Submenus:

#### 15.1 Dashboard
**Route**: `/accounting/dashboard`
**Page**: Accounting Dashboard
**Features**:
- Financial summary cards
- Total revenue
- Total expenses
- Outstanding receivables
- Outstanding payables
- Cash balance
- Bank balance

#### 15.2 Transactions
**Route**: `/accounting/transactions`
**Page**: All Transactions
**Features**:
- View all transactions
- Filter by type (Sales, Purchase, Receipt, Payment, Journal)
- Filter by date range
- Filter by account
- Search by reference number
- Transaction list

#### 15.3 Journal Entries
**Route**: `/accounting/journals`
**Page**: Journal Entries
**Features**:
- View all journal entries
- Create manual journal
- Edit journal
- Delete journal
- Journal vouchers
- Double-entry bookkeeping

#### 15.4 Ledger
**Route**: `/accounting/ledger`
**Page**: Account Ledger
**Features**:
- Select account
- View account transactions
- Opening balance
- Closing balance
- Debit/Credit breakdown
- Date-wise transactions

#### 15.5 Trial Balance
**Route**: `/accounting/reports/trial-balance`
**Page**: Trial Balance
**Features**:
- Generate trial balance
- As of date
- Debit totals
- Credit totals
- Balance checking

#### 15.6 Trading Account
**Route**: `/accounting/reports/trading`
**Page**: Trading Account
**Features**:
- Generate trading account
- Direct expenses
- Gross profit calculation
- Manufacturing account

#### 15.7 Profit & Loss
**Route**: `/accounting/reports/pl-statement`
**Page**: Profit & Loss Statement
**Features**:
- Generate P&L statement
- Date range
- Revenue
- Direct expenses
- Indirect expenses
- Net profit/loss

#### 15.8 Balance Sheet
**Route**: `/accounting/reports/balance-sheet`
**Page**: Balance Sheet
**Features**:
- Generate balance sheet
- As of date
- Assets
- Liabilities
- Equity
- Financial position

#### 15.9 Cash Flow
**Route**: `/accounting/reports/cash-flow`
**Page**: Cash Flow Statement
**Features**:
- Generate cash flow
- Cash from operations
- Cash from investing
- Cash from financing
- Net cash flow

---

## 1️⃣6️⃣ HR & Payroll

### Menu Item: HR & Payroll
**Route**: `/hr`
**Permission**: Admin, HR Manager

### Submenus:

#### 16.1 Staff Management
**Route**: `/hr/staff`
**Page**: Staff List
**Features**:
- View all staff
- Add staff
- Edit staff
- Staff details
- Department-wise list
- Status-wise list

#### 16.2 Attendance
**Route**: `/hr/attendance`
**Page**: Attendance Management
**Features**:
- View attendance
- Mark attendance
- Check-in/Check-out
- Manual attendance
- Attendance reports
- Late arrival tracking
- Early departure tracking

#### 16.3 Attendance Reports
**Route**: `/hr/attendance/reports`
**Page**: Attendance Reports
**Features**:
- Daily attendance
- Monthly register
- Date range reports
- Staff-wise reports
- Summary reports

#### 16.4 Payroll
**Route**: `/hr/payroll`
**Page**: Payroll Management
**Features**:
- View payroll
- Generate payroll for month
- Salary calculation
- Deductions (PF, ESI, PT, TDS)
- Allowances (HRA, DA, TA)
- Pay slip generation
- Salary payment
- Payroll reports

#### 16.5 Salary Structure
**Route**: `/hr/salary-structure`
**Page**: Salary Structure
**Features**:
- Define salary components
- Basic, HRA, DA, TA
- Deduction rules
- Tax rules
- Grade-wise structure

#### 16.6 Departments
**Route**: `/hr/departments`
**Page**: Departments
**Features**:
- View departments
- Add department
- Edit department
- Department hierarchy
- Staff count

---

## 1️⃣7️⃣ Users

### Menu Item: Users
**Route**: `/users`
**Permission**: Admin only

### Submenus:

#### 17.1 User List
**Route**: `/users`
**Page**: System Users
**Features**:
- View all users
- Add user
- Edit user
- Delete user
- Assign roles
- Status management
- Last login tracking

#### 17.2 User Roles
**Route**: `/users/roles`
**Page**: User Roles
**Features**:
- View all roles
- Create role
- Edit role
- Delete role
- Assign permissions
- Role hierarchy

**Available Roles**:
- Super Admin
- Admin
- Manager
- Staff
- Accountant

---

## 1️⃣8️⃣ Roles & Permissions

### Menu Item: Roles & Permissions
**Route**: `/roles`
**Permission**: Admin only

### Submenus:

#### 18.1 Role List
**Route**: `/roles`
**Page**: Roles List
**Features**:
- View all roles
- Create role
- Edit role
- Delete role
- Role permissions

#### 18.2 Module Permissions
**Route**: `/roles/permissions`
**Page**: Module Permissions
**Features**:
- Permission matrix
- Module-wise permissions
- Action permissions (Create, Read, Update, Delete)
- Role-based access control

#### 18.3 Menu Access
**Route**: `/roles/menu`
**Page**: Menu Access Control
**Features**:
- Show/hide menu items
- Role-based menu visibility
- Menu customization

---

## 1️⃣9️⃣ Reports

### Menu Item: Reports
**Route**: `/reports`
**Permission**: Admin, Manager, Accountant

### Submenus:

#### 19.1 Sales Reports
**Route**: `/reports/sales`
**Page**: Sales Reports
**Features**:
- Sales by date range
- Sales by product
- Sales by customer
- Sales by staff
- Sales by route
- Sales returns report
- Outstanding invoices

#### 19.2 Purchase Reports
**Route**: `/reports/purchase`
**Page**: Purchase Reports
**Features**:
- Purchase by date range
- Purchase by supplier
- Purchase returns
- GRN reports

#### 19.3 Customer Reports
**Route**: `/reports/customer-wise`
**Page**: Customer-wise Reports
**Features**:
- Customer sales summary
- Customer outstanding
- Customer payment history
- Customer profitability
- Customer aging report

**Customer Display**:
```
Acme Corporation
John Doe
```

#### 19.4 Stock Reports
**Route**: `/reports/stock`
**Page**: Stock Reports
**Features**:
- Current stock
- Stock movement history
- Low stock report
- Stock valuation
- Warehouse-wise stock
- Fast/Slow moving items

#### 19.5 Staff Reports
**Route**: `/reports/staff`
**Page**: Staff Performance
**Features**:
- Staff sales performance
- Staff-wise commission
- Staff attendance reports
- Target vs actual

#### 19.6 Financial Reports
**Route**: `/reports/financial`
**Page**: Financial Reports
**Features**:
- Trial balance
- Trading account
- Profit & loss
- Balance sheet
- Cash flow statement
- Ledger reports

---

## 2️⃣0️⃣ Production

### Menu Item: Production
**Route**: `/production`
**Permission**: Admin, Production Manager

### Submenus:

#### 20.1 Bill of Materials
**Route**: `/production/bom`
**Page**: BOM Management
**Features**:
- View BOMs
- Create BOM
- Edit BOM
- BOM versions
- Component list
- Cost calculation

#### 20.2 Production Orders
**Route**: `/production/orders`
**Page**: Production Orders
**Features**:
- Create production order
- View all orders
- Update status
- Material consumption
- Production output
- Cost tracking

#### 20.3 Raw Materials
**Route**: `/production/raw-materials`
**Page**: Raw Materials
**Features**:
- Raw material inventory
- Material procurement
- Material allocation
- Consumption tracking
- Replenishment alerts

---

## 2️⃣1️⃣ Settings

### Menu Item: Settings
**Route**: `/settings`
**Permission**: Admin only

### Submenus:

#### 21.1 Company Settings
**Route**: `/settings/company`
**Page**: Company Information
**Features**:
- Company name
- Logo upload
- Address
- Contact details
- Tax information
- Bank details

#### 21.2 Numbering Series
**Route**: `/settings/numbering`
**Page**: Numbering Configuration
**Features**:
- Order numbering
- Invoice numbering
- Purchase order numbering
- Receipt numbering
- Prefix and suffix
- Number format

#### 21.3 Financial Year
**Route**: `/settings/financial-year`
**Page**: Financial Year Settings
**Features**:
- Define financial year
- Start date
- End date
- Auto-close year

#### 21.4 Preferences
**Route**: `/settings/preferences`
**Page**: System Preferences
**Features**:
- Default currency
- Tax rates
- Email settings (SMTP)
- Backup settings
- System configuration

---

## 2️⃣2️⃣ Database

### Menu Item: Database
**Route**: `/database`
**Permission**: Admin only

### Submenus:

#### 22.1 Backup
**Route**: `/database/backup`
**Page**: Database Backup
**Features**:
- Create backup
- Download backup
- Schedule backups
- Backup history

#### 22.2 Restore
**Route**: `/database/restore`
**Page**: Database Restore
**Features**:
- Upload backup file
- Restore database
- Validate backup
- Restore history

#### 22.3 Export
**Route**: `/database/export`
**Page**: Data Export
**Features**:
- Export tables
- Select date range
- Export format (CSV, Excel, JSON)
- Export history

---

## 2️⃣3️⃣ Modules

### Menu Item: Modules
**Route**: `/modules`
**Permission**: Super Admin only

### Submenus:

#### 23.1 Module Manager
**Route**: `/modules/manager`
**Page**: Module Management
**Features**:
- View all modules
- Enable/disable modules
- Module configuration
- Module status
- Module dependencies

#### 23.2 Module Configuration
**Route**: `/modules/configure`
**Page**: Configure Modules
**Features**:
- Module settings
- Integration settings
- API endpoints
- Webhooks

---

## 2️⃣4️⃣ Help

### Menu Item: Help
**Route**: `/help`
**Permission**: All authenticated users

### Submenus:

#### 24.1 Documentation
**Route**: `/help/docs`
**Page**: User Documentation
**Features**:
- User guides
- Video tutorials
- FAQ
- Getting started

#### 24.2 Support
**Route**: `/help/support`
**Page**: Support Center
**Features**:
- Contact support
- Submit ticket
- Track ticket status
- Knowledge base

#### 24.3 About
**Route**: `/help/about`
**Page**: About System
**Features**:
- System information
- Version details
- License information
- Credits

---

## 🎨 Common UI Components

### Customer Display Format
Used across all sales-related pages (14 pages):

```
Acme Corporation          ← Company Name (small, muted gray text)
John Doe                  ← Customer Name (bold, normal text)
```

**Pages Using This Format**:
- Sales Orders (All, Pending, Confirmed, Delivered, In-transit, Returned)
- Sales Invoices (All, E-Invoices)
- Sales Payments
- Delivery
- Sales Returns (All, Approved, Pending, Payments)

---

## 📊 Page Structure

### Standard List Page Components:
1. **Page Header**
   - Breadcrumb navigation
   - Page title
   - Action buttons (Add, Export, etc.)

2. **Summary Cards**
   - Key metrics
   - Quick stats
   - Status breakdown

3. **Filters Section**
   - Search box
   - Status filters
   - Date range picker
   - Dropdown filters

4. **Data Table**
   - Sortable columns
   - Pagination
   - Row actions
   - Bulk actions

5. **Action Buttons**
   - Add new
   - Export
   - Print
   - Filter

### Standard Form Page Components:
1. **Page Header**
   - Breadcrumb
   - Page title
   - Back button

2. **Form Sections**
   - Grouped fields
   - Field labels
   - Required indicators
   - Help text

3. **Form Actions**
   - Save button
   - Save & Continue
   - Cancel
   - Reset

---

## 🔐 Permission Matrix

| Menu Item | Admin | Manager | Staff | Accountant |
|-----------|-------|--------|-------|------------|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Products | ✅ | ✅ | ✅ | ❌ |
| Customers | ✅ | ✅ | ✅ | ❌ |
| Suppliers | ✅ | ✅ | ❌ | ❌ |
| Staffs | ✅ | ✅ | ❌ | ❌ |
| Purchase | ✅ | ✅ | ❌ | ❌ |
| Purchase Return | ✅ | ✅ | ❌ | ❌ |
| Sales & Orders | ✅ | ✅ | ✅ | ❌ |
| Sales Return | ✅ | ✅ | ✅ | ❌ |
| Invoices | ✅ | ✅ | ✅ | ✅ |
| Payments | ✅ | ✅ | ✅ | ✅ |
| Delivery | ✅ | ✅ | ✅ | ❌ |
| Routes | ✅ | ✅ | ❌ | ❌ |
| Accounting | ✅ | ✅ | ❌ | ✅ |
| Reports | ✅ | ✅ | ✅ | ✅ |
| HR & Payroll | ✅ | ✅ | ❌ | ❌ |
| Users | ✅ | ❌ | ❌ | ❌ |
| Roles | ✅ | ❌ | ❌ | ❌ |
| Production | ✅ | ✅ | ❌ | ❌ |
| Settings | ✅ | ❌ | ❌ | ❌ |
| Database | ✅ | ❌ | ❌ | ❌ |
| Modules | ✅ | ❌ | ❌ | ❌ |

---

## 📱 Responsive Design

All pages are responsive and work on:
- ✅ Desktop (1920px+)
- ✅ Laptop (1024px+)
- ✅ Tablet (768px+)
- ✅ Mobile (320px+)

---

*Menu Documentation Version: 1.0.0*
*Last Updated: March 16, 2026*
