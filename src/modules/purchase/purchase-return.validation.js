const { z } = require('zod');

// Purchase Return Validation
const createPurchaseReturn = z.object({
    supplier_id: z.number().int().positive(),
    purchase_order_id: z.number().int().nonnegative().optional().nullable(),
    return_date: z.string().optional(),
    notes: z.string().optional(),
    items: z.array(z.object({
        product_id: z.number().int().positive(),
        quantity: z.number().positive(),
        unit_cost: z.number().positive(),
        discount: z.number().min(0).optional()
    })).min(1, 'At least one item is required')
});

const updatePurchaseReturn = z.object({
    status: z.enum(['pending', 'approved', 'returned', 'cancelled']).optional(),
    notes: z.string().optional()
});

// Purchase Return Invoice Validation
const createPurchaseReturnInvoice = z.object({
    purchase_return_id: z.number().int().positive()
});

const updatePurchaseReturnInvoice = z.object({
    status: z.enum(['draft', 'issued', 'refunded', 'cancelled']).optional()
});

// Purchase Return Payment Validation
const createPurchaseReturnPayment = z.object({
    purchase_return_id: z.number().int().positive(),
    invoice_id: z.number().int().positive().optional(),
    amount: z.number().positive(),
    payment_method: z.string().min(1),
    reference_number: z.string().optional()
});

module.exports = {
    createPurchaseReturn,
    updatePurchaseReturn,
    createPurchaseReturnInvoice,
    updatePurchaseReturnInvoice,
    createPurchaseReturnPayment
};
