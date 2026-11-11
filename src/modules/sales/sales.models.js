const { DataTypes } = require('sequelize');
const { sequelize } = require('../../core/database/sequelize');
const { Customer } = require('../customers/customers.model');
const { Product } = require('../products/products.model');

// Warehouse Model
const Warehouse = sequelize.define('Warehouse', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    location: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    capacity: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    manager_name: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    contact_number: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
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
    tableName: 'warehouses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// SalesRoute Model
const SalesRoute = sequelize.define('SalesRoute', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    route_name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    assigned_sales_rep_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    start_location: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    end_location: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    zoom_level: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    country: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    state: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    city: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    postal_code: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    center_lat: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    center_lng: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    end_lat: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    end_lng: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    end_city: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    end_state: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    end_country: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    end_postal_code: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    coverage_radius: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
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
    tableName: 'sales_routes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Order Model
const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    order_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    order_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'processing', 'shipped', 'in_transit', 'delivered', 'cancelled', 'returned', 'failed'),
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
    sales_tax_percent: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0.00,
        get() {
            const value = this.getDataValue('sales_tax_percent');
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
    shipping_address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    billing_address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    payment_status: {
        type: DataTypes.ENUM('unpaid', 'partially_paid', 'paid', 'refunded'),
        defaultValue: 'unpaid'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    due_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    delivery_date: {
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
    tableName: 'orders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// OrderItem Model
const OrderItem = sequelize.define('OrderItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    order_id: {
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
    unit_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        get() {
            const value = this.getDataValue('unit_price');
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
        allowNull: true,
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
    sales_tax_percent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0.00,
        get() {
            const value = this.getDataValue('sales_tax_percent');
            return value === null ? null : parseFloat(value);
        }
    },
    total_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        get() {
            const value = this.getDataValue('total_price');
            return value === null ? null : parseFloat(value);
        }
    },
    purchase_cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.00,
        get() {
            const value = this.getDataValue('purchase_cost');
            return value === null ? null : parseFloat(value);
        }
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    remark: {
        type: DataTypes.TEXT,
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
    tableName: 'order_items',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Invoice Model
const Invoice = sequelize.define('Invoice', {
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
    order_id: {
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
        type: DataTypes.ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled'),
        defaultValue: 'draft'
    },
    // E-Invoice Fields
    e_invoice_uuid: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    e_invoice_status: {
        type: DataTypes.STRING(50), // PENDING, SUBMITTED, VALID, INVALID, CANCELLED
        defaultValue: 'PENDING'
    },
    e_invoice_qr_url: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    e_invoice_long_id: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    submission_date: {
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
    tableName: 'invoices',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Payment Model
const Payment = sequelize.define('Payment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    invoice_id: {
        type: DataTypes.INTEGER,
        allowNull: true // Can be linked to invoice or directly to order
    },
    order_id: {
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
        allowNull: false // e.g., 'cash', 'credit_card', 'bank_transfer'
    },
    reference_number: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
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
    tableName: 'payments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Delivery Model
const Delivery = sequelize.define('Delivery', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    delivery_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    order_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    delivery_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    delivery_address: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    delivery_person_name: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    delivery_person_phone: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    tracking_number: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'in_transit', 'delivered', 'cancelled', 'failed', 'returned'),
        defaultValue: 'pending'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    delivered_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    signature: {
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
    tableName: 'deliveries',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// OrderStatusHistory Model
const OrderStatusHistory = sequelize.define('OrderStatusHistory', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    order_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    status: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    delivery_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    changed_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'order_status_history',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

// SalesRouteStaff Junction Table (for many-to-many relationship)
const SalesRouteStaff = sequelize.define('SalesRouteStaff', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    sales_route_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'sales_routes',
            key: 'id'
        }
    },
    staff_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'staffs',
            key: 'id'
        }
    },
    assigned_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    assigned_by: {
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
    tableName: 'sales_route_staff',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            unique: true,
            fields: ['sales_route_id', 'staff_id']
        }
    ]
});


// OrderStaff Junction Table (for many-to-many relationship)
const OrderStaff = sequelize.define('OrderStaff', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'orders',
            key: 'id'
        }
    },
    staff_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'staffs',
            key: 'id'
        }
    },
    assigned_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    assigned_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    role: { // e.g., 'primary', 'support', 'driver'
        type: DataTypes.STRING(50),
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
    tableName: 'order_staff',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            unique: true,
            fields: ['order_id', 'staff_id']
        }
    ]
});

// Associations
Order.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
const { Staff } = require('../staffs/staffs.model');

Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Order.hasOne(Invoice, { foreignKey: 'order_id', as: 'invoice' });
Invoice.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

Order.hasMany(Payment, { foreignKey: 'order_id', as: 'payments' });
Payment.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

Invoice.hasMany(Payment, { foreignKey: 'invoice_id', as: 'payments' });
Payment.belongsTo(Invoice, { foreignKey: 'invoice_id', as: 'invoice' });

Order.hasMany(Delivery, { foreignKey: 'order_id', as: 'deliveries' });
Delivery.belongsTo(Order, { foreignKey: 'order_id' });

Order.hasMany(OrderStatusHistory, { foreignKey: 'order_id', as: 'status_history' });
OrderStatusHistory.belongsTo(Order, { foreignKey: 'order_id' });

// Order Staff Assignments
Order.belongsToMany(Staff, { through: OrderStaff, as: 'assignedStaff', foreignKey: 'order_id' });

Staff.belongsToMany(Order, { through: OrderStaff, as: 'assignedOrders', foreignKey: 'staff_id' });

// DeletedHistory Model
const DeletedHistory = sequelize.define('DeletedHistory', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    record_type: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    record_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    identifier: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    data: {
        type: DataTypes.JSON,
        allowNull: false
    },
    deleted_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'deleted_histories',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

const { User } = require('../users/user.model');
DeletedHistory.belongsTo(User, { foreignKey: 'deleted_by', as: 'deletedByUser' });

// SalesRoute associations are defined in src/core/database/associations.js
// to avoid circular dependencies

module.exports = {
    Warehouse,
    SalesRoute,
    SalesRouteStaff,
    Order,
    OrderStaff,
    OrderItem,
    Invoice,
    Payment,
    Delivery,
    OrderStatusHistory,
    DeletedHistory
};
