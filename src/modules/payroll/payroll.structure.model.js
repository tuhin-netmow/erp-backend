const { DataTypes } = require('sequelize');
const { sequelize } = require('../../core/database/sequelize');
const { User } = require('../users/user.model');

const PayrollStructure = sequelize.define('PayrollStructure', {
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
            model: User,
            key: 'id'
        }
    },
    basic_salary: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    allowances: {
        type: DataTypes.JSON, // Stores array of { title, amount, type }
        allowNull: true,
        defaultValue: []
    },
    deductions: {
        type: DataTypes.JSON, // Stores array of { title, amount, type }
        allowNull: true,
        defaultValue: []
    },
    bank_details: {
        type: DataTypes.JSON, // { bank_name, account_name, account_number, branch }
        allowNull: true,
        defaultValue: {}
    },
    // Virtual field for Net Salary (calculated on fetch usually, or we can store it cache)
    // Storing it is better for query performance if needed
    net_salary_cache: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    }
}, {
    tableName: 'payroll_structures',
    timestamps: true,
    underscored: true
});

// Association
User.hasOne(PayrollStructure, { foreignKey: 'user_id', as: 'payrollStructure' });
PayrollStructure.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = { PayrollStructure };
