// Migration script to add initial_stock column to products table
require('dotenv').config();
const { sequelize } = require('../src/core/database/sequelize');

async function runMigration() {
    try {
        console.log('Running migration: Add initial_stock to products table...');

        await sequelize.query(`
            ALTER TABLE products 
            ADD COLUMN initial_stock INT NULL 
            COMMENT 'Initial stock quantity when product was created'
            AFTER stock_quantity;
        `);

        console.log('✅ Migration completed successfully!');
        console.log('Column initial_stock has been added to products table.');

        process.exit(0);
    } catch (error) {
        if (error.message.includes('Duplicate column name')) {
            console.log('⚠️  Column initial_stock already exists. Skipping migration.');
            process.exit(0);
        } else {
            console.error('❌ Migration failed:', error.message);
            process.exit(1);
        }
    }
}

runMigration();
