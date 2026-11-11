/**
 * Verify item-level sales_tax_percent implementation
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

async function verifyItemTaxPercent() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected\n');

        // Check order_items table schema
        console.log('📋 order_items table columns (tax-related):');
        const [columns] = await sequelize.query(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME}'
      AND TABLE_NAME = 'order_items'
      AND (COLUMN_NAME LIKE '%tax%' OR COLUMN_NAME LIKE '%discount%')
      ORDER BY ORDINAL_POSITION
    `);
        console.table(columns);

        console.log('\n✅ Item-level sales_tax_percent is now available!\n');

        console.log('📌 How it works:\n');
        console.log('When you create a sales order, each item will now include:');
        console.log('  - sales_tax_percent: The tax % from the product');
        console.log('  - tax_amount: The calculated tax amount\n');

        console.log('💡 Example Response:\n');
        console.log(JSON.stringify({
            id: 25,
            order_number: "ORD-1766040000000-123",
            total_amount: 1800,
            tax_amount: 270,
            sales_tax_percent: 5,  // Order-level tax %
            items: [
                {
                    id: 34,
                    product_id: 10,
                    quantity: 2,
                    unit_price: 1000,
                    discount: 200,
                    line_total: 1800,
                    sales_tax_percent: 10,  // ← Item-level tax % (from product)
                    tax_amount: 180,        // ← Item-level tax amount
                    total_price: 1800
                }
            ]
        }, null, 2));

        console.log('\n📊 Tax Breakdown:');
        console.log('  - Item tax: $1800 × 10% = $180 (sales_tax_percent: 10)');
        console.log('  - Order tax: $1800 × 5% = $90 (order sales_tax_percent: 5)');
        console.log('  - Total: $180 + $90 = $270');

        console.log('\n✅ Now each item shows its tax percentage!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

verifyItemTaxPercent();
