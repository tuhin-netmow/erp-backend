/**
 * Migration: Create notifications table
 * Creates table for managing user notifications with different types and priorities
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('notifications', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                comment: 'NULL means notification for all users',
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            type: {
                type: Sequelize.ENUM('order', 'stock', 'payment', 'customer', 'system', 'return', 'delivery'),
                allowNull: false
            },
            title: {
                type: Sequelize.STRING(255),
                allowNull: false
            },
            message: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            link: {
                type: Sequelize.STRING(500),
                allowNull: true
            },
            reference_type: {
                type: Sequelize.STRING(50),
                allowNull: true,
                comment: 'Entity type: order, product, customer, etc.'
            },
            reference_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                comment: 'Entity ID for reference'
            },
            is_read: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            priority: {
                type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
                defaultValue: 'medium'
            },
            read_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            created_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        // Add indexes for better query performance
        await queryInterface.addIndex('notifications', ['user_id']);
        await queryInterface.addIndex('notifications', ['is_read']);
        await queryInterface.addIndex('notifications', ['type']);
        await queryInterface.addIndex('notifications', ['created_at']);
        await queryInterface.addIndex('notifications', ['priority']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('notifications');
    }
};