const { DataTypes } = require('sequelize');
const { sequelize } = require('../../core/database/sequelize');

// PurchaseReturn Model
const PurchaseReturn = sequelize.define('PurchaseReturn', {
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
    purchase_order_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    supplier_id: {
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
    tableName: 'purchase_returns',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// PurchaseReturnItem Model
const PurchaseReturnItem = sequelize.define('PurchaseReturnItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    purchase_return_id: {
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
    tableName: 'purchase_return_items',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// PurchaseReturnInvoice Model (Credit Note)
const PurchaseReturnInvoice = sequelize.define('PurchaseReturnInvoice', {
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
    purchase_return_id: {
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
    tableName: 'purchase_return_invoices',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// PurchaseReturnPayment Model (Refund)
const PurchaseReturnPayment = sequelize.define('PurchaseReturnPayment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    invoice_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    purchase_return_id: {
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
    tableName: 'purchase_return_payments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Associations
PurchaseReturn.hasMany(PurchaseReturnItem, { foreignKey: 'purchase_return_id', as: 'items' });
PurchaseReturnItem.belongsTo(PurchaseReturn, { foreignKey: 'purchase_return_id' });

PurchaseReturn.hasOne(PurchaseReturnInvoice, { foreignKey: 'purchase_return_id', as: 'invoice' });
PurchaseReturnInvoice.belongsTo(PurchaseReturn, { foreignKey: 'purchase_return_id', as: 'purchase_return' });

PurchaseReturn.hasMany(PurchaseReturnPayment, { foreignKey: 'purchase_return_id', as: 'payments' });
PurchaseReturnPayment.belongsTo(PurchaseReturn, { foreignKey: 'purchase_return_id', as: 'purchase_return' });

PurchaseReturnInvoice.hasMany(PurchaseReturnPayment, { foreignKey: 'invoice_id', as: 'payments' });
PurchaseReturnPayment.belongsTo(PurchaseReturnInvoice, { foreignKey: 'invoice_id', as: 'invoice' });


module.exports = {
    PurchaseReturn,
    PurchaseReturnItem,
    PurchaseReturnInvoice,
    PurchaseReturnPayment
};
