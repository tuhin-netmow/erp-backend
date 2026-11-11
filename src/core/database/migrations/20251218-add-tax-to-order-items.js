/**
 * Migration: Add tax_amount to order_items table
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Add tax_amount column
        try {
            await queryInterface.addColumn('order_items', 'tax_amount', {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
                defaultValue: 0.00,
                after: 'line_total'
            });
        } catch (error) {
            console.log("Skipping adding 'tax_amount' column:", error.message);
        }
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('order_items', 'tax_amount');
    }
};
