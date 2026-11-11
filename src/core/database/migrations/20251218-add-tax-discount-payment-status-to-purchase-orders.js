/**
 * Migration: Add tax_amount, discount_amount, and payment_status to purchase_orders table
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Add tax_amount column
        try {
            await queryInterface.addColumn('purchase_orders', 'tax_amount', {
                type: Sequelize.DECIMAL(10, 2),
                defaultValue: 0.00,
                after: 'total_amount'
            });
        } catch (error) {
            console.log("Skipping adding 'tax_amount' column:", error.message);
        }

        // Add discount_amount column
        try {
            await queryInterface.addColumn('purchase_orders', 'discount_amount', {
                type: Sequelize.DECIMAL(10, 2),
                defaultValue: 0.00,
                after: 'tax_amount'
            });
        } catch (error) {
            console.log("Skipping adding 'discount_amount' column:", error.message);
        }

        // Add payment_status column
        try {
            await queryInterface.addColumn('purchase_orders', 'payment_status', {
                type: Sequelize.ENUM('unpaid', 'partially_paid', 'paid'),
                defaultValue: 'unpaid',
                after: 'discount_amount'
            });
        } catch (error) {
            console.log("Skipping adding 'payment_status' column:", error.message);
        }
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('purchase_orders', 'tax_amount');
        await queryInterface.removeColumn('purchase_orders', 'discount_amount');
        await queryInterface.removeColumn('purchase_orders', 'payment_status');
    }
};
