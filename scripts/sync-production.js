const { sequelize } = require('../src/core/database/sequelize');
const { Product } = require('../src/modules/products/products.model');
const { BOM, BOMItem, ProductionRun } = require('../src/modules/production/production.models');

(async () => {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Database connected.');

        console.log('Syncing models...');
        // Sync Production Models
        // We use alter: true to update existing tables (add columns) or create new ones
        await BOM.sync({ alter: true });
        await BOMItem.sync({ alter: true });
        await ProductionRun.sync({ alter: true });

        // Sync Product Model (to add product_type column)
        await Product.sync({ alter: true });

        console.log('✅ Tables created/updated successfully!');
    } catch (error) {
        console.error('❌ Error syncing database:', error);
    } finally {
        await sequelize.close();
    }
})();
