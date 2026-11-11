const { DataTypes } = require('sequelize');
const { sequelize } = require('../../core/database/sequelize');

// PayrollRun Model
const PayrollRun = sequelize.define('PayrollRun', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    month: {
        type: DataTypes.STRING(20), // E.g., "2025-01"
        allowNull: false
    },
    total_gross: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    total_net: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'paid'),
        defaultValue: 'pending'
    },
    payment_date: {
        type: DataTypes.DATEONLY,
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
    tableName: 'payroll_runs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// PayrollItem Model
const PayrollItem = sequelize.define('PayrollItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    run_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    staff_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    basic_salary: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    allowances: {
        type: DataTypes.JSON, // Stores { "HRA": 500, "Transport": 200 }
        allowNull: true,
        defaultValue: {}
    },
    deductions: {
        type: DataTypes.JSON, // Stores { "Tax": 100, "EPF": 50 }
        allowNull: true,
        defaultValue: {}
    },
    gross_pay: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    net_pay: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    paid_amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    payment_status: {
        type: DataTypes.ENUM('unpaid', 'partial', 'paid'),
        defaultValue: 'unpaid'
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
    tableName: 'payroll_items',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

const PayrollPayment = sequelize.define('PayrollPayment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    payroll_item_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    payment_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    payment_method: {
        type: DataTypes.STRING,
        allowNull: true
    },
    reference: {
        type: DataTypes.STRING,
        allowNull: true
    },
    remarks: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'payroll_payments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

const PayrollAdvance = sequelize.define('PayrollAdvance', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    staff_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },
    advance_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    reason: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'paid', 'returned', 'cancelled'),
        defaultValue: 'pending'
    },
    returned_amount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0.00
    },
    returned_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    remarks: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'payroll_advances',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

const PayrollAdvanceReturn = sequelize.define('PayrollAdvanceReturn', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    advance_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },
    return_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    remarks: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'payroll_advance_returns',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Associations
PayrollAdvance.hasMany(PayrollAdvanceReturn, { foreignKey: 'advance_id', as: 'returns' });
PayrollAdvanceReturn.belongsTo(PayrollAdvance, { foreignKey: 'advance_id', as: 'advance' });

PayrollItem.hasMany(PayrollPayment, { foreignKey: 'payroll_item_id', as: 'payments' });
PayrollPayment.belongsTo(PayrollItem, { foreignKey: 'payroll_item_id', as: 'item' });

module.exports = { PayrollRun, PayrollItem, PayrollAdvance, PayrollAdvanceReturn, PayrollPayment };


