/**
 * Migration: Change department string to department_id foreign key
 * Converts the department column from STRING to department_id INTEGER with FK
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // First, drop the old department column
        await queryInterface.removeColumn('staffs', 'department');

        // Add the new department_id column with foreign key
        await queryInterface.addColumn('staffs', 'department_id', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'departments',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
            after: 'position'
        });

        // Add index for better query performance
        await queryInterface.addIndex('staffs', ['department_id']);
    },

    down: async (queryInterface, Sequelize) => {
        // Remove the foreign key column
        await queryInterface.removeColumn('staffs', 'department_id');

        // Restore the old department string column
        await queryInterface.addColumn('staffs', 'department', {
            type: Sequelize.STRING(100),
            allowNull: true,
            after: 'position'
        });
    }
};
