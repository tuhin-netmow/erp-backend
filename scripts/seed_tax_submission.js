const AccountingService = require('../src/modules/accounting/accounting.service');
const { sequelize } = require('../src/core/database/sequelize');

async function seedTax() {
    try {
        const data = {
            tax_type: 'VAT',
            period_start: '2026-01-01',
            period_end: '2026-01-31',
            amount: 500,
            submission_date: '2026-02-15',
            reference_number: 'VAT-JAN-2026',
            status: 'SUBMITTED',
            notes: 'Initial test submission'
        };

        // Using service so it triggered accounting as well
        const submission = await AccountingService.createTaxSubmission(data);
        console.log('Seed Tax Submission created:', submission.toJSON());

    } catch (err) {
        console.error('Seed failed:', err);
    } finally {
        await sequelize.close();
    }
}

seedTax();
