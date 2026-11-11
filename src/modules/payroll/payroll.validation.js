const { z } = require('zod');

const generateRun = z.object({
    month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
    staff_ids: z.array(z.number()).optional(),
    staffIds: z.union([z.array(z.number()), z.array(z.array(z.number()))]).optional(),
    custom_amounts: z.record(z.string().or(z.number()), z.number()).optional(),
    customAmounts: z.record(z.string().or(z.number()), z.number()).optional()
});

const addPayment = z.object({
    amount: z.number().positive('Amount must be positive'),
    payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    payment_method: z.string().optional(),
    reference: z.string().optional(),
    remarks: z.string().optional()
});

module.exports = {
    generateRun,
    addPayment
};
