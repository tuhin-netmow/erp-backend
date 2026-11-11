/**
 * Migration: Create deleted_histories table
 * Storing complete backup of deleted records for future restore or references
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('deleted_histories', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            record_type: {
                type: Sequelize.STRING(100),
                allowNull: false
            },
            record_id: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            identifier: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            data: {
                type: Sequelize.JSON,
                allowNull: false
            },
            deleted_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'users',
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

        // Add indexes for performance
        await queryInterface.addIndex('deleted_histories', ['record_type', 'record_id']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('deleted_histories');
    }
};
