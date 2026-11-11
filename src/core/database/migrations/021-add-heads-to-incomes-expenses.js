/**
 * Migration: Add head foreign keys to incomes and expenses
 * Adds credit_head_id to incomes and debit_head_id to expenses
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Add credit_head_id to incomes table
        await queryInterface.addColumn('incomes', 'credit_head_id', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'credit_heads',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
            after: 'category'
        });

        // Add debit_head_id to expenses table
        await queryInterface.addColumn('expenses', 'debit_head_id', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'debit_heads',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
            after: 'category'
        });

        // Add indexes
        await queryInterface.addIndex('incomes', ['credit_head_id']);
        await queryInterface.addIndex('expenses', ['debit_head_id']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('incomes', 'credit_head_id');
        await queryInterface.removeColumn('expenses', 'debit_head_id');
    }
};
