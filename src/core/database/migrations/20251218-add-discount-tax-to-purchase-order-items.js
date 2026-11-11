/**
 * Migration: Add discount and tax_amount to purchase_order_items table
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Add discount column
        try {
            await queryInterface.addColumn('purchase_order_items', 'discount', {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
                defaultValue: 0.00,
                after: 'unit_cost'
            });
        } catch (error) {
            console.log("Skipping adding 'discount' column (likely already exists):", error.message);
        }

        // Add tax_amount column
        try {
            await queryInterface.addColumn('purchase_order_items', 'tax_amount', {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
                defaultValue: 0.00,
                after: 'line_total'
            });
        } catch (error) {
            console.log("Skipping adding 'tax_amount' column (likely already exists):", error.message);
        }
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('purchase_order_items', 'discount');
        await queryInterface.removeColumn('purchase_order_items', 'tax_amount');
    }
};
