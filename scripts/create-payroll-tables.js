const { PayrollRun, PayrollItem, PayrollAdvance, PayrollAdvanceReturn } = require('../src/modules/payroll/payroll.models');
const { PayrollStructure } = require('../src/modules/payroll/payroll.structure.model');


async function createPayrollTables() {
    try {
        console.log('Creating payroll tables...');

        // Create payroll_structures table
        await PayrollStructure.sync({ alter: true });
        console.log('✓ payroll_structures table created/updated');

        // Create payroll_runs table
        await PayrollRun.sync({ alter: true });
        console.log('✓ payroll_runs table created/updated');

        // Create payroll_items table
        await PayrollItem.sync({ alter: true });
        console.log('✓ payroll_items table created/updated');

        // Create payroll_advances table
        await PayrollAdvance.sync({ alter: true });
        console.log('✓ payroll_advances table created/updated');

        // Create payroll_advance_returns table
        await PayrollAdvanceReturn.sync({ alter: true });
        console.log('✓ payroll_advance_returns table created/updated');

        // Create payroll_advance_returns table
        await PayrollAdvanceReturn.sync({ alter: true });
        console.log('✓ payroll_advance_returns table created/updated');



        console.log('\nAll payroll tables created successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error creating payroll tables:', error);
        process.exit(1);
    }
}

createPayrollTables();
