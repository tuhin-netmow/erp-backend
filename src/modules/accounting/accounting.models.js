const { DataTypes } = require('sequelize');
const { sequelize } = require('../../core/database/sequelize');

// 1. Chart of Accounts
const Account = sequelize.define('Account', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    code: {
        type: DataTypes.STRING(20),
        unique: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'),
        allowNull: false
    },
    parent_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'accounts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at' // sequelize default is updatedAt
});

// 2. Transactions (Single Entry UI Staging)
const Transaction = sequelize.define('Transaction', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    type: {
        type: DataTypes.STRING(50), // SALES, PURCHASE, EXPENSE, etc.
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    payment_mode: {
        type: DataTypes.ENUM('CASH', 'BANK', 'DUE'),
        allowNull: false
    },
    reference_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    // Meta fields for specific logic
    category: DataTypes.STRING, // For 'Daily Expense' type
    person: DataTypes.STRING,   // For 'Professional Fees' type
    supplier: DataTypes.STRING  // For 'Purchase'
}, {
    tableName: 'transactions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// 3. Journal Master (Double Entry Core)
const Journal = sequelize.define('Journal', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    reference_type: {
        type: DataTypes.STRING(50), // e.g., 'TRANSACTION'
        allowNull: true
    },
    reference_id: {
        type: DataTypes.INTEGER, // Link back to Transaction ID
        allowNull: true
    },
    narration: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'journals',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// 4. Journal Details
const JournalLine = sequelize.define('JournalLine', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    journal_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    account_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    debit: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
    },
    credit: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
    }
}, {
    tableName: 'journal_lines',
    timestamps: false
});

// 5. Tax Submissions
const TaxSubmission = sequelize.define('TaxSubmission', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    tax_type: {
        type: DataTypes.STRING(50), // e.g., 'VAT', 'GST', 'INCOME_TAX'
        allowNull: false
    },
    period_start: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    period_end: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    submission_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    reference_number: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    attachment_url: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('PENDING', 'SUBMITTED', 'PAID'),
        allowNull: false,
        defaultValue: 'SUBMITTED'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    payment_mode: {
        type: DataTypes.ENUM('CASH', 'BANK'),
        allowNull: false,
        defaultValue: 'BANK'
    }
}, {
    tableName: 'tax_submissions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Associations
Account.hasMany(Account, { as: 'children', foreignKey: 'parent_id' });
Account.belongsTo(Account, { as: 'parent', foreignKey: 'parent_id' });

Journal.hasMany(JournalLine, { foreignKey: 'journal_id', as: 'entries' });
JournalLine.belongsTo(Journal, { foreignKey: 'journal_id' });

JournalLine.belongsTo(Account, { foreignKey: 'account_id', as: 'account' });
Account.hasMany(JournalLine, { foreignKey: 'account_id' });

// Link Transaction to Journal
Transaction.hasOne(Journal, { foreignKey: 'reference_id', constraints: false, scope: { reference_type: 'TRANSACTION' } });
Journal.belongsTo(Transaction, { foreignKey: 'reference_id', constraints: false });

module.exports = {
    Account,
    Transaction,
    Journal,
    JournalLine,
    TaxSubmission
};
