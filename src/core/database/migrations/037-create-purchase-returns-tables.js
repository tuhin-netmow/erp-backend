'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Purchase Returns
        await queryInterface.createTable('purchase_returns', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            return_number: {
                type: Sequelize.STRING(50),
                allowNull: false,
                unique: true
            },
            purchase_order_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'purchase_orders',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            supplier_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'suppliers',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            return_date: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW
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
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW
            }
        });

        // Purchase Return Items
        await queryInterface.createTable('purchase_return_items', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            purchase_return_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'purchase_returns',
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
            unit_cost: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false
            },
            discount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
                defaultValue: 0.00
            },
            tax_amount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
                defaultValue: 0.00
            },
            line_total: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW
            }
        });

        // Purchase Return Invoices
        await queryInterface.createTable('purchase_return_invoices', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            invoice_number: {
                type: Sequelize.STRING(50),
                allowNull: false,
                unique: true
            },
            purchase_return_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'purchase_returns',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            invoice_date: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW
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
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW
            }
        });

        // Purchase Return Payments
        await queryInterface.createTable('purchase_return_payments', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            invoice_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'purchase_return_invoices',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            purchase_return_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'purchase_returns',
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
                defaultValue: Sequelize.NOW
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
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW
            }
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('purchase_return_payments');
        await queryInterface.dropTable('purchase_return_invoices');
        await queryInterface.dropTable('purchase_return_items');
        await queryInterface.dropTable('purchase_returns');
    }
};
