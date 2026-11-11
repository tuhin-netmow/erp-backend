const { sequelize } = require('../core/database/sequelize');
const AccountingService = require('../modules/accounting/accounting.service');
const { Account, Transaction, Journal, JournalLine } = require('../modules/accounting/accounting.models');

async function seedAccounting() {
    try {
        console.log('🔄 Authenticating Database...');
        await sequelize.authenticate();
        console.log('✅ Database Connected.');

        console.log('🔄 Syncing Accounting Tables...');
        // Force: false ensures we don't wipe data, alter: true updates schema if needed
        await Account.sync({ alter: true });
        await Transaction.sync({ alter: true });
        await Journal.sync({ alter: true });
        await JournalLine.sync({ alter: true });
        console.log('✅ Tables Synced.');

        console.log('🌱 Seeding Chart of Accounts...');
        const accounts = await AccountingService.seedAccounts();
        console.log(`✅ Seeded ${accounts.length} accounts.`);

        console.log('🚀 Accounting Setup Complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during seeding:', error);
        process.exit(1);
    }
}

seedAccounting();
