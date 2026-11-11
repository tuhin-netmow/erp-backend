/**
 * Migration: Create product_images table
 * Creates table for product image gallery with multiple images per product
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('product_images', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            product_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'products',
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
                comment: 'Main product image'
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
        await queryInterface.addIndex('product_images', ['product_id']);
        await queryInterface.addIndex('product_images', ['is_primary']);
        await queryInterface.addIndex('product_images', ['sort_order']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('product_images');
    }
};