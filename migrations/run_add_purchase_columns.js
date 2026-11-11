// Migration script to add missing columns to purchase_orders table
require('dotenv').config();
const { sequelize } = require('../src/core/database/sequelize');

async function runMigration() {
    try {
        console.log('Running migration: Add columns to purchase_orders table...');

        // Add tax_amount column
        await sequelize.query(`
            ALTER TABLE purchase_orders 
            ADD COLUMN tax_amount DECIMAL(10, 2) DEFAULT 0.00
            COMMENT 'Tax amount for the purchase order'
            AFTER total_amount;
        `).catch(err => {
            if (!err.message.includes('Duplicate column name')) throw err;
            console.log('  - tax_amount already exists, skipping');
        });

        // Add discount_amount column
        await sequelize.query(`
            ALTER TABLE purchase_orders 
            ADD COLUMN discount_amount DECIMAL(10, 2) DEFAULT 0.00
            COMMENT 'Discount amount for the purchase order'
            AFTER tax_amount;
        `).catch(err => {
            if (!err.message.includes('Duplicate column name')) throw err;
            console.log('  - discount_amount already exists, skipping');
        });

        // Add payment_status column
        await sequelize.query(`
            ALTER TABLE purchase_orders 
            ADD COLUMN payment_status ENUM('unpaid', 'partially_paid', 'paid') DEFAULT 'unpaid'
            COMMENT 'Payment status of the purchase order'
            AFTER discount_amount;
        `).catch(err => {
            if (!err.message.includes('Duplicate column name')) throw err;
            console.log('  - payment_status already exists, skipping');
        });

        console.log('✅ Migration completed successfully!');
        console.log('Columns added to purchase_orders table:');
        console.log('  - tax_amount');
        console.log('  - discount_amount');
        console.log('  - payment_status');

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

runMigration();
