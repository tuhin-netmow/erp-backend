/**
 * Migration: Create Staffs Table
 * Creates table for staff management
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('staffs', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            first_name: {
                type: Sequelize.STRING(100),
                allowNull: false
            },
            last_name: {
                type: Sequelize.STRING(100),
                allowNull: false
            },
            email: {
                type: Sequelize.STRING(255),
                allowNull: false,
                unique: true
            },
            phone: {
                type: Sequelize.STRING(50),
                allowNull: true
            },
            position: {
                type: Sequelize.STRING(100),
                allowNull: true
            },
            department: {
                type: Sequelize.STRING(100),
                allowNull: true
            },
            hire_date: {
                type: Sequelize.DATEONLY,
                allowNull: true
            },
            salary: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true
            },
            address: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            city: {
                type: Sequelize.STRING(100),
                allowNull: true
            },
            state: {
                type: Sequelize.STRING(100),
                allowNull: true
            },
            country: {
                type: Sequelize.STRING(100),
                allowNull: true
            },
            postal_code: {
                type: Sequelize.STRING(20),
                allowNull: true
            },
            status: {
                type: Sequelize.ENUM('active', 'inactive', 'terminated', 'on_leave'),
                defaultValue: 'active'
            },
            notes: {
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

        // Add indexes
        await queryInterface.addIndex('staffs', ['email'], { unique: true });
        await queryInterface.addIndex('staffs', ['status']);
        await queryInterface.addIndex('staffs', ['department']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('staffs');
    }
};
