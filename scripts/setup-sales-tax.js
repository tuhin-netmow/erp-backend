/**
 * Setup and test sales tax functionality
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

async function setupSalesTax() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected\n');

        // Check current order_items schema
        console.log('📋 order_items table columns (tax-related):');
        const [columns] = await sequelize.query(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME}'
      AND TABLE_NAME = 'order_items'
      ORDER BY ORDINAL_POSITION
    `);
        console.table(columns);

        // Update product 10 to have 10% sales tax
        console.log('\n📝 Setting product 10 sales_tax to 10%...');
        await sequelize.query(`
      UPDATE products 
      SET sales_tax = 10.00 
      WHERE id = 10
    `);
        console.log('✅ Product updated\n');

        // Show updated product
        console.log('📊 Updated product:');
        const [products] = await sequelize.query(`
      SELECT id, name, sku, price, sales_tax
      FROM products
      WHERE id = 10
    `);
        console.table(products);

        // Show sample order data
        console.log('\n📊 Sample order with items (checking tax):');
        const [orders] = await sequelize.query(`
      SELECT 
        o.id, o.order_number, o.total_amount, o.tax_amount, o.discount_amount,
        oi.id as item_id, oi.product_id, oi.quantity, oi.unit_price, 
        oi.discount as item_discount, oi.line_total, oi.tax_amount as item_tax_amount
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = 24
      LIMIT 5
    `);
        console.table(orders);

        console.log('\n✅ Sales tax setup complete!');
        console.log('\n📌 Next steps:');
        console.log('1. Create a new sales order with product 10');
        console.log('2. The tax will be automatically calculated based on:');
        console.log('   - Item line_total (after discount)');
        console.log('   - Product sales_tax percentage');
        console.log('\n💡 Example calculation:');
        console.log('   Product 10: 2 qty × $1000 - $200 discount = $1800');
        console.log('   Tax (10%): $1800 × 10% = $180');
        console.log('   Item tax_amount: $180');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

setupSalesTax();
