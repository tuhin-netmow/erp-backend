// This file sets up associations that might cause circular dependencies
// It should be loaded after all models are defined

const { Payment, Order, Invoice, Delivery, SalesRoute, SalesRouteStaff } = require('../../modules/sales/sales.models');
const { PurchaseOrder, PurchaseInvoice, PurchasePayment, PurchaseReceipt } = require('../../modules/purchase/purchase.models');
const { PurchaseReturn, PurchaseReturnItem, PurchaseReturnInvoice, PurchaseReturnPayment } = require('../../modules/purchase/purchase-return.models');
const { SalesReturn, SalesReturnItem, SalesReturnInvoice, SalesReturnPayment } = require('../../modules/sales/sales-return.models');
const { User } = require('../../modules/users/user.model');
const { Customer } = require('../../modules/customers/customers.model');
const { Staff } = require('../../modules/staffs/staffs.model');
const { Supplier } = require('../../modules/suppliers/suppliers.model');
const { Product } = require('../../modules/products/products.model');

// Set up User associations for created_by fields (Sales)
Payment.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Order.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Invoice.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Delivery.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Set up User associations for created_by fields (Purchase)
PurchaseOrder.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
PurchaseInvoice.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
PurchasePayment.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
PurchaseReceipt.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Set up User associations for created_by fields (Purchase Return)
PurchaseReturn.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
PurchaseReturnInvoice.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
PurchaseReturnPayment.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Set up User associations for created_by fields (Sales Return)
SalesReturn.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
SalesReturnInvoice.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
SalesReturnPayment.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Set up User associations for created_by fields (Production)
const { ProductionRun } = require('../../modules/production/production.models');
ProductionRun.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Set up Purchase Return associations
PurchaseReturn.belongsTo(PurchaseOrder, { foreignKey: 'purchase_order_id', as: 'purchase_order' });
PurchaseOrder.hasMany(PurchaseReturn, { foreignKey: 'purchase_order_id', as: 'returns' });

PurchaseReturn.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
Supplier.hasMany(PurchaseReturn, { foreignKey: 'supplier_id', as: 'purchase_returns' });

PurchaseReturnItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Set up Sales Return associations
SalesReturn.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
Order.hasMany(SalesReturn, { foreignKey: 'order_id', as: 'returns' });

SalesReturn.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Customer.hasMany(SalesReturn, { foreignKey: 'customer_id', as: 'sales_returns' });

SalesReturnItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Set up Customer to SalesRoute association
Customer.belongsTo(SalesRoute, { foreignKey: 'sales_route_id', as: 'salesRoute' });
SalesRoute.hasMany(Customer, { foreignKey: 'sales_route_id', as: 'customers' });

// Set up Customer to Orders association
Customer.hasMany(Order, { foreignKey: 'customer_id', as: 'orders' });

// Set up SalesRoute to Staff association (Many-to-Many)
SalesRoute.belongsToMany(Staff, {
    through: SalesRouteStaff,
    foreignKey: 'sales_route_id',
    otherKey: 'staff_id',
    as: 'assignedStaffMembers'
});

Staff.belongsToMany(SalesRoute, {
    through: SalesRouteStaff,
    foreignKey: 'staff_id',
    otherKey: 'sales_route_id',
    as: 'assignedRoutes'
});

// Set up StaffCheckIn associations
const { StaffCheckIn } = require('../../modules/attendance/checkin.model');
StaffCheckIn.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Customer.hasMany(StaffCheckIn, { foreignKey: 'customer_id', as: 'checkins' }); // Added for reverse lookup
StaffCheckIn.belongsTo(Staff, { foreignKey: 'staff_id', as: 'staff' });

// Set up Payroll associations
const { PayrollRun, PayrollItem, PayrollAdvance, PayrollAdvanceReturn } = require('../../modules/payroll/payroll.models');

PayrollRun.hasMany(PayrollItem, { foreignKey: 'run_id', as: 'items' });
PayrollItem.belongsTo(PayrollRun, { foreignKey: 'run_id', as: 'run' });

User.hasMany(PayrollItem, { foreignKey: 'staff_id', as: 'payrollItems' });
PayrollItem.belongsTo(User, { foreignKey: 'staff_id', as: 'staff' });

User.hasMany(PayrollAdvance, { foreignKey: 'staff_id', as: 'advances' });
PayrollAdvance.belongsTo(User, { foreignKey: 'staff_id', as: 'staff' });
PayrollAdvance.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Associations for PayrollAdvance and PayrollAdvanceReturn are already defined in their model file


// Set up Gallery associations
const { Gallery } = require('../../modules/upload/upload.model');
Gallery.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });
User.hasMany(Gallery, { foreignKey: 'uploaded_by', as: 'uploads' });

module.exports = {};
