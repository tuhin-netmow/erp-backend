/**
 * Migration: Add order column to categories table
 * Adds display order field for sorting categories
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Add order column to categories table
        try {
            await queryInterface.addColumn('categories', 'order', {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment: 'Display order for sorting categories'
            });
            console.log('✅ Added column: order to categories table');
        } catch (error) {
            if (error.message.includes('Duplicate column name')) {
                console.log('⏭️  Column order already exists, skipping...');
            } else {
                throw error;
            }
        }
    },

    down: async (queryInterface, Sequelize) => {
        // Remove order column
        try {
            await queryInterface.removeColumn('categories', 'order');
            console.log('✅ Removed column: order from categories table');
        } catch (error) {
            console.log('⚠️  Could not remove column order:', error.message);
        }
    }
};
