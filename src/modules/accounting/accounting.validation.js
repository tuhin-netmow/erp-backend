const { z } = require('zod');

// --- Account Management ---
const createAccount = z.object({
    code: z.string().min(1, 'Code is required').max(20),
    name: z.string().min(1, 'Name is required').max(100),
    type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE']),
    parent_id: z.number().int().positive().nullable().optional(),
    description: z.string().optional()
});

const updateAccount = z.object({
    name: z.string().min(1).max(100).optional(),
    type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE']).optional(),
    parent_id: z.number().int().positive().nullable().optional(),
    description: z.string().optional()
});

// --- Transactions ---
const createTransaction = z.object({
    type: z.enum([
        'SALES', 'PURCHASE', 'SALES_RETURN', 'PURCHASE_RETURN',
        'EXPENSE', 'INCOME', 'BANK_DEPOSIT', 'PROFESSIONAL_FEE'
    ]),
    amount: z.number().positive('Amount must be positive'),
    payment_mode: z.enum(['CASH', 'BANK', 'DUE', 'CHEQUE']).default('CASH'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
    description: z.string().optional(),
    // Optional context fields
    person: z.string().optional(), // For professional fee (e.g. SURGEON)
    reference: z.string().optional()
});

const createJournal = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    narration: z.string().optional(),
    entries: z.array(z.object({
        account_id: z.number().int().positive(),
        debit: z.number().min(0).default(0),
        credit: z.number().min(0).default(0)
    })).min(2, 'Journal must have at least 2 entries')
});

const createHeadWiseExpense = z.object({
    title: z.string().min(1, 'Title is required'),
    expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    debit_head_id: z.number().int().positive('Debit Head ID is required'),
    description: z.string().optional(),
    amount: z.number().positive('Amount must be positive'),
    payment_method: z.union([z.string(), z.number()]), // Allow ID or Name
    reference_number: z.string().optional()
});

const createHeadWiseIncome = z.object({
    title: z.string().min(1, 'Title is required'),
    income_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    income_head_id: z.number().int().positive('Income Head ID is required'),
    description: z.string().optional(),
    amount: z.number().positive('Amount must be positive'),
    payment_method: z.union([z.string(), z.number()]), // Received In (Asset Account)
    reference_number: z.string().optional()
});

const createTaxSubmission = z.object({
    tax_type: z.string().min(1, 'Tax type is required'),
    period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
    period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
    amount: z.number().positive('Amount must be positive'),
    submission_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Submission date must be YYYY-MM-DD'),
    reference_number: z.string().optional(),
    attachment_url: z.string().optional(),
    status: z.enum(['PENDING', 'SUBMITTED', 'PAID']).default('SUBMITTED'),
    notes: z.string().optional(),
    payment_mode: z.enum(['CASH', 'BANK']).default('BANK')
});

module.exports = {
    createAccount,
    updateAccount,
    createTransaction,
    createJournal,
    createHeadWiseExpense,
    createHeadWiseIncome,
    createTaxSubmission
};
