const { DataTypes } = require('sequelize');
const { sequelize } = require('../../core/database/sequelize');

// SalesReturn Model
const SalesReturn = sequelize.define('SalesReturn', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    return_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    order_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    return_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'returned', 'cancelled'),
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
    grand_total: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        get() {
            const value = this.getDataValue('grand_total');
            return value === null ? null : parseFloat(value);
        }
    },
    payment_status: {
        type: DataTypes.ENUM('pending', 'partial', 'refunded'),
        defaultValue: 'pending'
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
    tableName: 'sales_returns',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// SalesReturnItem Model
const SalesReturnItem = sequelize.define('SalesReturnItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    sales_return_id: {
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
    tax_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.00,
        get() {
            const value = this.getDataValue('tax_amount');
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
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'sales_return_items',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// SalesReturnInvoice Model (Credit Note to Customer)
const SalesReturnInvoice = sequelize.define('SalesReturnInvoice', {
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
    sales_return_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    invoice_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
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
        type: DataTypes.ENUM('draft', 'issued', 'refunded', 'cancelled'),
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
    tableName: 'sales_return_invoices',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// SalesReturnPayment Model (Refund to Customer)
const SalesReturnPayment = sequelize.define('SalesReturnPayment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    invoice_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    sales_return_id: {
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
    tableName: 'sales_return_payments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Associations
SalesReturn.hasMany(SalesReturnItem, { foreignKey: 'sales_return_id', as: 'items' });
SalesReturnItem.belongsTo(SalesReturn, { foreignKey: 'sales_return_id' });

SalesReturn.hasOne(SalesReturnInvoice, { foreignKey: 'sales_return_id', as: 'invoice' });
SalesReturnInvoice.belongsTo(SalesReturn, { foreignKey: 'sales_return_id', as: 'sales_return' });

SalesReturn.hasMany(SalesReturnPayment, { foreignKey: 'sales_return_id', as: 'payments' });
SalesReturnPayment.belongsTo(SalesReturn, { foreignKey: 'sales_return_id', as: 'sales_return' });

SalesReturnInvoice.hasMany(SalesReturnPayment, { foreignKey: 'invoice_id', as: 'payments' });
SalesReturnPayment.belongsTo(SalesReturnInvoice, { foreignKey: 'invoice_id', as: 'invoice' });

module.exports = {
    SalesReturn,
    SalesReturnItem,
    SalesReturnInvoice,
    SalesReturnPayment
};
