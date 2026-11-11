/**
 * Migration: Create deliveries table
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('deliveries', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            delivery_number: {
                type: Sequelize.STRING(50),
                allowNull: false,
                unique: true
            },
            order_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'orders',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            delivery_date: {
                type: Sequelize.DATE,
                allowNull: true
            },
            delivery_address: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            delivery_person_name: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            delivery_person_phone: {
                type: Sequelize.STRING(50),
                allowNull: true
            },
            tracking_number: {
                type: Sequelize.STRING(100),
                allowNull: true
            },
            status: {
                type: Sequelize.ENUM('pending', 'in_transit', 'delivered', 'failed', 'returned'),
                defaultValue: 'pending'
            },
            notes: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            delivered_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            signature: {
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

        await queryInterface.addIndex('deliveries', ['order_id']);
        await queryInterface.addIndex('deliveries', ['delivery_number']);
        await queryInterface.addIndex('deliveries', ['status']);
        await queryInterface.addIndex('deliveries', ['delivery_date']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('deliveries');
    }
};
