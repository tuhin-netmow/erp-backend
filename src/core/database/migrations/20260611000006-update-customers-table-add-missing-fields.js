/**
 * Migration: Update customers table with missing fields
 * Adds additional fields to customers table for enhanced customer management
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Add new columns to customers table
        const columnsToAdd = [
            {
                name: 'image_url',
                attributes: {
                    type: Sequelize.STRING(500),
                    allowNull: true,
                    comment: 'Customer profile image URL'
                }
            },
            {
                name: 'sales_route_id',
                attributes: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                    comment: 'Sales route ID for delivery planning'
                }
            },
            {
                name: 'created_by',
                attributes: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                    comment: 'User ID who created the customer record',
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
                await queryInterface.addColumn('customers', column.name, column.attributes);
                console.log(`✅ Added column: ${column.name}`);
            } catch (error) {
                if (error.message.includes('Duplicate column name')) {
                    console.log(`⏭️  Column ${column.name} already exists, skipping...`);
                } else {
                    throw error;
                }
            }
        }

        // Add index for sales_route_id if it doesn't exist
        try {
            await queryInterface.addIndex('customers', ['sales_route_id']);
            console.log('✅ Added index for sales_route_id');
        } catch (error) {
            console.log('⏭️  Index for sales_route_id already exists');
        }

        // Add index for created_by if it doesn't exist
        try {
            await queryInterface.addIndex('customers', ['created_by']);
            console.log('✅ Added index for created_by');
        } catch (error) {
            console.log('⏭️  Index for created_by already exists');
        }

        // Check if company field needs to be made NOT NULL
        // First check if there are any NULL values
        const [results] = await queryInterface.sequelize.query(
            'SELECT COUNT(*) as count FROM customers WHERE company IS NULL'
        );

        if (results[0].count === 0) {
            try {
                await queryInterface.changeColumn('customers', 'company', {
                    type: Sequelize.STRING(255),
                    allowNull: false
                });
                console.log('✅ Updated company field to NOT NULL');
            } catch (error) {
                console.log('⏭️  Company field already NOT NULL or error:', error.message);
            }
        } else {
            console.log('⚠️  Cannot make company NOT NULL - there are existing NULL values');
        }
    },

    down: async (queryInterface, Sequelize) => {
        // Remove columns (reverse order)
        const columnsToRemove = [
            'created_by',
            'sales_route_id',
            'image_url'
        ];

        for (const columnName of columnsToRemove) {
            try {
                await queryInterface.removeColumn('customers', columnName);
                console.log(`✅ Removed column: ${columnName}`);
            } catch (error) {
                console.log(`⚠️  Could not remove column ${columnName}:`, error.message);
            }
        }

        // Revert company field to nullable
        try {
            await queryInterface.changeColumn('customers', 'company', {
                type: Sequelize.STRING(255),
                allowNull: true
            });
            console.log('✅ Reverted company field to nullable');
        } catch (error) {
            console.log('⚠️  Could not revert company field:', error.message);
        }
    }
};