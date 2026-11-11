/**
 * Migration: Update sales_routes table with map columns
 * Adds map-related columns to sales_routes table for geographical route planning
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Add map-related columns to sales_routes table
        const columnsToAdd = [
            {
                name: 'zoom_level',
                attributes: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                    comment: 'Map zoom level'
                }
            },
            {
                name: 'country',
                attributes: {
                    type: Sequelize.STRING(100),
                    allowNull: true,
                    comment: 'Country name'
                }
            },
            {
                name: 'state',
                attributes: {
                    type: Sequelize.STRING(100),
                    allowNull: true,
                    comment: 'State or Province'
                }
            },
            {
                name: 'city',
                attributes: {
                    type: Sequelize.STRING(100),
                    allowNull: true,
                    comment: 'City'
                }
            },
            {
                name: 'postal_code',
                attributes: {
                    type: Sequelize.STRING(20),
                    allowNull: true,
                    comment: 'Postal Code'
                }
            },
            {
                name: 'center_lat',
                attributes: {
                    type: Sequelize.FLOAT,
                    allowNull: true,
                    comment: 'Map center latitude'
                }
            },
            {
                name: 'center_lng',
                attributes: {
                    type: Sequelize.FLOAT,
                    allowNull: true,
                    comment: 'Map center longitude'
                }
            },
            {
                name: 'coverage_radius',
                attributes: {
                    type: Sequelize.FLOAT,
                    allowNull: true,
                    comment: 'Coverage radius in km/miles'
                }
            }
        ];

        // Add each column if it doesn't exist
        for (const column of columnsToAdd) {
            try {
                await queryInterface.addColumn('sales_routes', column.name, column.attributes);
                console.log(`✅ Added column: ${column.name}`);
            } catch (error) {
                if (error.message.includes('Duplicate column name')) {
                    console.log(`⏭️  Column ${column.name} already exists, skipping...`);
                } else {
                    throw error;
                }
            }
        }

        // Add indexes for better geographical queries
        try {
            await queryInterface.addIndex('sales_routes', ['center_lat', 'center_lng']);
            console.log('✅ Added index for center_lat, center_lng');
        } catch (error) {
            console.log('⏭️  Index for center_lat, center_lng already exists');
        }
    },

    down: async (queryInterface, Sequelize) => {
        // Remove columns (reverse order)
        const columnsToRemove = [
            'coverage_radius',
            'center_lng',
            'center_lat',
            'postal_code',
            'city',
            'state',
            'country',
            'zoom_level'
        ];

        for (const columnName of columnsToRemove) {
            try {
                await queryInterface.removeColumn('sales_routes', columnName);
                console.log(`✅ Removed column: ${columnName}`);
            } catch (error) {
                console.log(`⚠️  Could not remove column ${columnName}:`, error.message);
            }
        }
    }
};