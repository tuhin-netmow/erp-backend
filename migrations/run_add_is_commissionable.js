// Migration script to add is_commissionable column to products table
require('dotenv').config();
const { sequelize } = require('../src/core/database/sequelize');

async function runMigration() {
    try {
        console.log('Running migration: Add is_commissionable to products table...');

        await sequelize.query(`
            ALTER TABLE products 
            ADD COLUMN is_commissionable TINYINT(1) NOT NULL DEFAULT 0
            COMMENT 'Whether this product is eligible for sales commission'
            AFTER is_active;
        `);

        console.log('✅ Migration completed successfully!');
        console.log('Column is_commissionable has been added to products table.');
        console.log('All existing products have been set to not eligible (0) by default.');

        process.exit(0);
    } catch (error) {
        if (error.message.includes('Duplicate column name')) {
            console.log('⚠️  Column is_commissionable already exists. Setting default to 0 and updating existing products to 0...');
            try {
                await sequelize.query(`
                    ALTER TABLE products 
                    MODIFY COLUMN is_commissionable TINYINT(1) NOT NULL DEFAULT 0 
                    COMMENT 'Whether this product is eligible for sales commission';
                `);
                await sequelize.query(`
                    UPDATE products SET is_commissionable = 0;
                `);
                console.log('✅ Updated database default and existing products successfully.');
                process.exit(0);
            } catch (err) {
                console.error('❌ Failed to update existing column/records:', err.message);
                process.exit(1);
            }
        } else {
            console.error('❌ Migration failed:', error.message);
            process.exit(1);
        }
    }
}

runMigration();
