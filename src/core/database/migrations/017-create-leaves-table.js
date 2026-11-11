/**
 * Migration: Create leaves table
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('leaves', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            staff_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'staffs',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            leave_type: {
                type: Sequelize.ENUM('annual', 'sick', 'unpaid', 'maternity', 'paternity', 'emergency'),
                allowNull: false
            },
            start_date: {
                type: Sequelize.DATEONLY,
                allowNull: false
            },
            end_date: {
                type: Sequelize.DATEONLY,
                allowNull: false
            },
            reason: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            status: {
                type: Sequelize.ENUM('pending', 'approved', 'rejected', 'cancelled'),
                defaultValue: 'pending'
            },
            approved_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'staffs',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            created_by: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            created_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        await queryInterface.addIndex('leaves', ['staff_id']);
        await queryInterface.addIndex('leaves', ['status']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('leaves');
    }
};
