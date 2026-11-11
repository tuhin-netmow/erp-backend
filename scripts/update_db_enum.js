const { sequelize } = require('../src/core/database/sequelize');

async function updateEnum() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Connected successfully.');

        console.log('Updating orders table status ENUM...');

        // Raw SQL to update the enum definition
        await sequelize.query(`
            ALTER TABLE orders 
            MODIFY COLUMN status ENUM(
                'pending', 
                'confirmed', 
                'processing', 
                'shipped', 
                'in_transit', 
                'delivered', 
                'cancelled', 
                'returned', 
                'failed'
            ) DEFAULT 'pending';
        `);

        console.log('✅ Successfully updated orders status ENUM to include returned and failed.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error updating database:', error);
        process.exit(1);
    }
}

updateEnum();
