/**
 * Migration: Create Sales Module Tables
 * Creates tables for warehouses, sales_routes, orders, order_items, invoices, and payments
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // 1. Warehouses
        await queryInterface.createTable('warehouses', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            name: { type: Sequelize.STRING(255), allowNull: false },
            location: { type: Sequelize.STRING(255), allowNull: true },
            capacity: { type: Sequelize.INTEGER, allowNull: true },
            manager_name: { type: Sequelize.STRING(100), allowNull: true },
            contact_number: { type: Sequelize.STRING(50), allowNull: true },
            is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
            created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
        });

        // 2. Sales Routes
        await queryInterface.createTable('sales_routes', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            route_name: { type: Sequelize.STRING(255), allowNull: false },
            description: { type: Sequelize.TEXT, allowNull: true },
            assigned_sales_rep_id: { type: Sequelize.INTEGER, allowNull: true },
            start_location: { type: Sequelize.STRING(255), allowNull: true },
            end_location: { type: Sequelize.STRING(255), allowNull: true },
            is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
            created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
        });

        // 3. Orders
        await queryInterface.createTable('orders', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            order_number: { type: Sequelize.STRING(50), allowNull: false, unique: true },
            customer_id: { type: Sequelize.INTEGER, allowNull: false },
            order_date: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            status: {
                type: Sequelize.ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'),
                defaultValue: 'pending'
            },
            total_amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 },
            tax_amount: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0.00 },
            discount_amount: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0.00 },
            shipping_address: { type: Sequelize.TEXT, allowNull: true },
            billing_address: { type: Sequelize.TEXT, allowNull: true },
            payment_status: {
                type: Sequelize.ENUM('unpaid', 'partially_paid', 'paid', 'refunded'),
                defaultValue: 'unpaid'
            },
            notes: { type: Sequelize.TEXT, allowNull: true },
            created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
        });

        // 4. Order Items
        await queryInterface.createTable('order_items', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            order_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'orders', key: 'id' },
                onDelete: 'CASCADE'
            },
            product_id: { type: Sequelize.INTEGER, allowNull: false },
            quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
            unit_price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
            total_price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
            created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
        });

        // 5. Invoices
        await queryInterface.createTable('invoices', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            invoice_number: { type: Sequelize.STRING(50), allowNull: false, unique: true },
            order_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'orders', key: 'id' }
            },
            invoice_date: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            due_date: { type: Sequelize.DATE, allowNull: true },
            total_amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
            status: {
                type: Sequelize.ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled'),
                defaultValue: 'draft'
            },
            created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
        });

        // 6. Payments
        await queryInterface.createTable('payments', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            invoice_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'invoices', key: 'id' }
            },
            order_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'orders', key: 'id' }
            },
            amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
            payment_date: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            payment_method: { type: Sequelize.STRING(50), allowNull: false },
            reference_number: { type: Sequelize.STRING(100), allowNull: true },
            status: {
                type: Sequelize.ENUM('pending', 'completed', 'failed', 'refunded'),
                defaultValue: 'pending'
            },
            created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
        });

        // Add Indexes
        await queryInterface.addIndex('orders', ['customer_id']);
        await queryInterface.addIndex('orders', ['order_number']);
        await queryInterface.addIndex('invoices', ['invoice_number']);
        await queryInterface.addIndex('payments', ['order_id']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('payments');
        await queryInterface.dropTable('invoices');
        await queryInterface.dropTable('order_items');
        await queryInterface.dropTable('orders');
        await queryInterface.dropTable('sales_routes');
        await queryInterface.dropTable('warehouses');
    }
};
