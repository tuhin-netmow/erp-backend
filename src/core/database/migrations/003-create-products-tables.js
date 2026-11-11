/**
 * Migration: Create Products Tables
 * Creates tables for products, categories, and units
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Create categories table
        await queryInterface.createTable('categories', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            name: {
                type: Sequelize.STRING(255),
                allowNull: false
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            parent_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'categories',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
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

        // Create units table
        await queryInterface.createTable('units', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            name: {
                type: Sequelize.STRING(100),
                allowNull: false
            },
            symbol: {
                type: Sequelize.STRING(20),
                allowNull: false
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
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

        // Create products table
        await queryInterface.createTable('products', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            name: {
                type: Sequelize.STRING(255),
                allowNull: false
            },
            sku: {
                type: Sequelize.STRING(100),
                unique: true,
                allowNull: false
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            category_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'categories',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            unit_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'units',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            price: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0.00
            },
            cost: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true
            },
            stock_quantity: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            min_stock_level: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            max_stock_level: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            barcode: {
                type: Sequelize.STRING(100),
                allowNull: true
            },
            image_url: {
                type: Sequelize.STRING(500),
                allowNull: true
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
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

        // Add indexes
        try { await queryInterface.addIndex('products', ['sku'], { unique: true }); } catch (e) {}
        try { await queryInterface.addIndex('products', ['category_id']); } catch (e) {}
        try { await queryInterface.addIndex('products', ['unit_id']); } catch (e) {}
        try { await queryInterface.addIndex('products', ['is_active']); } catch (e) {}

        // Insert default units
        await queryInterface.bulkInsert('units', [
            {
                name: 'Piece',
                symbol: 'pcs',
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                name: 'Kilogram',
                symbol: 'kg',
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                name: 'Liter',
                symbol: 'L',
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                name: 'Meter',
                symbol: 'm',
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                name: 'Box',
                symbol: 'box',
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            }
        ]);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('products');
        await queryInterface.dropTable('units');
        await queryInterface.dropTable('categories');
    }
};
