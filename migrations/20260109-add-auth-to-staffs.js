const { DataTypes } = require('sequelize');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Add password and role_id columns to staffs table
        await queryInterface.addColumn('staffs', 'password', {
            type: DataTypes.STRING(255),
            allowNull: true,
            comment: 'Hashed password for authentication. Null if staff member has no login access.',
            after: 'email'
        });

        await queryInterface.addColumn('staffs', 'role_id', {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Role ID for permissions. Null if staff member has no login access.',
            after: 'password',
            references: {
                model: 'roles',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        });

        console.log('✅ Added password and role_id columns to staffs table');
    },

    down: async (queryInterface, Sequelize) => {
        // Remove the columns if rolling back
        await queryInterface.removeColumn('staffs', 'role_id');
        await queryInterface.removeColumn('staffs', 'password');

        console.log('✅ Removed password and role_id columns from staffs table');
    }
};
