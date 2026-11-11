const { DataTypes } = require('sequelize');
const { sequelize } = require('../../core/database/sequelize');

// PurchaseOrder Model
const PurchaseOrder = sequelize.define('PurchaseOrder', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    po_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    supplier_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    order_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    expected_delivery_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'ordered', 'partial', 'received', 'cancelled', 'returned'),
        defaultValue: 'pending'
    },
    total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        get() {
            const value = this.getDataValue('total_amount');
            return value === null ? null : parseFloat(value);
        }
    },
    tax_amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        get() {
            const value = this.getDataValue('tax_amount');
            return value === null ? null : parseFloat(value);
        }
    },
    discount_amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        get() {
            const value = this.getDataValue('discount_amount');
            return value === null ? null : parseFloat(value);
        }
    },
    payment_status: {
        type: DataTypes.ENUM('unpaid', 'partially_paid', 'paid'),
        defaultValue: 'unpaid'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'purchase_orders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// PurchaseOrderItem Model
const PurchaseOrderItem = sequelize.define('PurchaseOrderItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    purchase_order_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 1.00,
        get() {
            const value = this.getDataValue('quantity');
            return value === null ? null : parseFloat(value);
        }
    },
    unit_cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        get() {
            const value = this.getDataValue('unit_cost');
            return value === null ? null : parseFloat(value);
        }
    },
    discount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.00,
        get() {
            const value = this.getDataValue('discount');
            return value === null ? null : parseFloat(value);
        }
    },
    line_total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        get() {
            const value = this.getDataValue('line_total');
            return value === null ? null : parseFloat(value);
        }
    },
    tax_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.00,
        get() {
            const value = this.getDataValue('tax_amount');
            return value === null ? null : parseFloat(value);
        }
    },
    purchase_tax_percent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0.00,
        get() {
            const value = this.getDataValue('purchase_tax_percent');
            return value === null ? null : parseFloat(value);
        }
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'purchase_order_items',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// PurchaseInvoice Model
const PurchaseInvoice = sequelize.define('PurchaseInvoice', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    invoice_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    purchase_order_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    invoice_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    due_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        get() {
            const value = this.getDataValue('total_amount');
            return value === null ? null : parseFloat(value);
        }
    },
    status: {
        type: DataTypes.ENUM('draft', 'received', 'paid', 'overdue', 'cancelled'),
        defaultValue: 'draft'
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'purchase_invoices',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// PurchasePayment Model
const PurchasePayment = sequelize.define('PurchasePayment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    invoice_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    purchase_order_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        get() {
            const value = this.getDataValue('amount');
            return value === null ? null : parseFloat(value);
        }
    },
    payment_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    payment_method: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    reference_number: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'completed', 'failed'),
        defaultValue: 'pending'
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'purchase_payments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// PurchaseReceipt Model (for receiving goods)
const PurchaseReceipt = sequelize.define('PurchaseReceipt', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    receipt_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    purchase_order_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    receipt_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    received_by: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'partial', 'completed', 'rejected'),
        defaultValue: 'pending'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    received_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'purchase_receipts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Associations
PurchaseOrder.hasMany(PurchaseOrderItem, { foreignKey: 'purchase_order_id', as: 'items' });
PurchaseOrderItem.belongsTo(PurchaseOrder, { foreignKey: 'purchase_order_id' });

PurchaseOrder.hasOne(PurchaseInvoice, { foreignKey: 'purchase_order_id', as: 'invoice' });
PurchaseInvoice.belongsTo(PurchaseOrder, { foreignKey: 'purchase_order_id', as: 'purchase_order' });

PurchaseOrder.hasMany(PurchasePayment, { foreignKey: 'purchase_order_id', as: 'payments' });
PurchasePayment.belongsTo(PurchaseOrder, { foreignKey: 'purchase_order_id', as: 'purchase_order' });

PurchaseInvoice.hasMany(PurchasePayment, { foreignKey: 'invoice_id', as: 'payments' });
PurchasePayment.belongsTo(PurchaseInvoice, { foreignKey: 'invoice_id', as: 'invoice' });

PurchaseOrder.hasMany(PurchaseReceipt, { foreignKey: 'purchase_order_id', as: 'receipts' });
PurchaseReceipt.belongsTo(PurchaseOrder, { foreignKey: 'purchase_order_id' });

// Associate with Supplier
const { Supplier } = require('../suppliers/suppliers.model');
PurchaseOrder.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
Supplier.hasMany(PurchaseOrder, { foreignKey: 'supplier_id', as: 'purchase_orders' });

// Associate with Product
const { Product } = require('../products/products.model');
PurchaseOrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

module.exports = {
    PurchaseOrder,
    PurchaseOrderItem,
    PurchaseInvoice,
    PurchasePayment,
    PurchaseReceipt
};
