/**
 * Migration: Add sales_tax_percent to orders table
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Add sales_tax_percent column
        try {
            await queryInterface.addColumn('orders', 'sales_tax_percent', {
                type: Sequelize.DECIMAL(5, 2),
                defaultValue: 0.00,
                after: 'tax_amount'
            });
        } catch (error) {
            console.log("Skipping adding 'sales_tax_percent' column:", error.message);
        }
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('orders', 'sales_tax_percent');
    }
};
