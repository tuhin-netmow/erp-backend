const { sequelize } = require('../core/database/sequelize');
const { OrderStaff } = require('../modules/sales/sales.models');

async function syncOrderStaff() {
    try {
        console.log('Syncing order_staff table...');

        // Use sync with alter: true to update the table schema if it exists but is outdated
        // Or force: true to drop and recreate (use with caution in prod)
        // Here we just want to ensure it exists
        await OrderStaff.sync({ alter: true });

        console.log('order_staff table synced successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Failed to sync order_staff table:', error);
        process.exit(1);
    }
}

syncOrderStaff();
