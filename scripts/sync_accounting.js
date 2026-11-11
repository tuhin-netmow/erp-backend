const { TaxSubmission, Account, Transaction, Journal, JournalLine } = require('../src/modules/accounting/accounting.models');
const { sequelize } = require('../src/core/database/sequelize');

async function syncModels() {
    try {
        // Sync specifically the accounting models to ensure tables exist
        await Account.sync();
        await Transaction.sync();
        await Journal.sync();
        await JournalLine.sync();
        await TaxSubmission.sync();

        console.log('Accounting tables synced successfully.');

        // Check if table exists now
        const count = await TaxSubmission.count();
        console.log(`Current TaxSubmissions: ${count}`);

    } catch (err) {
        console.error('Sync failed:', err);
    } finally {
        await sequelize.close();
    }
}

syncModels();
