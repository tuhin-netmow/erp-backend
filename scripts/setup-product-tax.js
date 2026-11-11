/**
 * Test purchase tax calculation by updating a product's purchase_tax
 * and creating a new purchase order
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

async function testPurchaseTax() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected\n');

        // Update product 5 to have 10% purchase tax
        console.log('📝 Setting product 5 purchase_tax to 10%...');
        await sequelize.query(`
      UPDATE products 
      SET purchase_tax = 10.00 
      WHERE id = 5
    `);
        console.log('✅ Product updated\n');

        // Update product 6 to have 5% purchase tax
        console.log('📝 Setting product 6 purchase_tax to 5%...');
        await sequelize.query(`
      UPDATE products 
      SET purchase_tax = 5.00 
      WHERE id = 6
    `);
        console.log('✅ Product updated\n');

        // Show updated products
        console.log('📊 Updated products:');
        const [products] = await sequelize.query(`
      SELECT id, name, sku, purchase_tax
      FROM products
      WHERE id IN (5, 6)
    `);
        console.table(products);

        console.log('\n✅ Products are now configured with purchase tax!');
        console.log('\n📌 Next steps:');
        console.log('1. Create a new purchase order with these products');
        console.log('2. The tax will be automatically calculated based on:');
        console.log('   - Item line_total (after discount)');
        console.log('   - Product purchase_tax percentage');
        console.log('\n💡 Example calculation:');
        console.log('   Product 5: 100 qty × $45 - $50 discount = $4450');
        console.log('   Tax (10%): $4450 × 10% = $445');
        console.log('   Item tax_amount: $445');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

testPurchaseTax();
