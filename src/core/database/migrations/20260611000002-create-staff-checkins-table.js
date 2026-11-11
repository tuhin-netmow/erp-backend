/**
 * Migration: Create staff_checkins table
 * Creates table for staff customer visit check-ins with GPS tracking
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('staff_checkins', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            customer_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                comment: 'Customer being visited',
                references: {
                    model: 'customers',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            staff_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                comment: 'Staff member checking in',
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            check_in_time: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            latitude: {
                type: Sequelize.DECIMAL(10, 8),
                allowNull: true,
                comment: 'GPS latitude coordinate'
            },
            longitude: {
                type: Sequelize.DECIMAL(11, 8),
                allowNull: true,
                comment: 'GPS longitude coordinate'
            },
            distance_meters: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
                comment: 'Distance from customer location in meters'
            },
            note: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            created_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
            }
        });

        // Add indexes for better query performance
        await queryInterface.addIndex('staff_checkins', ['customer_id']);
        await queryInterface.addIndex('staff_checkins', ['staff_id']);
        await queryInterface.addIndex('staff_checkins', ['check_in_time']);
        await queryInterface.addIndex('staff_checkins', ['staff_id', 'check_in_time']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('staff_checkins');
    }
};