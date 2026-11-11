'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // 1. sales_returns table
        await queryInterface.createTable('sales_returns', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            return_number: {
                type: Sequelize.STRING(50),
                allowNull: false,
                unique: true
            },
            order_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'orders',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            customer_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'customers',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            return_date: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            status: {
                type: Sequelize.ENUM('pending', 'approved', 'returned', 'cancelled'),
                defaultValue: 'pending'
            },
            total_amount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0.00
            },
            tax_amount: {
                type: Sequelize.DECIMAL(10, 2),
                defaultValue: 0.00
            },
            discount_amount: {
                type: Sequelize.DECIMAL(10, 2),
                defaultValue: 0.00
            },
            grand_total: {
                type: Sequelize.DECIMAL(10, 2),
                defaultValue: 0.00
            },
            payment_status: {
                type: Sequelize.ENUM('pending', 'partial', 'refunded'),
                defaultValue: 'pending'
            },
            notes: {
                type: Sequelize.TEXT,
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
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        // 2. sales_return_items table
        await queryInterface.createTable('sales_return_items', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            sales_return_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'sales_returns',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            product_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'products',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            quantity: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 1
            },
            unit_price: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false
            },
            discount: {
                type: Sequelize.DECIMAL(10, 2),
                defaultValue: 0.00
            },
            tax_amount: {
                type: Sequelize.DECIMAL(10, 2),
                defaultValue: 0.00
            },
            line_total: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        // 3. sales_return_invoices table
        await queryInterface.createTable('sales_return_invoices', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            invoice_number: {
                type: Sequelize.STRING(50),
                allowNull: false,
                unique: true
            },
            sales_return_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'sales_returns',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            invoice_date: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            total_amount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false
            },
            status: {
                type: Sequelize.ENUM('draft', 'issued', 'refunded', 'cancelled'),
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
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        // 4. sales_return_payments table
        await queryInterface.createTable('sales_return_payments', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            invoice_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'sales_return_invoices',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            sales_return_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'sales_returns',
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
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('sales_return_payments');
        await queryInterface.dropTable('sales_return_invoices');
        await queryInterface.dropTable('sales_return_items');
        await queryInterface.dropTable('sales_returns');
    }
};
