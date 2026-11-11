/**
 * Migration: Create purchase_orders table
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('purchase_orders', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            po_number: {
                type: Sequelize.STRING(50),
                allowNull: false,
                unique: true
            },
            supplier_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'suppliers',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            order_date: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            expected_delivery_date: {
                type: Sequelize.DATE,
                allowNull: true
            },
            status: {
                type: Sequelize.ENUM('pending', 'approved', 'ordered', 'partial', 'received', 'cancelled'),
                defaultValue: 'pending'
            },
            total_amount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0.00
            },
            notes: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            created_by: {
                type: Sequelize.INTEGER,
                allowNull: true
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

        await queryInterface.addIndex('purchase_orders', ['supplier_id']);
        await queryInterface.addIndex('purchase_orders', ['status']);
        await queryInterface.addIndex('purchase_orders', ['order_date']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('purchase_orders');
    }
};
