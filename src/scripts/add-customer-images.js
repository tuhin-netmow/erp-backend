const { Customer } = require('../modules/customers/customers.model');
const { DataTypes } = require('sequelize');
const { sequelize } = require('../core/database/sequelize');

// Add image_url to Customer model if it doesn't exist
// Doing this via a migration script essentially
async function runMigration() {
    try {
        console.log('Starting migration to add image fields to customers...');

        // 1. Add image_url to customers table
        const tableInfo = await sequelize.getQueryInterface().describeTable('customers');
        if (!tableInfo.image_url) {
            console.log('Adding image_url column to customers table...');
            await sequelize.getQueryInterface().addColumn('customers', 'image_url', {
                type: DataTypes.STRING(500),
                allowNull: true
            });
            console.log('Added image_url column.');
        } else {
            console.log('image_url column already exists.');
        }

        // 2. Create customer_images table for gallery
        // This effectively manually creating the table if it doesn't exist from the model definition logic
        // But since we are likely using Sequelize sync or migrations, I will create a script that ensures it exists.
        // Actually, I should define the model in customers.model.js and let Sequelize sync (if configured) or run this script.

        console.log('Checking customer_images table...');

        // Define the table structure for the query interface
        await sequelize.getQueryInterface().createTable('customer_images', {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            customer_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'customers',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            image_url: {
                type: DataTypes.STRING(500),
                allowNull: false
            },
            is_primary: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            sort_order: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            },
            caption: {
                type: DataTypes.STRING(255),
                allowNull: true
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW
            },
            updated_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW
            }
        });

        console.log('Migration completed successfully.');
    } catch (error) {
        // If table already exists, it might throw, which is fine
        if (error.original && error.original.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log('customer_images table already exists.');
        } else {
            console.error('Migration failed:', error);
        }
    }
}

// Execute
runMigration().then(() => {
    process.exit(0);
});
