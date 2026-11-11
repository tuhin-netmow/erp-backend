const AccountingService = require('./accounting.service');
const { success, error, successWithPagination } = require('../../core/utils/response');

class AccountingController {

    // --- Transactions (Entry Point) ---
    async createTransaction(req, res) {
        try {
            // req.body should contain { type, amount, payment_mode, ... }
            const result = await AccountingService.processTransaction(req.body);
            return success(res, 'Transaction posted and journalized successfully', result, 201);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }
    async createJournalEntry(req, res) {
        try {
            const journal = await AccountingService.createManualJournal(req.body);
            return success(res, 'Journal Entry created successfully', journal, 201);
        } catch (err) {
            const message = err.errors ? err.errors.map(e => e.message).join(', ') : err.message;
            return error(res, message, 400);
        }
    }


    async getTransactions(req, res) {
        try {
            const { count, rows } = await AccountingService.getTransactions(req.query);
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const pagination = {
                total: count,
                page,
                limit,
                totalPage: Math.ceil(count / limit)
            };
            return successWithPagination(res, 'Transactions retrieved successfully', rows, pagination);
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getExpenses(req, res) {
        try {
            const { count, rows } = await AccountingService.getExpenses(req.query);
            const pagination = {
                total: count,
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                totalPage: Math.ceil(count / (parseInt(req.query.limit) || 10))
            };
            return successWithPagination(res, 'Expenses retrieved successfully', rows, pagination);
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getIncomes(req, res) {
        try {
            const { count, rows } = await AccountingService.getIncomes(req.query);
            const pagination = {
                total: count,
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                totalPage: Math.ceil(count / (parseInt(req.query.limit) || 10))
            };
            return successWithPagination(res, 'Incomes retrieved successfully', rows, pagination);
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    // --- Reports ---
    async getJournalReport(req, res) {
        try {
            const { count, rows } = await AccountingService.getJournalReport(req.query);
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const pagination = {
                total: count,
                page,
                limit,
                totalPage: Math.ceil(count / limit)
            };
            return successWithPagination(res, 'Journal report retrieved successfully', rows, pagination);
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getLedgerReport(req, res) {
        try {
            const { id } = req.params; // Account ID
            const { from, to } = req.query;
            const report = await AccountingService.getLedgerReport(id, { from, to, code: req.query.code });
            return success(res, 'Ledger report retrieved successfully', report);
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getTrialBalance(req, res) {
        try {
            const { date } = req.query;
            const report = await AccountingService.getTrialBalance(date);
            return success(res, 'Trial Balance retrieved successfully', report);
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getProfitAndLoss(req, res) {
        try {
            const { from, to } = req.query;
            const report = await AccountingService.getProfitAndLoss({ from, to });
            return success(res, 'Profit and Loss report retrieved successfully', report);
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getBalanceSheet(req, res) {
        try {
            const { date } = req.query;
            const report = await AccountingService.getBalanceSheet(date);
            return success(res, 'Balance Sheet retrieved successfully', report);
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getProductProfitLoss(req, res) {
        try {
            const { from, to } = req.query;
            const report = await AccountingService.getProductProfitLoss({ from, to });
            return success(res, 'Product Profit and Loss report retrieved successfully', report);
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getIncomeExpenseTrend(req, res) {
        try {
            const days = parseInt(req.query.days) || 30;
            const trend = await AccountingService.getIncomeExpenseTrend(days);
            return success(res, 'Income vs Expense trend retrieved successfully', trend);
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getExpenseBreakdown(req, res) {
        try {
            const { from, to } = req.query;
            const breakdown = await AccountingService.getExpenseBreakdown({ from, to });
            return success(res, 'Expense breakdown retrieved successfully', breakdown);
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getOverview(req, res) {
        try {
            const overview = await AccountingService.getOverview();
            return success(res, 'Financial overview retrieved successfully', overview);
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getRecentActivity(req, res) {
        try {
            const activity = await AccountingService.getRecentActivity();
            // Just return the array directly as 'data' is standard, but user format requests specific structure?
            // User requested: "Recent Activity ...". Let's assume they want the JSON array.
            // The JSON preview showed keys "title", "date", "amount".
            return success(res, 'Recent activity retrieved successfully', activity);
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    // --- Settings / Master Data ---
    async getAccounts(req, res) {
        try {
            const { count, rows } = await AccountingService.getAccounts(req.query);
            const pagination = {
                total: count,
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10
            };
            return successWithPagination(res, 'Chart of Accounts retrieved successfully', rows, pagination);
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getIncomeHeads(req, res) {
        try {
            const accounts = await AccountingService.getIncomeHeads();
            return success(res, 'Income Heads retrieved successfully', accounts);
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getExpenseHeads(req, res) {
        try {
            const accounts = await AccountingService.getExpenseHeads();
            return success(res, 'Expense Heads retrieved successfully', accounts);
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async createIncomeHead(req, res) {
        try {
            const account = await AccountingService.createIncomeHead(req.body);
            return success(res, 'Income Head created successfully', account, 201);
        } catch (err) {
            const message = err.errors ? err.errors.map(e => e.message).join(', ') : err.message;
            return error(res, message, 400);
        }
    }

    async updateIncomeHead(req, res) {
        try {
            const account = await AccountingService.updateIncomeHead(req.params.id, req.body);
            return success(res, 'Income Head updated successfully', account);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }

    async createExpenseHead(req, res) {
        try {
            const account = await AccountingService.createExpenseHead(req.body);
            return success(res, 'Expense Head created successfully', account, 201);
        } catch (err) {
            const message = err.errors ? err.errors.map(e => e.message).join(', ') : err.message;
            return error(res, message, 400);
        }
    }

    async updateExpenseHead(req, res) {
        try {
            const account = await AccountingService.updateExpenseHead(req.params.id, req.body);
            return success(res, 'Expense Head updated successfully', account);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }

    async createHeadWiseExpense(req, res) {
        try {
            const result = await AccountingService.createHeadWiseExpense(req.body);
            return success(res, 'Expense recorded successfully', result, 201);
        } catch (err) {
            const message = err.errors ? err.errors.map(e => e.message).join(', ') : err.message;
            return error(res, message, 400);
        }
    }

    async createHeadWiseIncome(req, res) {
        try {
            const result = await AccountingService.createHeadWiseIncome(req.body);
            return success(res, 'Income recorded successfully', result, 201);
        } catch (err) {
            const message = err.errors ? err.errors.map(e => e.message).join(', ') : err.message;
            return error(res, message, 400);
        }
    }

    async createAccount(req, res) {
        try {
            const account = await AccountingService.createAccount(req.body);
            return success(res, 'Account created successfully', account, 201);
        } catch (err) {
            const message = err.errors ? err.errors.map(e => e.message).join(', ') : err.message;
            return error(res, message, 400);
        }
    }

    async updateAccount(req, res) {
        try {
            const account = await AccountingService.updateAccount(req.params.id, req.body);
            return success(res, 'Account updated successfully', account);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }

    async deleteAccount(req, res) {
        try {
            await AccountingService.deleteAccount(req.params.id);
            return success(res, 'Account deleted successfully', null);
        } catch (err) {
            return error(res, err.message, 404);
        }
    }

    async seedAccounts(req, res) {
        try {
            const result = await AccountingService.seedAccounts();
            return success(res, 'Accounts seeded successfully', result, 201);
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    // --- Chart Data (If needed) ---
    async getChartData(req, res) {
        // Implementation for charts if needed using new tables
        // For now returning basic overview or empty
        return success(res, 'Chart data endpoint pending implementation with new schema', []);
    }

    // --- Tax Submissions ---
    async createTaxSubmission(req, res) {
        try {
            const submission = await AccountingService.createTaxSubmission(req.body);
            return success(res, 'Tax submission recorded successfully', submission, 201);
        } catch (err) {
            const message = err.errors ? err.errors.map(e => e.message).join(', ') : err.message;
            return error(res, message, 400);
        }
    }

    async getAllTaxSubmissions(req, res) {
        try {
            const { count, rows, stats } = await AccountingService.getAllTaxSubmissions(req.query);
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const pagination = {
                total: count,
                page,
                limit,
                totalPage: Math.ceil(count / limit)
            };
            return res.status(200).json({
                status: true,
                message: 'Tax submissions retrieved successfully',
                data: rows,
                pagination,
                stats
            });
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getTaxSubmissionById(req, res) {
        try {
            const submission = await AccountingService.getTaxSubmissionById(req.params.id);
            return success(res, 'Tax submission retrieved successfully', submission);
        } catch (err) {
            return error(res, err.message, 404);
        }
    }

    async updateTaxSubmission(req, res) {
        try {
            const submission = await AccountingService.updateTaxSubmission(req.params.id, req.body);
            return success(res, 'Tax submission updated successfully', submission);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }

    async deleteTaxSubmission(req, res) {
        try {
            await AccountingService.deleteTaxSubmission(req.params.id);
            return success(res, 'Tax submission deleted successfully', null);
        } catch (err) {
            return error(res, err.message, 404);
        }
    }
}

module.exports = new AccountingController();
