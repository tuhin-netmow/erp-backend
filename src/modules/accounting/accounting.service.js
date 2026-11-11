const AccountingRepository = require('./accounting.repository');
const { sequelize } = require('../../core/database/sequelize');

// Account Code Mapping (Hardcoded for this MVP based on MD)
// In a real app, these would be fetched from DB or config
const ACCOUNTS = {
    CASH: '1000',
    BANK: '1100',
    AR: '1200', // Accounts Receivable
    INVENTORY: '1300',
    AP: '2000', // Accounts Payable
    OWNER_CAPITAL: '3000',
    SALES: '4000',
    OTHER_INCOME: '4100',
    PURCHASE: '5000',
    SALES_RETURN: '5100',
    OFFICE_EXPENSE: '5200',
    PURCHASE_RETURN: '5400',
    EMPLOYEE_ADVANCE: '1400',
    SALARY: '5500',
    TAX_PAYABLE: '2100',
    TAX_EXPENSE: '5600'
};



class AccountingService {

    // Helper to get Account ID by Code
    async getAccountId(code) {
        const account = await AccountingRepository.findAccountByCode(code);
        if (!account) throw new Error(`Account with code ${code} not found. Please Seed Accounts.`);
        return account.id;
    }

    // --- Core Transaction Processing ---
    async processTransaction(data, existingTransaction = null) {
        const runWork = async (t) => {
            // Debug Logs
            console.log(`[AccountingService] Processing ${data.type} Transaction. Payment Mode: ${data.payment_mode}`);

            // 1. Create the Single Entry Transaction
            const transaction = await AccountingRepository.createTransaction(data, t);

            // 2. Journal Logic
            const amount = parseFloat(data.amount);
            const tax_amount = parseFloat(data.tax_amount || 0);
            const narration = data.description || `${data.type} Transaction`;
            const linesData = [];

            switch (data.type) {
                case 'SALES': {
                    // Dr Cash/Bank/AR (Full Amount)
                    const drCode = (data.payment_mode === 'CASH') ? ACCOUNTS.CASH :
                        (data.payment_mode === 'BANK') ? ACCOUNTS.BANK : ACCOUNTS.AR;
                    linesData.push({ account_id: await this.getAccountId(drCode), debit: amount, credit: 0 });

                    // Cr Sales (Amount - Tax)
                    const subtotal = amount - tax_amount;
                    linesData.push({ account_id: await this.getAccountId(ACCOUNTS.SALES), debit: 0, credit: subtotal });

                    // Cr Tax Payable (Tax)
                    if (tax_amount > 0) {
                        linesData.push({ account_id: await this.getAccountId(ACCOUNTS.TAX_PAYABLE), debit: 0, credit: tax_amount });
                    }
                    break;
                }

                case 'PURCHASE': {
                    // Dr Purchase (Amount - Tax)
                    const subtotal = amount - tax_amount;
                    linesData.push({ account_id: await this.getAccountId(ACCOUNTS.PURCHASE), debit: subtotal, credit: 0 });

                    // Dr Tax (Recoverable/Paid) - using TAX_PAYABLE as contra-liability or clearing
                    if (tax_amount > 0) {
                        linesData.push({ account_id: await this.getAccountId(ACCOUNTS.TAX_PAYABLE), debit: tax_amount, credit: 0 });
                    }

                    // Cr Cash/Bank/AP (Full Amount)
                    const crCode = (data.payment_mode === 'CASH') ? ACCOUNTS.CASH :
                        (data.payment_mode === 'BANK') ? ACCOUNTS.BANK : ACCOUNTS.AP;
                    linesData.push({ account_id: await this.getAccountId(crCode), debit: 0, credit: amount });
                    break;
                }

                case 'SALES_RETURN': {
                    // Dr Sales Return
                    linesData.push({ account_id: await this.getAccountId(ACCOUNTS.SALES_RETURN), debit: amount, credit: 0 });
                    // Cr Cash or AR
                    const crCode = (data.payment_mode === 'CASH') ? ACCOUNTS.CASH : ACCOUNTS.AR;
                    linesData.push({ account_id: await this.getAccountId(crCode), debit: 0, credit: amount });
                    break;
                }

                case 'PURCHASE_RETURN': {
                    // Dr Cash or AP
                    const drCode = (data.payment_mode === 'CASH') ? ACCOUNTS.CASH : ACCOUNTS.AP;
                    linesData.push({ account_id: await this.getAccountId(drCode), debit: amount, credit: 0 });
                    // Cr Purchase Return
                    linesData.push({ account_id: await this.getAccountId(ACCOUNTS.PURCHASE_RETURN), debit: 0, credit: amount });
                    break;
                }

                case 'EXPENSE': {
                    // Dr Expense Category
                    linesData.push({ account_id: await this.getAccountId(ACCOUNTS.OFFICE_EXPENSE), debit: amount, credit: 0 });
                    // Cr Cash
                    linesData.push({ account_id: await this.getAccountId(ACCOUNTS.CASH), debit: 0, credit: amount });
                    break;
                }

                case 'INCOME': {
                    // Dr Cash
                    linesData.push({ account_id: await this.getAccountId(ACCOUNTS.CASH), debit: amount, credit: 0 });
                    // Cr Other Income
                    linesData.push({ account_id: await this.getAccountId(ACCOUNTS.OTHER_INCOME), debit: 0, credit: amount });
                    break;
                }

                case 'BANK_DEPOSIT': {
                    // Dr Bank, Cr Cash
                    linesData.push({ account_id: await this.getAccountId(ACCOUNTS.BANK), debit: amount, credit: 0 });
                    linesData.push({ account_id: await this.getAccountId(ACCOUNTS.CASH), debit: 0, credit: amount });
                    break;
                }

                case 'PAYMENT_OUT': {
                    // Dr AP, Cr Cash/Bank
                    linesData.push({ account_id: await this.getAccountId(ACCOUNTS.AP), debit: amount, credit: 0 });
                    const crCode = (data.payment_mode === 'BANK') ? ACCOUNTS.BANK : ACCOUNTS.CASH;
                    linesData.push({ account_id: await this.getAccountId(crCode), debit: 0, credit: amount });
                    break;
                }

                case 'PAYMENT_IN': {
                    // Dr Cash/Bank, Cr AR
                    const drCode = (data.payment_mode === 'BANK') ? ACCOUNTS.BANK : ACCOUNTS.CASH;
                    linesData.push({ account_id: await this.getAccountId(drCode), debit: amount, credit: 0 });
                    linesData.push({ account_id: await this.getAccountId(ACCOUNTS.AR), debit: 0, credit: amount });
                    break;
                }

                case 'REFUND_PAYMENT': {
                    // Refund to Customer: Dr AR, Cr Cash/Bank
                    // (Reverses PAYMENT_IN)
                    linesData.push({ account_id: await this.getAccountId(ACCOUNTS.AR), debit: amount, credit: 0 });
                    const crCode = (data.payment_mode === 'BANK') ? ACCOUNTS.BANK : ACCOUNTS.CASH;
                    linesData.push({ account_id: await this.getAccountId(crCode), debit: 0, credit: amount });
                    break;
                }

                case 'EMPLOYEE_ADVANCE': {
                    linesData.push({ account_id: await this.getAccountId(ACCOUNTS.EMPLOYEE_ADVANCE), debit: amount, credit: 0 });
                    linesData.push({ account_id: await this.getAccountId(ACCOUNTS.CASH), debit: 0, credit: amount });
                    break;
                }

                case 'ADVANCE_RETURN': {
                    linesData.push({ account_id: await this.getAccountId(ACCOUNTS.CASH), debit: amount, credit: 0 });
                    linesData.push({ account_id: await this.getAccountId(ACCOUNTS.EMPLOYEE_ADVANCE), debit: 0, credit: amount });
                    break;
                }

                case 'PAYROLL': {
                    linesData.push({ account_id: await this.getAccountId(ACCOUNTS.SALARY), debit: amount, credit: 0 });
                    const crCode = (data.payment_mode === 'BANK') ? ACCOUNTS.BANK : ACCOUNTS.CASH;
                    linesData.push({ account_id: await this.getAccountId(crCode), debit: 0, credit: amount });
                    break;
                }

                case 'TAX_SUBMISSION': {
                    linesData.push({ account_id: await this.getAccountId(ACCOUNTS.TAX_PAYABLE), debit: amount, credit: 0 });
                    const pMode = String(data.payment_mode || '').toUpperCase();
                    const crCode = (pMode === 'CASH') ? ACCOUNTS.CASH : ACCOUNTS.BANK;
                    linesData.push({ account_id: await this.getAccountId(crCode), debit: 0, credit: amount });
                    break;
                }

                default:
                    throw new Error(`Unknown Transaction Type: ${data.type}`);
            }

            // 3. Prepare Journal Entries
            const journalData = {
                date: data.date || new Date(),
                reference_type: 'TRANSACTION',
                reference_id: transaction.id,
                narration: narration
            };

            const journal = await AccountingRepository.createJournalEntry(journalData, linesData, t);

            return { transaction, journal };
        };

        if (existingTransaction) {
            return await runWork(existingTransaction);
        }
        return await sequelize.transaction(runWork);
    }

    // --- Reports ---
    async getJournalReport(query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 20;
        const offset = (page - 1) * limit;

        const filters = {
            from: query.from,
            to: query.to
        };

        return await AccountingRepository.getJournalReport(filters, limit, offset);
    }

    async getTransactions(query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 20;
        const offset = (page - 1) * limit;

        const filters = {
            from: query.from,
            to: query.to,
            date: query.date,
            start_date: query.start_date,
            end_date: query.end_date,
            type: query.type
        };

        return await AccountingRepository.findAllTransactions(filters, limit, offset);
    }

    async getLedgerReport(accountId, filters) {
        // Calculate running balance in Service or Repo? 
        // Repo returns { openingBalance, lines }
        const { openingBalance, lines } = await AccountingRepository.getLedgerReport(accountId, filters);

        // Transform to add running balance
        let currentBalance = openingBalance;
        const account = await AccountingRepository.findAccountById(accountId);
        if (!account) throw new Error('Account not found');
        // Actually we need to fetch account details if we didn't pass it. 
        // Repo already handled account finding internally? No, Repo takes ID.
        // Let's assume we know nature for now.

        const isDebitNature = ['ASSET', 'EXPENSE'].includes(account.type);

        const enhancedLines = lines.map(line => {
            const dr = parseFloat(line.debit);
            const cr = parseFloat(line.credit);

            if (isDebitNature) {
                currentBalance += (dr - cr);
            } else {
                currentBalance += (cr - dr);
            }

            return {
                date: line.Journal.date,
                narration: line.Journal.narration,
                debit: dr,
                credit: cr,
                balance: currentBalance,
                type: line.Journal.reference_type
            };
        });

        return {
            account: accountId, // Should probably return account name too
            opening_balance: openingBalance,
            closing_balance: currentBalance,
            transactions: enhancedLines
        };
    }

    async getTrialBalance(date) {
        const data = await AccountingRepository.getTrialBalance(date);

        const totalDebit = data.reduce((sum, row) => sum + row.debit, 0);
        const totalCredit = data.reduce((sum, row) => sum + row.credit, 0);

        return {
            trial_balance: data,
            total_debit: totalDebit,
            total_credit: totalCredit,
            status: (Math.abs(totalDebit - totalCredit) < 0.01) ? 'BALANCED' : 'UNBALANCED'
        };
    }

    async getFormattedAccountList() {
        const allAccounts = await AccountingRepository.findAllAccountsWithBalances({});

        // 1. Build Map and standardise objects
        const accountMap = new Map();
        allAccounts.forEach(acc => {
            const data = acc.get({ plain: true });
            const type = data.type.charAt(0).toUpperCase() + data.type.slice(1).toLowerCase();
            const accObj = {
                id: data.id,
                code: data.code,
                name: data.name,
                label: data.name,
                type: type,
                parent: data.parent_id,
                debit: parseFloat(data.total_debit) || 0,
                credit: parseFloat(data.total_credit) || 0,
                children: [] // Init children
            };
            accountMap.set(data.id, accObj);
        });

        // 2. Build Tree and Calculate Levels
        const rootAccounts = [];

        // Single pass to link parents
        accountMap.forEach(acc => {
            if (acc.parent) {
                const parent = accountMap.get(acc.parent);
                if (parent) {
                    parent.children.push(acc);
                } else {
                    rootAccounts.push(acc); // Orphan or missing parent
                }
            } else {
                rootAccounts.push(acc);
            }
        });

        // 3. Recursive Level Assignment (top-down) & Flattening
        const flatList = [];
        const processNode = (nodes, level) => {
            // Sort nodes by code within the same level/parent for consistency
            nodes.sort((a, b) => a.code.localeCompare(b.code));

            nodes.forEach(node => {
                node.level = level;
                // Create flat copy
                const { children, ...rest } = node;
                flatList.push(rest);

                if (node.children.length > 0) {
                    processNode(node.children, level + 1);
                }
            });
        };
        processNode(rootAccounts, 0);

        return flatList;
    }

    async getAccounts(query = {}) {
        let result = await this.getFormattedAccountList();

        // 4. In-memory Search (if applied)
        if (query.search) {
            const searchLower = query.search.toLowerCase();
            result = result.filter(acc =>
                acc.name.toLowerCase().includes(searchLower) ||
                acc.code.toLowerCase().includes(searchLower)
            );
        }

        // 5. Pagination
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;

        const paginatedRows = result.slice(startIndex, endIndex);

        return {
            count: result.length,
            rows: paginatedRows
        };
    }

    async getAccountDetails(id) {
        const account = await AccountingRepository.findAccountById(id);
        if (!account) return null;

        // Calculate level
        let level = 0;
        let parentId = account.parent_id;
        while (parentId) {
            level++;
            const parent = await AccountingRepository.findAccountById(parentId);
            if (!parent) break;
            parentId = parent.parent_id;
        }

        const type = account.type.charAt(0).toUpperCase() + account.type.slice(1).toLowerCase();

        return {
            id: account.id,
            code: account.code,
            name: account.name,
            type: type,
            parent: account.parent_id,
            level: level,
            description: account.description || undefined
        };
    }

    async getIncomeHeads() {
        const accounts = await this.getFormattedAccountList();
        return accounts.filter(acc => acc.type === 'Income');
    }

    async getExpenseHeads() {
        const accounts = await this.getFormattedAccountList();
        return accounts.filter(acc => acc.type === 'Expense');
    }

    async createIncomeHead(data) {
        if (data.type !== 'INCOME') {
            throw new Error(`Invalid type for Income Head. Must be INCOME`);
        }
        if (!data.parent_id) {
            let root = await AccountingRepository.findAccountByName('Income');
            if (!root) {
                try {
                    root = await AccountingRepository.createAccount({
                        code: 'ROOT_INCOME',
                        name: 'Income',
                        type: 'INCOME'
                    });
                } catch (e) {
                    // Ignore error if creating root fails, fall back to null parent
                }
            }
            if (root) data.parent_id = root.id;
        }
        const account = await AccountingRepository.createAccount(data);
        return await this.getAccountDetails(account.id);
    }

    async updateIncomeHead(id, data) {
        if (data.type && data.type !== 'INCOME') {
            throw new Error(`Invalid type for Income Head. Must be INCOME`);
        }
        const account = await AccountingRepository.updateAccount(id, data);
        return await this.getAccountDetails(account.id);
    }

    async createExpenseHead(data) {
        if (data.type !== 'EXPENSE') {
            throw new Error(`Invalid type for Expense Head. Must be EXPENSE`);
        }
        if (!data.parent_id) {
            let root = await AccountingRepository.findAccountByName('Expenses');
            if (!root) {
                try {
                    root = await AccountingRepository.createAccount({
                        code: 'ROOT_EXPENSE',
                        name: 'Expenses',
                        type: 'EXPENSE'
                    });
                } catch (e) {
                    // Ignore
                }
            }
            if (root) data.parent_id = root.id;
        }
        const account = await AccountingRepository.createAccount(data);
        return await this.getAccountDetails(account.id);
    }

    async updateExpenseHead(id, data) {
        if (data.type && data.type !== 'EXPENSE') {
            throw new Error(`Invalid type for Expense Head. Must be EXPENSE`);
        }
        const account = await AccountingRepository.updateAccount(id, data);
        return await this.getAccountDetails(account.id);
    }

    async createHeadWiseExpense(data) {
        // 1. Verify Debit Head (Expense Account)
        const debitHead = await AccountingRepository.findAccountById(data.debit_head_id);
        if (!debitHead) {
            throw new Error(`Debit Head (Expense Account) not found with ID: ${data.debit_head_id}`);
        }

        // 2. Verify Credit Head (Payment Method - Asset Account)
        let responseCreditHead;
        if (typeof data.payment_method === 'number') {
            responseCreditHead = await AccountingRepository.findAccountById(data.payment_method);
        } else {
            responseCreditHead = await AccountingRepository.findAccountByName(data.payment_method);
        }

        if (!responseCreditHead) {
            // Try lenient search if exact match fails?
            // Optional: responseCreditHead = await AccountingRepository.findOne({ where: { name: { [Op.like]: `%${data.payment_method}%` } } });
            throw new Error(`Payment account '${data.payment_method}' not found. Please verify the account name or create it first.`);
        }

        return await sequelize.transaction(async (t) => {
            // Create Transaction Record
            const transactionData = {
                type: 'EXPENSE',
                amount: data.amount,
                payment_mode: responseCreditHead.name.toLowerCase().includes('bank') ? 'BANK' : 'CASH',
                date: data.expense_date,
                description: data.title + (data.description ? ` - ${data.description}` : ''),
            };

            const transaction = await AccountingRepository.createTransaction(transactionData, t);

            // Create Journal Entry
            const journalData = {
                date: data.expense_date,
                reference_type: 'TRANSACTION',
                reference_id: transaction.id,
                narration: data.title + (data.description ? ` - ${data.description}` : '') + (data.reference_number ? ` (Ref: ${data.reference_number})` : '')
            };

            const linesData = [
                { account_id: debitHead.id, debit: data.amount, credit: 0 }, // Dr Expenses
                { account_id: responseCreditHead.id, debit: 0, credit: data.amount } // Cr Asset (Bank/Cash)
            ];

            const journal = await AccountingRepository.createJournalEntry(journalData, linesData, t);

            return { transaction, journal };
        });
    }

    async createHeadWiseIncome(data) {
        // 1. Verify Credit Head (Income Account)
        const creditHead = await AccountingRepository.findAccountById(data.income_head_id);
        if (!creditHead) {
            throw new Error(`Income Head (Income Account) not found with ID: ${data.income_head_id}`);
        }

        // 2. Verify Debit Head (Received In - Asset Account)
        let responseDebitHead;
        if (typeof data.payment_method === 'number') {
            responseDebitHead = await AccountingRepository.findAccountById(data.payment_method);
        } else {
            responseDebitHead = await AccountingRepository.findAccountByName(data.payment_method);
        }

        if (!responseDebitHead) {
            throw new Error(`Payment account '${data.payment_method}' not found. Please verify the account name or create it first.`);
        }

        return await sequelize.transaction(async (t) => {
            // Create Transaction Record
            const transactionData = {
                type: 'INCOME',
                amount: data.amount,
                payment_mode: responseDebitHead.name.toLowerCase().includes('bank') ? 'BANK' : 'CASH',
                date: data.income_date,
                description: data.title + (data.description ? ` - ${data.description}` : ''),
            };

            const transaction = await AccountingRepository.createTransaction(transactionData, t);

            // Create Journal Entry
            const journalData = {
                date: data.income_date,
                reference_type: 'TRANSACTION',
                reference_id: transaction.id,
                narration: data.title + (data.description ? ` - ${data.description}` : '') + (data.reference_number ? ` (Ref: ${data.reference_number})` : '')
            };

            const linesData = [
                { account_id: responseDebitHead.id, debit: data.amount, credit: 0 }, // Dr Asset (Bank/Cash)
                { account_id: creditHead.id, debit: 0, credit: data.amount } // Cr Income
            ];

            const journal = await AccountingRepository.createJournalEntry(journalData, linesData, t);

            return { transaction, journal };
        });
    }

    async createAccount(data) {
        const account = await AccountingRepository.createAccount(data);
        return await this.getAccountDetails(account.id);
    }

    async updateAccount(id, data) {
        const account = await AccountingRepository.updateAccount(id, data);
        return await this.getAccountDetails(account.id);
    }

    async deleteAccount(id) {
        return await AccountingRepository.deleteAccount(id);
    }

    async seedAccounts() {
        // Default Accounts based on MD
        const seeds = [
            { code: ACCOUNTS.CASH, name: 'Cash', type: 'ASSET' },
            { code: ACCOUNTS.BANK, name: 'Bank', type: 'ASSET' },
            { code: ACCOUNTS.AR, name: 'Accounts Receivable', type: 'ASSET' },
            { code: ACCOUNTS.INVENTORY, name: 'Inventory', type: 'ASSET' },
            { code: ACCOUNTS.AP, name: 'Accounts Payable', type: 'LIABILITY' },
            { code: ACCOUNTS.OWNER_CAPITAL, name: 'Owner Capital', type: 'EQUITY' },
            { code: ACCOUNTS.SALES, name: 'Sales', type: 'INCOME' },
            { code: ACCOUNTS.OTHER_INCOME, name: 'Other Income', type: 'INCOME' },
            { code: ACCOUNTS.PURCHASE, name: 'Purchase', type: 'EXPENSE' },
            { code: ACCOUNTS.SALES_RETURN, name: 'Sales Return', type: 'EXPENSE' },
            { code: ACCOUNTS.OFFICE_EXPENSE, name: 'Office Expense', type: 'EXPENSE' },
            { code: ACCOUNTS.PURCHASE_RETURN, name: 'Purchase Return', type: 'EXPENSE' },
            { code: ACCOUNTS.EMPLOYEE_ADVANCE, name: 'Employee Advances', type: 'ASSET' },
            { code: ACCOUNTS.SALARY, name: 'Salaries & Wages', type: 'EXPENSE' },
            { code: ACCOUNTS.TAX_PAYABLE, name: 'Tax Payable', type: 'LIABILITY' },
            { code: ACCOUNTS.TAX_EXPENSE, name: 'Tax Expense', type: 'EXPENSE' }
        ];


        const { Account } = require('./accounting.models'); // Import here to avoid circular dep if any, or strictly use Repo
        // Better use Repo, but for seeding direct model usage is often easier if Repo doesn't have createMany/upsert

        // We'll use a loop to findOrCreate
        const results = [];
        for (const seed of seeds) {
            const [account, created] = await Account.findOrCreate({
                where: { code: seed.code },
                defaults: seed
            });
            results.push(account);
        }
        return results;
    }

    async createManualJournal(data) {
        // Double check balance
        const totalDebit = data.entries.reduce((sum, e) => sum + (e.debit || 0), 0);
        const totalCredit = data.entries.reduce((sum, e) => sum + (e.credit || 0), 0);
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new Error('Journal Entry is not balanced.');
        }
        return await AccountingRepository.createManualJournal(data);
    }

    async getProfitAndLoss(filters) {
        return await AccountingRepository.getProfitAndLoss(filters);
    }

    async getBalanceSheet(date) {
        const trialBalance = await AccountingRepository.getTrialBalance(date);

        // Structure:
        // Assets: [{ name, code, balance }]
        // Liabilities: [{ name, code, balance }]
        // Equity: [{ name, code, balance }]

        // Need to calculate Net Profit as well to balance it.
        // Net Profit = (Total Income - Total Expense) up to that date.

        const pnL = await AccountingRepository.getProfitAndLoss({ to: date });
        const netProfit = pnL.net_profit;

        const report = {
            assets: [],
            liabilities: [],
            equity: [],
            total_assets: 0,
            total_liabilities: 0,
            total_equity: 0,
            as_of_date: date || new Date().toISOString().split('T')[0]
        };

        trialBalance.forEach(row => {
            const balance = (['ASSET', 'EXPENSE'].includes(row.type))
                ? row.debit - row.credit
                : row.credit - row.debit;

            if (balance === 0 && row.type !== 'EQUITY') return; // Skip zero balances unless Equity

            const entry = { name: row.account, code: row.code, balance };

            if (row.type === 'ASSET') {
                report.assets.push(entry);
                report.total_assets += balance;
            } else if (row.type === 'LIABILITY') {
                report.liabilities.push(entry);
                report.total_liabilities += balance;
            } else if (row.type === 'EQUITY') {
                report.equity.push(entry);
                report.total_equity += balance;
            }
        });

        // Add Retained Earnings (Net Profit) to Equity
        report.equity.push({ name: 'Retained Earnings (Net Profit)', code: 'RE', balance: netProfit });
        report.total_equity += netProfit;

        return report;
    }

    async getProductProfitLoss(filters) {
        return await AccountingRepository.getProductProfitLoss(filters);
    }

    async getIncomeExpenseTrend(days = 30) {
        return await AccountingRepository.getIncomeExpenseTrend(days);
    }

    async getExpenseBreakdown(filters) {
        return await AccountingRepository.getExpenseBreakdown(filters);
    }

    async getOverview() {
        const formatDate = (date) => date.toISOString().split('T')[0];

        const now = new Date();
        const today = formatDate(now);

        // Start of Week (assuming Monday)
        const dayOfWeek = now.getDay(); // 0 is Sunday
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust when day is Sunday
        const startOfWeekDate = new Date(now);
        startOfWeekDate.setDate(diff);
        const startOfWeek = formatDate(startOfWeekDate);

        // Start of Month
        const startOfMonth = formatDate(new Date(now.getFullYear(), now.getMonth(), 1));

        // Start of Year
        const startOfYear = formatDate(new Date(now.getFullYear(), 0, 1));

        const [todayStats, weekStats, monthStats, yearStats] = await Promise.all([
            AccountingRepository.getTotalsByDateRange(today, today),
            AccountingRepository.getTotalsByDateRange(startOfWeek, today), // Up to today
            AccountingRepository.getTotalsByDateRange(startOfMonth, today),
            AccountingRepository.getTotalsByDateRange(startOfYear, today)
        ]);

        return {
            today: todayStats,
            this_week: weekStats,
            this_month: monthStats,
            this_year: yearStats
        };
    }

    async getRecentActivity() {
        // Fetch last 5 transactions
        const { rows } = await AccountingRepository.findAllTransactions({}, 5, 0);

        const formatCurrency = (amount) => {
            return 'RM ' + parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
        };

        const formatDate = (dateString) => {
            const date = new Date(dateString);
            // Format: January 16th, 2026
            // Using Intl.DateTimeFormat for "Month Day, Year" then adding 'th' manually or simple approach
            const options = { month: 'long', day: 'numeric', year: 'numeric' };
            const part = date.toLocaleDateString('en-US', options);
            // part is "January 16, 2026". We need "16th".
            // Let's split and reconstruct or use a helper

            const day = date.getDate();
            const suffix = (day) => {
                if (day > 3 && day < 21) return 'th';
                switch (day % 10) {
                    case 1: return "st";
                    case 2: return "nd";
                    case 3: return "rd";
                    default: return "th";
                }
            };

            const month = date.toLocaleDateString('en-US', { month: 'long' });
            const year = date.getFullYear();

            return `${month} ${day}${suffix(day)}, ${year}`;
        };

        return rows.map(tx => {
            const isIncome = ['INCOME', 'SALES', 'OTHER_INCOME'].includes(tx.type);
            const isExpense = ['EXPENSE', 'PURCHASE', 'PAYMENT_OUT', 'SALES_RETURN'].includes(tx.type);


            let amountStr = formatCurrency(tx.amount);
            if (isIncome) amountStr = '+ ' + amountStr;
            else if (isExpense) amountStr = '- ' + amountStr;

            return {
                title: tx.description || tx.type,
                date: formatDate(tx.date),
                amount: amountStr
            };
        });
    }
    async getExpenses(query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 20;
        const offset = (page - 1) * limit;

        const types = ['EXPENSE', 'PURCHASE', 'PAYMENT_OUT', 'SALES_RETURN', 'TAX_EXPENSE', 'SALARY'];

        const { count, rows } = await AccountingRepository.findHeadWiseTransactions(types, query, limit, offset);

        const data = rows.map(tx => {
            const journal = tx.Journal;
            let debitHead = null;
            let creditHead = null;

            if (journal && journal.entries) {
                // Find main Expense head (Debit) and Payment head (Credit)
                const debitEntry = journal.entries.find(e => parseFloat(e.debit) > 0);
                const creditEntry = journal.entries.find(e => parseFloat(e.credit) > 0);

                if (debitEntry) debitHead = debitEntry.account;
                if (creditEntry) creditHead = creditEntry.account;
            }

            return {
                id: tx.id,
                title: tx.description,
                description: tx.description,
                debit_head_id: debitHead?.id,
                debitHead: debitHead ? { id: debitHead.id, name: debitHead.name } : null,
                amount: tx.amount,
                expense_date: tx.date,
                payment_method: creditHead?.name || tx.payment_mode,
                reference_number: journal?.narration,
                status: 'paid'
            };
        });

        return { count, rows: data };
    }

    async getIncomes(query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 20;
        const offset = (page - 1) * limit;

        const types = ['INCOME', 'SALES', 'OTHER_INCOME'];

        const { count, rows } = await AccountingRepository.findHeadWiseTransactions(types, query, limit, offset);

        const data = rows.map(tx => {
            const journal = tx.Journal;
            let debitHead = null;
            let creditHead = null;

            if (journal && journal.entries) {
                const debitEntry = journal.entries.find(e => parseFloat(e.debit) > 0);
                const creditEntry = journal.entries.find(e => parseFloat(e.credit) > 0);

                if (debitEntry) debitHead = debitEntry.account;
                if (creditEntry) creditHead = creditEntry.account;
            }

            return {
                id: tx.id,
                title: tx.description,
                description: tx.description,
                credit_head_id: creditHead?.id,
                creditHead: creditHead ? { id: creditHead.id, name: creditHead.name } : null,
                amount: tx.amount,
                income_date: tx.date,
                payment_method: debitHead?.name || tx.payment_mode, // Received into
                reference_number: journal?.narration
            };
        });

        return { count, rows: data };
    }

    async createTaxSubmission(data) {
        return await sequelize.transaction(async (t) => {
            // 1. Create Tax Submission Record
            const submission = await AccountingRepository.createTaxSubmission(data, t);

            // 2. record accounting transaction if amount > 0
            const amount = parseFloat(data.amount || 0);
            console.log(`[AccountingService] CreateTaxSubmission amount: ${amount}, data.payment_mode: ${data.payment_mode}, submission.payment_mode: ${submission.payment_mode}`);

            if (amount > 0) {
                await this.processTransaction({
                    type: 'TAX_SUBMISSION',
                    amount: amount,
                    payment_mode: data.payment_mode || submission.payment_mode || 'BANK',
                    date: data.submission_date || submission.submission_date,
                    description: `Tax Submission: ${data.tax_type} for period ${data.period_start} to ${data.period_end}. Ref: ${data.reference_number || 'N/A'}`
                }, t);
            }

            return submission;
        });
    }

    async getAllTaxSubmissions(query = {}) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const offset = (page - 1) * limit;

        const filters = {
            tax_type: query.tax_type,
            status: query.status,
            from: query.from,
            to: query.to
        };

        const submissions = await AccountingRepository.findAllTaxSubmissions(filters, limit, offset);
        const stats = await AccountingRepository.getTaxSubmissionStats();

        return {
            ...submissions,
            stats
        };
    }

    async getTaxSubmissionById(id) {
        const submission = await AccountingRepository.findTaxSubmissionById(id);
        if (!submission) throw new Error('Tax submission not found');
        return submission;
    }

    async updateTaxSubmission(id, data) {
        return await AccountingRepository.updateTaxSubmission(id, data);
    }

    async deleteTaxSubmission(id) {
        return await AccountingRepository.deleteTaxSubmission(id);
    }
}

module.exports = new AccountingService();
