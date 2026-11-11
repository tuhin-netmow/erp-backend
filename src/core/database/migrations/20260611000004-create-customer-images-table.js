/**
 * Migration: Create customer_images table
 * Creates table for customer image gallery with multiple images per customer
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('customer_images', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            customer_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'customers',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            image_url: {
                type: Sequelize.STRING(500),
                allowNull: false
            },
            is_primary: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
                comment: 'Main customer image'
            },
            sort_order: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
                comment: 'Display order in gallery'
            },
            caption: {
                type: Sequelize.STRING(255),
                allowNull: true,
                comment: 'Image caption or alt text'
            },
            created_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
            }
        });

        // Add indexes for better query performance
        await queryInterface.addIndex('customer_images', ['customer_id']);
        await queryInterface.addIndex('customer_images', ['is_primary']);
        await queryInterface.addIndex('customer_images', ['sort_order']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('customer_images');
    }
};