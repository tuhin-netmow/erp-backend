/**
 * Migration: Create Customers Table
 * Creates table for customer management with location tracking
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('customers', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            name: {
                type: Sequelize.STRING(255),
                allowNull: false
            },
            email: {
                type: Sequelize.STRING(255),
                allowNull: true,
                unique: true
            },
            phone: {
                type: Sequelize.STRING(50),
                allowNull: true
            },
            company: {
                type: Sequelize.STRING(255),
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
            latitude: {
                type: Sequelize.DECIMAL(10, 8),
                allowNull: true
            },
            longitude: {
                type: Sequelize.DECIMAL(11, 8),
                allowNull: true
            },
            tax_id: {
                type: Sequelize.STRING(100),
                allowNull: true
            },
            credit_limit: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
                defaultValue: 0.00
            },
            outstanding_balance: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
                defaultValue: 0.00
            },
            customer_type: {
                type: Sequelize.ENUM('individual', 'business'),
                defaultValue: 'individual'
            },
            notes: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
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
        try { await queryInterface.addIndex('customers', ['email'], { unique: true }); } catch (e) {}
        try { await queryInterface.addIndex('customers', ['customer_type']); } catch (e) {}
        try { await queryInterface.addIndex('customers', ['is_active']); } catch (e) {}
        try { await queryInterface.addIndex('customers', ['latitude', 'longitude']); } catch (e) {}
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('customers');
    }
};
