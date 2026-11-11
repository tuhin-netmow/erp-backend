/**
 * Migration: Create credit_heads and debit_heads tables
 * Creates tables for managing chart of accounts
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Create credit_heads table
        await queryInterface.createTable('credit_heads', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            name: {
                type: Sequelize.STRING(255),
                allowNull: false,
                unique: true
            },
            code: {
                type: Sequelize.STRING(50),
                allowNull: true,
                unique: true
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            parent_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'credit_heads',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
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

        // Create debit_heads table
        await queryInterface.createTable('debit_heads', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            name: {
                type: Sequelize.STRING(255),
                allowNull: false,
                unique: true
            },
            code: {
                type: Sequelize.STRING(50),
                allowNull: true,
                unique: true
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            parent_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'debit_heads',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
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
        await queryInterface.addIndex('credit_heads', ['code']);
        await queryInterface.addIndex('credit_heads', ['parent_id']);
        await queryInterface.addIndex('debit_heads', ['code']);
        await queryInterface.addIndex('debit_heads', ['parent_id']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('debit_heads');
        await queryInterface.dropTable('credit_heads');
    }
};
