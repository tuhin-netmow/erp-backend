/**
 * Migration: Create Suppliers Table
 * Creates table for supplier management
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('suppliers', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            name: {
                type: Sequelize.STRING(255),
                allowNull: false
            },
            contact_person: {
                type: Sequelize.STRING(255),
                allowNull: true
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
            tax_id: {
                type: Sequelize.STRING(100),
                allowNull: true
            },
            website: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            payment_terms: {
                type: Sequelize.STRING(100),
                allowNull: true
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
        await queryInterface.addIndex('suppliers', ['email'], { unique: true });
        await queryInterface.addIndex('suppliers', ['is_active']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('suppliers');
    }
};
