/**
 * Migration: Create attendances table
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('attendances', {
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
            date: {
                type: Sequelize.DATEONLY,
                allowNull: false
            },
            check_in: {
                type: Sequelize.TIME,
                allowNull: true
            },
            check_out: {
                type: Sequelize.TIME,
                allowNull: true
            },
            status: {
                type: Sequelize.ENUM('present', 'absent', 'late', 'half_day', 'on_leave'),
                defaultValue: 'present'
            },
            notes: {
                type: Sequelize.TEXT,
                allowNull: true
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

        await queryInterface.addIndex('attendances', ['staff_id', 'date'], { unique: true });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('attendances');
    }
};
