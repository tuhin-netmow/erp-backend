/**
 * Migration: Create purchase invoices, payments, and receipts tables
 * Creates tables for managing purchase invoices, payments, and receipts
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Create purchase_invoices table
        await queryInterface.createTable('purchase_invoices', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            invoice_number: {
                type: Sequelize.STRING(50),
                allowNull: false,
                unique: true
            },
            purchase_order_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'purchase_orders',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            invoice_date: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            due_date: {
                type: Sequelize.DATEONLY,
                allowNull: true
            },
            total_amount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false
            },
            status: {
                type: Sequelize.ENUM('draft', 'received', 'paid', 'overdue', 'cancelled'),
                defaultValue: 'draft'
            },
            created_by: {
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
            },
            updated_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
            }
        });

        // Create purchase_payments table
        await queryInterface.createTable('purchase_payments', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            invoice_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'purchase_invoices',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            purchase_order_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'purchase_orders',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            amount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false
            },
            payment_date: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            payment_method: {
                type: Sequelize.STRING(50),
                allowNull: false
            },
            reference_number: {
                type: Sequelize.STRING(100),
                allowNull: true
            },
            status: {
                type: Sequelize.ENUM('pending', 'completed', 'failed'),
                defaultValue: 'pending'
            },
            created_by: {
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
            },
            updated_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
            }
        });

        // Create purchase_receipts table
        await queryInterface.createTable('purchase_receipts', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            receipt_number: {
                type: Sequelize.STRING(50),
                allowNull: false,
                unique: true
            },
            purchase_order_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'purchase_orders',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            receipt_date: {
                type: Sequelize.DATEONLY,
                allowNull: true
            },
            received_by: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            status: {
                type: Sequelize.ENUM('pending', 'partial', 'completed', 'rejected'),
                defaultValue: 'pending'
            },
            notes: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            received_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            created_by: {
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
            },
            updated_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
            }
        });

        // Add indexes for better query performance
        await queryInterface.addIndex('purchase_invoices', ['purchase_order_id']);
        await queryInterface.addIndex('purchase_invoices', ['invoice_number']);
        await queryInterface.addIndex('purchase_invoices', ['status']);

        await queryInterface.addIndex('purchase_payments', ['purchase_order_id']);
        await queryInterface.addIndex('purchase_payments', ['invoice_id']);
        await queryInterface.addIndex('purchase_payments', ['status']);

        await queryInterface.addIndex('purchase_receipts', ['purchase_order_id']);
        await queryInterface.addIndex('purchase_receipts', ['receipt_number']);
        await queryInterface.addIndex('purchase_receipts', ['status']);

        console.log('✅ Created purchase invoices, payments, and receipts tables');
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('purchase_receipts');
        await queryInterface.dropTable('purchase_payments');
        await queryInterface.dropTable('purchase_invoices');
    }
};