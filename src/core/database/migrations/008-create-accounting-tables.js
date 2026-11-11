/**
 * Migration: Create Accounting Module Tables
 * Creates tables for incomes, expenses, and payrolls
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // 1. Incomes
        await queryInterface.createTable('incomes', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            title: { type: Sequelize.STRING(255), allowNull: false },
            amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
            income_date: { type: Sequelize.DATEONLY, allowNull: false },
            category: { type: Sequelize.STRING(100), allowNull: true },
            description: { type: Sequelize.TEXT, allowNull: true },
            reference_number: { type: Sequelize.STRING(100), allowNull: true },
            payment_method: { type: Sequelize.STRING(50), allowNull: true },
            created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
        });

        // 2. Expenses
        await queryInterface.createTable('expenses', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            title: { type: Sequelize.STRING(255), allowNull: false },
            amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
            expense_date: { type: Sequelize.DATEONLY, allowNull: false },
            category: { type: Sequelize.STRING(100), allowNull: true },
            description: { type: Sequelize.TEXT, allowNull: true },
            reference_number: { type: Sequelize.STRING(100), allowNull: true },
            payment_method: { type: Sequelize.STRING(50), allowNull: true },
            status: {
                type: Sequelize.ENUM('pending', 'approved', 'paid', 'rejected'),
                defaultValue: 'pending'
            },
            created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
        });

        // 3. Payrolls
        await queryInterface.createTable('payrolls', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            staff_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'staffs', key: 'id' }
            },
            salary_month: { type: Sequelize.STRING(7), allowNull: false }, // YYYY-MM
            basic_salary: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
            allowances: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0.00 },
            deductions: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0.00 },
            net_salary: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
            payment_date: { type: Sequelize.DATEONLY, allowNull: true },
            status: {
                type: Sequelize.ENUM('pending', 'processed', 'paid'),
                defaultValue: 'pending'
            },
            notes: { type: Sequelize.TEXT, allowNull: true },
            created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
        });

        // Add Indexes
        await queryInterface.addIndex('incomes', ['income_date']);
        await queryInterface.addIndex('expenses', ['expense_date']);
        await queryInterface.addIndex('payrolls', ['salary_month']);
        await queryInterface.addIndex('payrolls', ['staff_id']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('payrolls');
        await queryInterface.dropTable('expenses');
        await queryInterface.dropTable('incomes');
    }
};
