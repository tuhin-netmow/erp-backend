const { sequelize } = require('../core/database/sequelize');

async function addPurchaseCostColumn() {
    try {
        console.log('Checking if purchase_cost column exists in order_items table...');

        const [columns] = await sequelize.query(`
            SHOW COLUMNS FROM order_items LIKE 'purchase_cost'
        `);

        if (columns.length === 0) {
            console.log('Column does not exist. Adding purchase_cost column...');
            await sequelize.query(`
                ALTER TABLE order_items 
                ADD COLUMN purchase_cost DECIMAL(10, 2) DEFAULT 0.00 
                COMMENT 'Cost at time of sale for profit calculation'
            `);
            console.log('✅ purchase_cost column added successfully.');
        } else {
            console.log('ℹ️ purchase_cost column already exists. Skipping.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to add purchase_cost column:', error);
        process.exit(1);
    }
}

addPurchaseCostColumn();
