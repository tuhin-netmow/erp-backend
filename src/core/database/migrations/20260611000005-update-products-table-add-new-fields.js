/**
 * Migration: Update products table with new fields
 * Adds additional fields to products table for enhanced product management
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Add new columns to products table
        const columnsToAdd = [
            {
                name: 'specification',
                attributes: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                    comment: 'Detailed product specifications'
                }
            },
            {
                name: 'product_type',
                attributes: {
                    type: Sequelize.ENUM('standard', 'raw_material', 'finished_good', 'service'),
                    defaultValue: 'standard',
                    allowNull: false,
                    comment: 'Product classification type'
                }
            },
            {
                name: 'purchase_tax',
                attributes: {
                    type: Sequelize.DECIMAL(5, 2),
                    allowNull: true,
                    defaultValue: 0.00,
                    comment: 'Purchase tax percentage'
                }
            },
            {
                name: 'sales_tax',
                attributes: {
                    type: Sequelize.DECIMAL(5, 2),
                    allowNull: true,
                    defaultValue: 0.00,
                    comment: 'Sales tax percentage'
                }
            },
            {
                name: 'initial_stock',
                attributes: {
                    type: Sequelize.DECIMAL(10, 2),
                    allowNull: true,
                    comment: 'Initial stock quantity when product was created'
                }
            },
            {
                name: 'weight',
                attributes: {
                    type: Sequelize.DECIMAL(10, 2),
                    allowNull: true,
                    comment: 'Weight in kilograms (kg)'
                }
            },
            {
                name: 'length',
                attributes: {
                    type: Sequelize.DECIMAL(10, 2),
                    allowNull: true,
                    comment: 'Length in centimeters (cm)'
                }
            },
            {
                name: 'width',
                attributes: {
                    type: Sequelize.DECIMAL(10, 2),
                    allowNull: true,
                    comment: 'Width in centimeters (cm)'
                }
            },
            {
                name: 'height',
                attributes: {
                    type: Sequelize.DECIMAL(10, 2),
                    allowNull: true,
                    comment: 'Height in centimeters (cm)'
                }
            },
            {
                name: 'expiry_date',
                attributes: {
                    type: Sequelize.DATEONLY,
                    allowNull: true,
                    comment: 'Product expiry date'
                }
            },
            {
                name: 'is_commissionable',
                attributes: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                    comment: 'Whether this product is eligible for sales commission'
                }
            },
            {
                name: 'created_by',
                attributes: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                    comment: 'User ID who created the product',
                    references: {
                        model: 'users',
                        key: 'id'
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'SET NULL'
                }
            }
        ];

        // Add each column if it doesn't exist
        for (const column of columnsToAdd) {
            try {
                await queryInterface.addColumn('products', column.name, column.attributes);
                console.log(`✅ Added column: ${column.name}`);
            } catch (error) {
                if (error.message.includes('Duplicate column name')) {
                    console.log(`⏭️  Column ${column.name} already exists, skipping...`);
                } else {
                    throw error;
                }
            }
        }

        // Update stock_quantity to DECIMAL for decimal support
        try {
            await queryInterface.changeColumn('products', 'stock_quantity', {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0.00,
                comment: 'Current stock quantity - supports decimals'
            });
            console.log('✅ Updated stock_quantity to DECIMAL(10, 2)');
        } catch (error) {
            console.log('⏭️  stock_quantity already updated or error:', error.message);
        }

        // Update min_stock_level to DECIMAL for decimal support
        try {
            await queryInterface.changeColumn('products', 'min_stock_level', {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
                comment: 'Minimum stock level alert threshold - supports decimals'
            });
            console.log('✅ Updated min_stock_level to DECIMAL(10, 2)');
        } catch (error) {
            console.log('⏭️  min_stock_level already updated or error:', error.message);
        }

        // Update max_stock_level to DECIMAL for decimal support
        try {
            await queryInterface.changeColumn('products', 'max_stock_level', {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
                comment: 'Maximum stock level - supports decimals'
            });
            console.log('✅ Updated max_stock_level to DECIMAL(10, 2)');
        } catch (error) {
            console.log('⏭️  max_stock_level already updated or error:', error.message);
        }

        // Add index for created_by
        try {
            await queryInterface.addIndex('products', ['created_by']);
            console.log('✅ Added index for created_by');
        } catch (error) {
            console.log('⏭️  Index for created_by already exists');
        }
    },

    down: async (queryInterface, Sequelize) => {
        // Remove columns (reverse order)
        const columnsToRemove = [
            'created_by',
            'expiry_date',
            'height',
            'width',
            'length',
            'weight',
            'initial_stock',
            'sales_tax',
            'purchase_tax',
            'product_type',
            'specification'
        ];

        for (const columnName of columnsToRemove) {
            try {
                await queryInterface.removeColumn('products', columnName);
                console.log(`✅ Removed column: ${columnName}`);
            } catch (error) {
                console.log(`⚠️  Could not remove column ${columnName}:`, error.message);
            }
        }

        // Revert stock_quantity to INTEGER
        try {
            await queryInterface.changeColumn('products', 'stock_quantity', {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            });
            console.log('✅ Reverted stock_quantity to INTEGER');
        } catch (error) {
            console.log('⚠️  Could not revert stock_quantity:', error.message);
        }

        // Revert min_stock_level to INTEGER
        try {
            await queryInterface.changeColumn('products', 'min_stock_level', {
                type: Sequelize.INTEGER,
                allowNull: true
            });
            console.log('✅ Reverted min_stock_level to INTEGER');
        } catch (error) {
            console.log('⚠️  Could not revert min_stock_level:', error.message);
        }

        // Revert max_stock_level to INTEGER
        try {
            await queryInterface.changeColumn('products', 'max_stock_level', {
                type: Sequelize.INTEGER,
                allowNull: true
            });
            console.log('✅ Reverted max_stock_level to INTEGER');
        } catch (error) {
            console.log('⚠️  Could not revert max_stock_level:', error.message);
        }
    }
};