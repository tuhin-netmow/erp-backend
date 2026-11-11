// Migration script to add discount column to purchase_order_items table
require('dotenv').config();
const { sequelize } = require('../src/core/database/sequelize');

async function runMigration() {
    try {
        console.log('Running migration: Add discount to purchase_order_items table...');

        await sequelize.query(`
            ALTER TABLE purchase_order_items 
            ADD COLUMN discount DECIMAL(10, 2) DEFAULT 0.00
            COMMENT 'Discount amount for the item'
            AFTER unit_cost;
        `);

        console.log('✅ Migration completed successfully!');
        console.log('Column discount has been added to purchase_order_items table.');

        process.exit(0);
    } catch (error) {
        if (error.message.includes('Duplicate column name')) {
            console.log('⚠️  Column discount already exists. Skipping migration.');
            process.exit(0);
        } else {
            console.error('❌ Migration failed:', error.message);
            process.exit(1);
        }
    }
}

runMigration();
