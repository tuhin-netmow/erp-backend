/**
 * Migration: Create departments table
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('departments', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            name: {
                type: Sequelize.STRING(100),
                allowNull: false,
                unique: true
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            manager_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'staffs',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            created_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('departments');
    }
};
