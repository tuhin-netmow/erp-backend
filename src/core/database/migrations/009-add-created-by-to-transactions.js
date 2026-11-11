/**
 * Migration: Add created_by to all transaction tables
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const tables = [
            'products',
            'customers',
            'suppliers',
            'orders',
            'invoices',
            'payments',
            'incomes',
            'expenses',
            'payrolls'
        ];

        for (const table of tables) {
            await queryInterface.addColumn(table, 'created_by', {
                type: Sequelize.INTEGER,
                allowNull: true, // Nullable for existing records
                // references: { model: 'users', key: 'id' } // Uncomment if users table exists and you want FK constraint
            });
            await queryInterface.addIndex(table, ['created_by']);
        }
    },

    down: async (queryInterface, Sequelize) => {
        const tables = [
            'products',
            'customers',
            'suppliers',
            'orders',
            'invoices',
            'payments',
            'incomes',
            'expenses',
            'payrolls'
        ];

        for (const table of tables) {
            await queryInterface.removeColumn(table, 'created_by');
        }
    }
};
