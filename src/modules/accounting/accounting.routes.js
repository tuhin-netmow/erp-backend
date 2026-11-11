const express = require('express');
const router = express.Router();
const accountingController = require('./accounting.controller');
const { verifyToken } = require('../../core/middleware/auth');
const { moduleCheck } = require('../../core/middleware/moduleCheck');
const { handlerWithFields } = require('../../core/utils/zodTypeView');
const validate = require('../../core/middleware/validate');
const { createAccount, updateAccount, createJournal, createHeadWiseExpense, createHeadWiseIncome, createTaxSubmission } = require('./accounting.validation');

// Module name for routes-tree grouping
router.moduleName = 'Accounting';

router.use(verifyToken);
router.use(moduleCheck('accounting'));

// Define routes metadata
router.routesMeta = [
    // --- Transactions (Entry Point) ---
    {
        path: '/journal-entry',
        method: 'POST',
        middlewares: [validate(createJournal)],
        handler: handlerWithFields((req, res) => accountingController.createJournalEntry(req, res), createJournal),
        description: 'Create a Manual Journal Entry',
        database: {
            tables: ['journals', 'journal_lines'],
            mainTable: 'journals',
            requiredFields: ['date', 'entries'],
            optionalFields: ['narration']
        },
        request: {
            date: '2026-01-15',
            narration: 'Manual Adjustment',
            entries: [
                { account_id: 1, debit: 100, credit: 0 },
                { account_id: 2, debit: 0, credit: 100 }
            ]
        },
        examples: [
            {
                title: 'Create Manual Journal',
                description: 'Record a general ledger adjustment',
                url: '/api/accounting/journal-entry',
                method: 'POST',
                request: {
                    date: '2026-01-15',
                    narration: 'Depreciation',
                    entries: [
                        { account_id: 50, debit: 500, credit: 0 },
                        { account_id: 51, debit: 0, credit: 500 }
                    ]
                },
                response: {
                    status: true,
                    message: 'Journal Entry created successfully',
                    data: {
                        id: 10,
                        date: '2026-01-15',
                        narration: 'Depreciation'
                    }
                }
            }
        ]
    },
    {
        path: '/transactions',
        method: 'POST',
        middlewares: [],
        handler: (req, res) => accountingController.createTransaction(req, res),
        description: 'Create a new accounting transaction (Single Entry -> Auto Journal)',
        database: {
            tables: ['transactions', 'journals', 'journal_lines'],
            mainTable: 'transactions',
            fields: {
                transactions: ['id', 'type', 'amount', 'payment_mode', 'date', 'description'],
                journals: ['id', 'reference_id', 'narration'],
                journal_lines: ['account_id', 'debit', 'credit']
            },
            relationships: ['transactions.id -> journals.reference_id (One-to-One)', 'journals.id -> journal_lines.journal_id (One-to-Many)']
        },
        examples: [
            {
                title: 'Create Cash Sale',
                description: 'Record a cash sale transaction which automatically creates journal entries',
                url: '/api/accounting/transactions',
                method: 'POST',
                request: {
                    type: 'SALES',
                    amount: 10000,
                    payment_mode: 'CASH',
                    date: '2026-01-14',
                    description: 'Sales Invoice #123'
                },
                response: {
                    status: true,
                    message: 'Transaction posted and journalized successfully',
                    data: {
                        transaction: { id: 1, type: 'SALES', amount: 10000 },
                        journal: { id: 5, narration: 'Sales Invoice #123' }
                    }
                }
            }
        ]
    },
    {
        path: '/transactions',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => accountingController.getTransactions(req, res),
        description: 'Get list of Transactions with pagination',
        database: {
            tables: ['transactions'],
            fields: {
                transactions: ['id', 'type', 'amount', 'date', 'description', 'payment_mode']
            }
        },
        calculation: 'No complex calculation.\nReturns raw transaction records which are the source for auto-generated Journal Entries.',
        queryParams: {
            page: 'Page number (default 1)',
            limit: 'Items per page (default 20)',
            query: 'Search Description',
            start_date: 'Start Date (YYYY-MM-DD)',
            end_date: 'End Date (YYYY-MM-DD)',
            date: 'Specific Date (YYYY-MM-DD)',
            type: 'Transaction Type Filter',
            from: 'Alias for start_date (Legacy)',
            to: 'Alias for end_date (Legacy)'
        },
        examples: [
            {
                title: 'List Transactions',
                description: 'Get paginated list of past transactions',
                url: '/api/accounting/transactions?page=1&limit=10',
                method: 'GET',
                response: {
                    status: true,
                    message: 'Transactions retrieved successfully',
                    processed: {
                        currentPage: 1,
                        totalPages: 5,
                        totalItems: 50,
                        itemsPerPage: 10
                    },
                    data: [
                        { id: 10, type: 'SALES', amount: 500, date: '2026-01-15' }
                    ]
                }
            },
            {
                title: 'Filter by date',
                description: 'Get transactions for a specific date',
                url: '/api/accounting/transactions?date=2026-01-14&page=1&limit=10',
                method: 'GET',
                response: {
                    status: true,
                    message: 'Transactions retrieved successfully',
                    data: [
                        { id: 10, type: 'SALES', amount: 500, date: '2026-01-14' }
                    ]
                }
            },
            {
                title: 'Filter by Date Range',
                description: 'Get transactions within a date range',
                url: '/api/accounting/transactions?page=1&limit=10&start_date=2026-01-01&end_date=2026-01-31',
                method: 'GET',
                response: {
                    status: true,
                    message: 'Transactions retrieved successfully',
                    data: [
                        { id: 10, type: 'SALES', amount: 500, date: '2026-01-14' }
                    ]
                }
            },
            {
                title: 'Filter by Type',
                description: 'Get transactions of a specific type (e.g. SALES, EXPENSE)',
                url: '/api/accounting/transactions?page=1&limit=10&type=SALES',
                method: 'GET',
                response: {
                    status: true,
                    message: 'Transactions retrieved successfully',
                    data: [
                        { id: 10, type: 'SALES', amount: 500, date: '2026-01-14' },
                        { id: 11, type: 'SALES', amount: 1200, date: '2026-01-15' }
                    ]
                }
            }
        ]
    },
    {
        path: '/expenses',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => accountingController.getExpenses(req, res),
        description: 'Get list of Expenses',
        queryParams: { page: 'Page', limit: 'Limit', search: 'Search', date: 'Date' }
    },
    {
        path: '/incomes',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => accountingController.getIncomes(req, res),
        description: 'Get list of Incomes',
        queryParams: { page: 'Page', limit: 'Limit', search: 'Search', date: 'Date' }
    },

    // --- Reports ---
    {
        path: '/reports/journal',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => accountingController.getJournalReport(req, res),
        description: 'Get Journal Report with filtering',
        database: {
            tables: ['journals', 'journal_lines', 'accounts'],
            mainTable: 'journals',
            fields: {
                journals: ['date', 'narration'],
                journal_lines: ['debit', 'credit'],
                accounts: ['code', 'name']
            },
            relationships: ['journals.id -> journal_lines.journal_id', 'journal_lines.account_id -> accounts.id']
        },
        calculation: 'Aggregation: Groups Journal Lines by Journal ID.\nValidation: Sum(Debit) must equal Sum(Credit) for each Journal Entry.',
        queryParams: {
            from: 'Start Date (YYYY-MM-DD)',
            to: 'End Date (YYYY-MM-DD)'
        },
        examples: [
            {
                title: 'Get Journal Report',
                description: 'Retrieve journal entries within a date range',
                url: '/api/accounting/reports/journal?from=2026-01-01&to=2026-01-31',
                method: 'GET',
                response: {
                    status: true,
                    message: 'Journal report retrieved successfully',
                    data: [
                        {
                            id: 1,
                            date: '2026-01-14',
                            entries: [
                                { account: { code: '1000', name: 'Cash' }, debit: 10000, credit: 0 },
                                { account: { code: '4000', name: 'Sales' }, debit: 0, credit: 10000 }
                            ]
                        }
                    ]
                }
            }
        ]
    },
    {
        path: '/reports/ledger/:id',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => accountingController.getLedgerReport(req, res),
        description: 'Get Ledger Report for a specific Account',
        database: {
            tables: ['accounts', 'journal_lines', 'journals'],
            mainTable: 'journal_lines',
            fields: {
                journal_lines: ['debit', 'credit'],
                journals: ['date', 'narration']
            }
        },
        calculation: 'Running Balance Strategy:\n1. Asset/Expense Types: Balance = Prev Balance + Debit - Credit\n2. Liability/Equity/Income: Balance = Prev Balance + Credit - Debit',
        queryParams: {
            from: 'Start Date',
            to: 'End Date'
        },
        examples: [
            {
                title: 'Get Cash Ledger',
                description: 'View running balance history for Cash Account (ID: 1)',
                url: '/api/accounting/reports/ledger/1?from=2026-01-01&to=2026-01-31',
                method: 'GET',
                response: {
                    status: true,
                    message: 'Ledger report retrieved successfully',
                    data: {
                        account: '1',
                        opening_balance: 0,
                        closing_balance: 10000,
                        transactions: [
                            { date: '2026-01-14', debit: 10000, credit: 0, balance: 10000, narration: 'Sales' }
                        ]
                    }
                }
            }
        ]
    },
    {
        path: '/reports/trial-balance',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => accountingController.getTrialBalance(req, res),
        description: 'Get Trial Balance Summary',
        database: {
            tables: ['accounts', 'journal_lines'],
            mainTable: 'accounts',
            fields: {
                accounts: ['code', 'name', 'type'],
                journal_lines: ['debit', 'credit']
            },
            sideEffects: ['Aggregates all debits and credits per account']
        },
        calculation: '1. Account Total Debit = SUM(JournalLines.debit)\n2. Account Total Credit = SUM(JournalLines.credit)\n3. Validation: Total System Debits must equal Total System Credits',
        queryParams: {
            date: 'As of Date (YYYY-MM-DD)'
        },
        examples: [
            {
                title: 'Get Trial Balance',
                description: 'Check if total Debits equal total Credits',
                url: '/api/accounting/reports/trial-balance?date=2026-01-31',
                method: 'GET',
                response: {
                    status: true,
                    message: 'Trial Balance retrieved successfully',
                    data: {
                        trial_balance: [
                            { code: '1000', account: 'Cash', debit: 15000, credit: 0 },
                            { code: '4000', account: 'Sales', debit: 0, credit: 15000 }
                        ],
                        total_debit: 15000,
                        total_credit: 15000,
                        status: 'BALANCED'
                    }
                }
            }
        ]
    },
    {
        path: '/reports/profit-and-loss',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => accountingController.getProfitAndLoss(req, res),
        description: 'Get Profit and Loss Statement',
        database: {
            tables: ['accounts', 'journal_lines'],
            mainTable: 'accounts',
            fields: {
                accounts: ['code', 'name', 'type'],
                journal_lines: ['debit', 'credit']
            },
            sideEffects: ['Aggregates Income and Expense accounts']
        },
        calculation: '1. Net Income (Income Accounts) = SUM(Credit) - SUM(Debit)\n2. Net Expense (Expense Accounts) = SUM(Debit) - SUM(Credit)\n3. Net Profit = Total Net Income - Total Net Expense',
        queryParams: {
            from: 'Start Date (YYYY-MM-DD)',
            to: 'End Date (YYYY-MM-DD)'
        },
        examples: [
            {
                title: 'Get P&L',
                description: 'View Income vs Expense statement',
                url: '/api/accounting/reports/profit-and-loss?from=2026-01-01&to=2026-01-31',
                method: 'GET',
                response: {
                    status: true,
                    message: 'Profit and Loss report retrieved successfully',
                    data: {
                        income: [{ code: '4000', name: 'Sales', amount: 50000 }],
                        expense: [{ code: '5000', name: 'Purchase', amount: 20000 }],
                        total_income: 50000,
                        total_expense: 20000,
                        net_profit: 30000
                    }
                }
            }
        ]
    },
    {
        path: '/reports/balance-sheet',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => accountingController.getBalanceSheet(req, res),
        description: 'Get Balance Sheet Report',
        database: {
            tables: ['accounts', 'journal_lines'],
            mainTable: 'accounts',
            fields: {
                accounts: ['code', 'name', 'type'],
                journal_lines: ['debit', 'credit']
            },
        },
        calculation: '1. Assets = Sum(Debit) - Sum(Credit) for ASSET accounts\n2. Liabilities = Sum(Credit) - Sum(Debit) for LIABILITY accounts\n3. Equity = Sum(Credit) - Sum(Debit) for EQUITY accounts + Net Profit',
        queryParams: {
            date: 'As of Date (YYYY-MM-DD)'
        },
        examples: [
            {
                title: 'Get Balance Sheet',
                description: 'View Assets, Liabilities and Equity',
                url: '/api/accounting/reports/balance-sheet?date=2026-01-31',
                method: 'GET',
                response: {
                    status: true,
                    message: 'Balance Sheet retrieved successfully',
                    data: {
                        assets: [{ code: '1000', name: 'Cash', balance: 10000 }],
                        liabilities: [{ code: '2000', name: 'Accounts Payable', balance: 2000 }],
                        equity: [{ code: '3000', name: 'Owner Capital', balance: 5000 }, { name: 'Retained Earnings', balance: 3000 }],
                        total_assets: 10000,
                        total_liabilities: 2000,
                        total_equity: 8000
                    }
                }
            }
        ]
    },
    {
        path: '/reports/product-profit-loss',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => accountingController.getProductProfitLoss(req, res),
        description: 'Get Product Item Wise Profit and Loss',
        database: {
            tables: ['order_items', 'orders', 'products'],
            mainTable: 'order_items',
            fields: {
                order_items: ['line_total', 'quantity', 'purchase_cost'],
                products: ['name', 'sku']
            },
            sideEffects: ['Aggregates sales revenue and cost']
        },
        calculation: '1. Revenue = SUM(line_total)\n2. Cost = SUM(quantity * purchase_cost)\n3. Profit = Revenue - Cost',
        queryParams: {
            from: 'Start Date (YYYY-MM-DD)',
            to: 'End Date (YYYY-MM-DD)'
        },
        examples: [
            {
                title: 'Get Product P&L',
                description: 'View profit per product',
                url: '/api/accounting/reports/product-profit-loss?from=2026-01-01&to=2026-01-31',
                method: 'GET',
                response: {
                    status: true,
                    message: 'Product Profit and Loss report retrieved successfully',
                    data: [
                        {
                            sku: 'WID-001',
                            name: 'Premium Widget',
                            qty: 10.00,
                            salesPrice: 100.00,
                            salesAmount: 1000.00,
                            costPrice: 50.00,
                            costAmount: 500.00,
                            profitPrice: 50.00,
                            profitAmount: 500.00,
                            profitRatio: '50%'
                        }
                    ]
                }
            }
        ]
    },
    {
        path: '/reports/income-expense-trend',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => accountingController.getIncomeExpenseTrend(req, res),
        description: 'Get Daily Income vs Expense trend for Last X days',
        database: {
            tables: ['journals', 'journal_lines', 'accounts'],
            sideEffects: ['Sums Income and Expense account balances per day']
        },
        queryParams: {
            days: 'Number of days to look back (default 30)'
        },
        examples: [
            {
                title: 'Get 30 Day Trend',
                description: 'View daily income vs expense for the last 30 days',
                url: '/api/accounting/reports/income-expense-trend?days=30',
                method: 'GET',
                response: {
                    status: true,
                    message: 'Income vs Expense trend retrieved successfully',
                    data: [
                        { date: '2026-01-01', income: 500, expense: 200 },
                        { date: '2026-01-02', income: 700, expense: 300 }
                    ]
                }
            }
        ]
    },
    {
        path: '/reports/expense-breakdown',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => accountingController.getExpenseBreakdown(req, res),
        description: 'Get Expense Breakdown by Account (for Pie Chart)',
        database: {
            tables: ['accounts', 'journal_lines', 'journals'],
            mainTable: 'accounts',
            sideEffects: ['Aggregates expense account balances']
        },
        calculation: 'For each EXPENSE account: Balance = SUM(Debit) - SUM(Credit)',
        queryParams: {
            from: 'Start Date (YYYY-MM-DD)',
            to: 'End Date (YYYY-MM-DD)'
        },
        examples: [
            {
                title: 'Get Expense Breakdown',
                description: 'View expense distribution by account for pie chart',
                url: '/api/accounting/reports/expense-breakdown?from=2026-01-01&to=2026-01-31',
                method: 'GET',
                response: {
                    status: true,
                    message: 'Expense breakdown retrieved successfully',
                    data: [
                        { name: 'Salaries', value: 4500 },
                        { name: 'Rent', value: 2000 },
                        { name: 'Utilities', value: 800 },
                        { name: 'Marketing', value: 1200 },
                        { name: 'Staff Training', value: 500 },
                        { name: 'Office Supplies', value: 300 }
                    ]
                }
            }
        ]
    },
    {
        path: '/overview',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => accountingController.getOverview(req, res),
        description: 'Get Financial Overview (Income vs Expense)',
        database: {
            tables: ['accounts', 'journal_lines'],
            sideEffects: ['Sums Income and Expense account balances']
        },
        calculation: 'Time-Period Aggregation (Today, Week, Month, Year):\n1. Income = SUM(Income Accounts Credit) - SUM(Income Accounts Debit)\n2. Expense = SUM(Expense Accounts Debit) - SUM(Expense Accounts Credit)\n3. Net = Income - Expense',
        examples: [
            {
                title: 'Get Financial Dashboard',
                description: 'Quick stats for dashboard',
                url: '/api/accounting/overview',
                method: 'GET',
                response: {
                    status: true,
                    message: 'Financial overview retrieved successfully',
                    data: {
                        today: { income: 500, expense: 100, net: 400 },
                        this_week: { income: 2500, expense: 500, net: 2000 },
                        this_month: { income: 10000, expense: 2000, net: 8000 },
                        this_year: { income: 50000, expense: 20000, net: 30000 }
                    }
                }
            }
        ]
    },
    {
        path: '/recent-activity',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => accountingController.getRecentActivity(req, res),
        description: 'Get Recent Activity (formatted list)',
        database: {
            tables: ['transactions'],
            sideEffects: ['Fetches last 5 transactions']
        },
        calculation: '1. Fetches latest 5 records from Transaction table.\n2. Formats Amount: Income types (+), Expense types (-).\n3. Formats Date to human readable string.',
        examples: [
            {
                title: 'Get Recent Activity',
                description: 'Dashboard widget data',
                url: '/api/accounting/recent-activity',
                method: 'GET',
                response: {
                    status: true,
                    message: 'Recent activity retrieved successfully',
                    data: [
                        {
                            title: "Consulting Fee Received",
                            date: "January 16th, 2026",
                            amount: "+ RM 1,500"
                        },
                        {
                            title: "Office Rent Payment",
                            date: "January 16th, 2026",
                            amount: "- RM 2,000"
                        }
                    ]
                }
            }
        ]
    },

    // --- Master Data ---
    {
        path: '/accounts',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => accountingController.getAccounts(req, res),
        description: 'Get Chart of Accounts with pagination and search',
        database: {
            tables: ['accounts'],
            mainTable: 'accounts',
            fields: {
                accounts: ['id', 'code', 'name', 'type', 'parent_id']
            },
        },
        calculation: 'Hierarchy Building:\n1. Fetches flat list of accounts.\n2. Maps Parent IDs to build a Tree structure.\n3. Calculates "Level" (depth) for indentation.\n4. Flattens tree back to list for UI display (DFS order).',
        queryParams: {
            page: 'Page number (default: 1)',
            limit: 'Items per page (default: 10)',
            search: 'Search by accounting name or code'
        },
        examples: [
            {
                title: 'List Accounts',
                description: 'Get hierarchical flat list with levels',
                url: '/api/accounting/accounts?page=1&limit=10',
                method: 'GET',
                response: {
                    status: true,
                    message: 'Chart of Accounts retrieved successfully',
                    pagination: {
                        total: 50,
                        page: 1,
                        limit: 10,
                        totalPage: 5
                    },
                    data: [
                        { id: 1, code: "1000", name: "Assets", label: "Assets", type: "Asset", parent: null, level: 0 },
                        { id: 2, code: "1001", name: "Current Assets", label: "Current Assets", type: "Asset", parent: 1, level: 1 },
                        { id: 3, code: "1002", name: "Cash in Hand", label: "Cash in Hand", type: "Asset", parent: 2, level: 2 }
                    ]
                }
            }
        ]
    },
    {
        path: '/accounts/heads/income',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => accountingController.getIncomeHeads(req, res),
        description: 'Get Income Heads (Income)',
        database: {
            tables: ['accounts'],
            mainTable: 'accounts',
            fields: {
                accounts: ['id', 'code', 'name', 'type']
            }
        },
        calculation: 'Filters the Chart of Accounts for Type = "Income".',
        examples: [
            {
                title: 'List Income Heads',
                description: 'Get accounts that usually have Income balances',
                url: '/api/accounting/accounts/heads/income',
                method: 'GET',
                response: {
                    status: true,
                    message: 'Income Heads retrieved successfully',
                    data: [
                        { id: 2, code: '4000', name: 'Sales', label: 'Sales', type: 'Income', parent: null, level: 0 }
                    ]
                }
            }
        ]
    },
    {
        path: '/accounts/heads/expense',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => accountingController.getExpenseHeads(req, res),
        description: 'Get Expense Heads (Expense)',
        database: {
            tables: ['accounts'],
            mainTable: 'accounts',
            fields: {
                accounts: ['id', 'code', 'name', 'type']
            }
        },
        calculation: 'Filters the Chart of Accounts for Type = "Expense".',
        examples: [
            {
                title: 'List Expense Heads',
                description: 'Get accounts that usually have Expense balances',
                url: '/api/accounting/accounts/heads/expense',
                method: 'GET',
                response: {
                    status: true,
                    message: 'Expense Heads retrieved successfully',
                    data: [
                        { id: 1, code: '5000', name: 'Purchase', label: 'Purchase', type: 'Expense', parent: null, level: 0 }
                    ]
                }
            }
        ]
    },
    {
        path: '/accounts/heads/income',
        method: 'POST',
        middlewares: [validate(createAccount)],
        handler: handlerWithFields((req, res) => accountingController.createIncomeHead(req, res), createAccount),
        description: 'Create Income Head (Must be INCOME)',
        database: { tables: ['accounts'], requiredFields: ['code', 'name', 'type'] },
        request: {
            code: '4500',
            name: 'Consulting Income',
            type: 'INCOME'
        },
        examples: [
            {
                title: 'Create Income Head',
                description: 'Create a new Income Account',
                url: '/api/accounting/accounts/heads/income',
                method: 'POST',
                request: {
                    code: '4500',
                    name: 'Consulting Income',
                    type: 'INCOME'
                },
                response: {
                    status: true,
                    message: 'Income Head created successfully',
                    data: { id: 105, code: '4500', name: 'Consulting Income', type: 'INCOME' }
                }
            }
        ]
    },
    {
        path: '/accounts/heads/income/:id',
        method: 'PUT',
        middlewares: [validate(updateAccount)],
        handler: handlerWithFields((req, res) => accountingController.updateIncomeHead(req, res), updateAccount),
        description: 'Update Income Head',
        database: { tables: ['accounts'], updatableFields: ['name', 'type', 'parent_id'] },
        request: {
            name: 'Service Income'
        },
        examples: [
            {
                title: 'Update Income Head',
                description: 'Update the name of an Income Head',
                url: '/api/accounting/accounts/heads/income/105',
                method: 'PUT',
                request: {
                    name: 'Service Income'
                },
                response: {
                    status: true,
                    message: 'Income Head updated successfully',
                    data: { id: 105, code: '4500', name: 'Service Income', type: 'INCOME' }
                }
            }
        ]
    },
    {
        path: '/accounts/heads/expense',
        method: 'POST',
        middlewares: [validate(createAccount)],
        handler: handlerWithFields((req, res) => accountingController.createExpenseHead(req, res), createAccount),
        description: 'Create Expense Head (Must be EXPENSE)',
        database: { tables: ['accounts'], requiredFields: ['code', 'name', 'type'] },
        request: {
            code: '5500',
            name: 'Travel Expense',
            type: 'EXPENSE'
        },
        examples: [
            {
                title: 'Create Expense Head',
                description: 'Create a new Expense Account',
                url: '/api/accounting/accounts/heads/expense',
                method: 'POST',
                request: {
                    code: '5500',
                    name: 'Travel Expense',
                    type: 'EXPENSE'
                },
                response: {
                    status: true,
                    message: 'Expense Head created successfully',
                    data: { id: 106, code: '5500', name: 'Travel Expense', type: 'EXPENSE' }
                }
            }
        ]
    },
    {
        path: '/accounts/heads/expense/:id',
        method: 'PUT',
        middlewares: [validate(updateAccount)],
        handler: handlerWithFields((req, res) => accountingController.updateExpenseHead(req, res), updateAccount),
        description: 'Update Expense Head',
        database: { tables: ['accounts'], updatableFields: ['name', 'type', 'parent_id'] },
        request: {
            name: 'Local Travel'
        },
        examples: [
            {
                title: 'Update Expense Head',
                description: 'Update the name of an Expense Head',
                url: '/api/accounting/accounts/heads/expense/106',
                method: 'PUT',
                request: {
                    name: 'Local Travel'
                },
                response: {
                    status: true,
                    message: 'Expense Head updated successfully',
                    data: { id: 106, code: '5500', name: 'Local Travel', type: 'EXPENSE' }
                }
            }
        ]
    },
    {
        path: '/expenses/head-wise',
        method: 'POST',
        middlewares: [validate(createHeadWiseExpense)],
        handler: handlerWithFields((req, res) => accountingController.createHeadWiseExpense(req, res), createHeadWiseExpense),
        description: 'Create Head-wise Expense',
        database: {
            tables: ['transactions', 'journals'],
            sideEffects: ['Creates Transaction', 'Creates Journal Entry']
        },
        request: {
            title: "test expanse",
            expense_date: "2026-01-16",
            debit_head_id: 10,
            description: "test",
            amount: 2500,
            payment_method: "DBBL 2025",
            reference_number: "wertyu"
        },
        examples: [
            {
                title: 'Create Head Wise Expense',
                description: 'Record a specific expense against a head',
                url: '/api/accounting/expenses/head-wise',
                method: 'POST',
                request: {
                    title: "test expanse",
                    expense_date: "2026-01-16",
                    debit_head_id: 10,
                    description: "test",
                    amount: 2500,
                    payment_method: "DBBL 2025",
                    reference_number: "wertyu"
                },
                response: {
                    status: true,
                    message: 'Expense recorded successfully',
                    data: {
                        transaction: { id: 50, amount: 2500, type: 'EXPENSE' },
                        journal: { id: 100, narration: 'test expanse - test' }
                    }
                }
            }
        ]
    },
    {
        path: '/incomes/head-wise',
        method: 'POST',
        middlewares: [validate(createHeadWiseIncome)],
        handler: handlerWithFields((req, res) => accountingController.createHeadWiseIncome(req, res), createHeadWiseIncome),
        description: 'Create Head-wise Income',
        database: {
            tables: ['transactions', 'journals'],
            sideEffects: ['Creates Transaction', 'Creates Journal Entry']
        },
        request: {
            title: "Project Alpha",
            income_date: "2026-01-16",
            income_head_id: 8,
            description: "Consulting Fee",
            amount: 5000,
            payment_method: "Bank",
            reference_number: "REF123"
        },
        examples: [
            {
                title: 'Create Head Wise Income',
                description: 'Record a specific income against a head',
                url: '/api/accounting/incomes/head-wise',
                method: 'POST',
                request: {
                    title: "Project Alpha",
                    income_date: "2026-01-16",
                    income_head_id: 8,
                    description: "Consulting Fee",
                    amount: 5000,
                    payment_method: "Bank",
                    reference_number: "REF123"
                },
                response: {
                    status: true,
                    message: 'Income recorded successfully',
                    data: {
                        transaction: { id: 51, amount: 5000, type: 'INCOME' },
                        journal: { id: 101, narration: 'Project Alpha - Consulting Fee' }
                    }
                }
            }
        ]
    },
    {
        path: '/accounts',
        method: 'POST',
        middlewares: [validate(createAccount)],
        handler: handlerWithFields((req, res) => accountingController.createAccount(req, res), createAccount),
        description: 'Create a new Account (Sub-account or Root)',
        database: {
            tables: ['accounts'],
            requiredFields: ['code', 'name', 'type'],
            optionalFields: ['parent_id', 'description']
        },
        request: {
            code: '5201',
            name: 'Rent Expense',
            type: 'EXPENSE',
            parent_id: 100
        },
        examples: [
            {
                title: 'Create Sub-Account',
                description: 'Create "Office Rent" as a sub-account of "Office Expense" (ID 100)',
                url: '/api/accounting/accounts',
                method: 'POST',
                request: {
                    code: '5201',
                    name: 'Rent Expense',
                    type: 'EXPENSE',
                    parent_id: 100
                },
                response: {
                    status: true,
                    message: 'Account created successfully',
                    data: {
                        id: 101,
                        code: '5201',
                        name: 'Rent Expense',
                        type: 'EXPENSE',
                        parent_id: 100
                    }
                }
            }
        ]
    },
    {
        path: '/accounts/:id',
        method: 'PUT',
        middlewares: [validate(updateAccount)],
        handler: handlerWithFields((req, res) => accountingController.updateAccount(req, res), updateAccount),
        description: 'Update Account details',
        database: {
            tables: ['accounts'],
            updatableFields: ['name', 'parent_id', 'type', 'description']
        },
        examples: [
            {
                title: 'Update Parent ID',
                description: 'Move an account under a new parent',
                url: '/api/accounting/accounts/5',
                method: 'PUT',
                request: {
                    parent_id: 102
                },
                response: {
                    status: true,
                    message: 'Account updated successfully'
                }
            }
        ]
    },
    {
        path: '/accounts/:id',
        method: 'DELETE',
        middlewares: [],
        handler: (req, res) => accountingController.deleteAccount(req, res),
        description: 'Delete an Account',
        database: {
            tables: ['accounts'],
            sideEffects: ['Deletes the account. Ensure no transactions exist first.']
        },
        examples: [
            {
                title: 'Delete Account',
                description: 'Remove an unused account',
                url: '/api/accounting/accounts/10',
                method: 'DELETE',
                response: {
                    status: true,
                    message: 'Account deleted successfully'
                }
            }
        ]
    },
    {
        path: '/accounts/seed',
        method: 'POST',
        middlewares: [],
        handler: (req, res) => accountingController.seedAccounts(req, res),
        description: 'Seed default Chart of Accounts',
        database: {
            tables: ['accounts'],
            sideEffects: ['Inserts default accounts if missing']
        },
        examples: [
            {
                title: 'Seed Accounts',
                description: 'Initialize the system with default accounts',
                url: '/api/accounting/accounts/seed',
                method: 'POST',
                response: {
                    status: true,
                    message: 'Accounts seeded successfully'
                }
            }
        ]
    },
    {
        path: '/tax-submissions',
        method: 'POST',
        middlewares: [validate(createTaxSubmission)],
        handler: handlerWithFields((req, res) => accountingController.createTaxSubmission(req, res), createTaxSubmission),
        description: 'Record a Tax Submission',
        database: {
            tables: ['tax_submissions', 'transactions', 'journals'],
            mainTable: 'tax_submissions'
        },
        request: {
            tax_type: 'VAT',
            period_start: '2026-01-01',
            period_end: '2026-01-31',
            amount: 5000,
            submission_date: '2026-02-15',
            reference_number: 'VAT-JAN-2026',
            notes: 'January VAT Submission'
        },
        examples: [
            {
                title: 'Record Tax Submission',
                description: 'Submit VAT for January',
                url: '/api/accounting/tax-submissions',
                method: 'POST',
                request: {
                    tax_type: 'VAT',
                    period_start: '2026-01-01',
                    period_end: '2026-01-31',
                    amount: 5000,
                    submission_date: '2026-02-15',
                    reference_number: 'VAT-JAN-2026'
                },
                response: {
                    status: true,
                    message: 'Tax submission recorded successfully'
                }
            }
        ]
    },
    {
        path: '/tax-submissions',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => accountingController.getAllTaxSubmissions(req, res),
        description: 'Get all tax submissions',
        queryParams: {
            page: 'Page number',
            limit: 'Items per page',
            tax_type: 'Filter by type',
            status: 'Filter by status'
        }
    }
];

// Register routes
router.routesMeta.forEach(r => {
    router[r.method.toLowerCase()](r.path, ...r.middlewares, r.handler);
});

module.exports = router;
