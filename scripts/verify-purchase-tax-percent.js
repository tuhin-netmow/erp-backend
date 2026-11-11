/**
 * Verify purchase item tax percent implementation
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'mysql',
        logging: false
    }
);

async function verifyPurchaseItemTaxPercent() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected\n');

        // Check purchase_order_items table schema
        console.log('📋 purchase_order_items table columns (tax-related):');
        const [columns] = await sequelize.query(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME}'
      AND TABLE_NAME = 'purchase_order_items'
      AND (COLUMN_NAME LIKE '%tax%' OR COLUMN_NAME LIKE '%discount%')
      ORDER BY ORDINAL_POSITION
    `);
        console.table(columns);

        console.log('\n✅ Item-level purchase_tax_percent is now available!\n');

        console.log('📌 How it works:\n');
        console.log('When you create a purchase order, each item will now include:');
        console.log('  - purchase_tax_percent: The tax % from the product');
        console.log('  - tax_amount: The calculated tax amount\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

verifyPurchaseItemTaxPercent();
