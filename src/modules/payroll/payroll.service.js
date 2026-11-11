const PayrollRepository = require('./payroll.repository');
const AccountingRepository = require('../accounting/accounting.repository');
const AccountingService = require('../accounting/accounting.service');
const { User: Staff } = require('../users/user.model');
const { sequelize } = require('../../core/database/sequelize');

class PayrollService {
    async getAllRuns(filters = {}, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const result = await PayrollRepository.findAll(filters, limit, offset);
        return {
            data: result.rows,
            total: result.count
        };
    }

    async getRunById(id) {
        const run = await PayrollRepository.findById(id);
        if (!run) {
            throw new Error('Payroll run not found');
        }
        return run;
    }

    async generateRun(month, createdBy, staffIds = null, customAmounts = {}) {
        // 1. Check if run already exists for this month
        const existingRunResult = await PayrollRepository.findAll({ month });
        let run = existingRunResult.count > 0 ? existingRunResult.rows[0] : null;

        // 2. Fetch staff - require specific staffIds to avoid accidental bulk processing
        console.log("Service Received staffIds:", staffIds); // Debug log

        // Handling weird case where staffIds comes as [[7]]
        if (Array.isArray(staffIds) && staffIds.length > 0 && Array.isArray(staffIds[0])) {
            staffIds = staffIds.flat();
            console.log("Flattened staffIds:", staffIds);
        }

        if (!staffIds || !Array.isArray(staffIds) || staffIds.length === 0) {
            throw new Error(`Please select specific employees to process payroll. Received: ${JSON.stringify(staffIds)} (Type: ${typeof staffIds})`);
        }

        let staffs = await Staff.findAll({
            where: {
                id: staffIds,
                status: 'active'
            }
        });

        if (staffs.length === 0) {
            throw new Error('No active staff found for the selected IDs.');
        }

        // 3. If run exists, filter out staff who are already in it
        if (run) {
            const existingFullRun = await PayrollRepository.findById(run.id);
            const existingStaffIds = existingFullRun.items.map(item => item.staff_id);
            staffs = staffs.filter(s => !existingStaffIds.includes(s.id));

            if (staffs.length === 0) {
                throw new Error(`The selected staff is already included in the payroll run for ${month}`);
            }
        }

        let runBatchGross = 0;
        let runBatchNet = 0;

        // 4. Calculate for each staff
        const items = await Promise.all(staffs.map(async (staff) => {
            const structure = await PayrollRepository.getStructure(staff.id);

            const basicSalary = parseFloat(structure?.basic_salary || staff.salary || 0);

            // Clone arrays to safely modify them
            const allowances = structure?.allowances ? [...structure.allowances] : [];
            const deductions = structure?.deductions ? [...structure.deductions] : [];

            let totalAllowances = allowances.reduce((sum, a) => sum + parseFloat(a.amount || 0), 0);
            let totalDeductions = deductions.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);

            let gross = basicSalary + totalAllowances;
            let net = gross - totalDeductions;

            // Handle Custom Net Amount Override
            if (customAmounts[staff.id]) {
                const targetNet = parseFloat(customAmounts[staff.id]);
                const diff = net - targetNet; // Positive = Needs Deduction, Negative = Needs Allowance

                if (diff > 0) {
                    // Current Net is higher than Target -> Add Deduction
                    deductions.push({
                        name: "Manual Adjustment (Deduction)",
                        amount: diff
                    });
                    totalDeductions += diff;
                } else if (diff < 0) {
                    // Current Net is lower than Target -> Add Allowance
                    const allowanceAmount = Math.abs(diff);
                    allowances.push({
                        name: "Manual Adjustment (Allowance)",
                        amount: allowanceAmount
                    });
                    totalAllowances += allowanceAmount;
                }

                // Recalculate derived values
                gross = basicSalary + totalAllowances;
                net = gross - totalDeductions;
            }

            runBatchGross += gross;
            runBatchNet += net;

            return {
                staff_id: staff.id,
                basic_salary: basicSalary,
                allowances: JSON.stringify(allowances),
                deductions: JSON.stringify(deductions),
                total_allowances: totalAllowances,
                total_deductions: totalDeductions,
                gross_salary: gross,
                net_pay: net
            };
        }));

        if (run) {
            // Update existing run totals
            const { PayrollItem } = require('./payroll.models');
            await PayrollItem.bulkCreate(items.map(i => ({ ...i, run_id: run.id })));

            await run.update({
                total_gross: parseFloat(run.total_gross) + runBatchGross,
                total_net: parseFloat(run.total_net) + runBatchNet
            });

            return await PayrollRepository.findById(run.id);
        } else {
            // Create new run
            const runData = {
                month,
                total_gross: runBatchGross,
                total_net: runBatchNet,
                status: 'pending',
                created_by: createdBy
            };

            return await PayrollRepository.createRun(runData, items);
        }
    }

    async approveRun(id) {
        const run = await this.getRunById(id);
        if (run.status !== 'pending') {
            throw new Error('Only pending runs can be approved');
        }
        return await PayrollRepository.updateStatus(id, 'approved');
    }

    async payRun(id) {
        const run = await this.getRunById(id);
        if (run.status === 'paid') {
            throw new Error('Payroll run is already paid');
        }
        if (run.status !== 'approved') {
            throw new Error('Payroll run must be approved before payment');
        }

        const transaction = await sequelize.transaction();
        try {
            // Logic to create daily expense entries
            const paymentDate = new Date();

            // Create a general payroll expense or individual expenses?
            // For now, let's create a single expense transaction for the total net pay
            const journalData = {
                date: paymentDate,
                reference_type: 'PAYROLL',
                reference_id: run.id,
                narration: `Salary payment for month ${run.month}`
            };

            // Use AccountingService to handle the logic
            await AccountingService.processTransaction({
                type: 'PAYROLL',
                amount: run.total_net,
                date: paymentDate,
                description: `Salary payment for month ${run.month}`
            });

            const result = await PayrollRepository.updateStatus(id, 'paid', paymentDate);
            await transaction.commit();
            return result;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async deleteRun(id) {
        const run = await this.getRunById(id);
        if (run.status === 'paid') {
            throw new Error('Cannot delete a paid payroll run');
        }
        return await PayrollRepository.delete(id);
    }

    async getStructure(staffId) {
        return await PayrollRepository.getStructure(staffId);
    }

    async upsertStructure(staffId, data) {
        return await PayrollRepository.upsertStructure(staffId, data);
    }

    // --- Advance Logic ---
    async createAdvance(data) {
        return await PayrollRepository.createAdvance(data);
    }

    async getAllAdvances(filters, page, limit) {
        const offset = (page - 1) * limit;
        const result = await PayrollRepository.findAdvances(filters, limit, offset);
        return {
            data: result.rows,
            pagination: {
                total: result.count,
                page,
                limit,
                totalPage: Math.ceil(result.count / limit)
            }
        };
    }

    async getAdvanceById(id) {
        return await PayrollRepository.findAdvanceById(id);
    }

    async updateAdvance(id, data) {
        return await PayrollRepository.updateAdvance(id, data);
    }

    async deleteAdvance(id) {
        return await PayrollRepository.deleteAdvance(id);
    }

    async processAdvanceReturn(advanceId, data) {
        const advance = await this.getAdvanceById(advanceId);
        if (!advance) throw new Error('Advance not found');

        const amount = parseFloat(data.amount);
        const newReturnedAmount = parseFloat(advance.returned_amount) + amount;

        if (newReturnedAmount > parseFloat(advance.amount)) {
            throw new Error('Returned amount exceeds advance amount');
        }

        const transaction = await sequelize.transaction();
        try {
            const entry = await PayrollRepository.createAdvanceReturn({
                advance_id: advanceId,
                amount: amount,
                return_date: data.return_date,
                remarks: data.remarks
            });

            await advance.update({
                returned_amount: newReturnedAmount,
                status: newReturnedAmount >= parseFloat(advance.amount) ? 'returned' : 'paid'
            }, { transaction });

            // Record in Accounting
            await AccountingService.processTransaction({
                type: 'ADVANCE_RETURN',
                amount: amount,
                date: data.return_date,
                description: `Advance return from staff ID: ${advance.staff_id}`
            });

            await transaction.commit();
            return entry;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async addPayment(itemId, data, userId) {
        const item = await PayrollRepository.findItemById(itemId);
        if (!item) throw new Error('Payroll item not found');

        const amount = parseFloat(data.amount);
        const paidAmount = parseFloat(item.paid_amount || 0);
        const netPay = parseFloat(item.net_pay);

        if (amount <= 0) throw new Error('Payment amount must be positive');
        if (paidAmount + amount > netPay) {
            throw new Error(`Total payment (${paidAmount + amount}) exceeds net pay (${netPay})`);
        }

        const transaction = await sequelize.transaction();
        try {
            const payment = await PayrollRepository.createPayment({
                payroll_item_id: itemId,
                amount: amount,
                payment_date: data.payment_date,
                payment_method: data.payment_method,
                reference: data.reference,
                remarks: data.remarks,
                created_by: userId
            }, { transaction });

            const newPaidAmount = paidAmount + amount;
            let newStatus = 'partial';
            if (newPaidAmount >= netPay - 0.01) { // Float tolerance
                newStatus = 'paid';
            }

            await item.update({
                paid_amount: newPaidAmount,
                payment_status: newStatus
            }, { transaction });

            // Determine Payment Mode for Accounting
            const mode = (data.payment_method && data.payment_method.toLowerCase().includes('bank')) ? 'BANK' : 'CASH';

            // Record Expense in Accounting
            await AccountingService.processTransaction({
                type: 'PAYROLL',
                amount: amount,
                date: data.payment_date,
                payment_mode: mode, // Pass mapped mode
                description: `Salary Payment (Partial) for Staff ID: ${item.staff_id}, Item ID: ${item.id}`,
                reference_id: payment.id
            });

            await transaction.commit();
            return payment;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}

module.exports = new PayrollService();
