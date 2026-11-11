/**
 * Migration: Create purchase_order_items table
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('purchase_order_items', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            purchase_order_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'purchase_orders',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            product_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'products',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            quantity: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 1
            },
            unit_cost: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false
            },
            line_total: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false
            },
            created_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        await queryInterface.addIndex('purchase_order_items', ['purchase_order_id']);
        await queryInterface.addIndex('purchase_order_items', ['product_id']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('purchase_order_items');
    }
};
