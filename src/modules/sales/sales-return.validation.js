const { z } = require('zod');

// Sales Return Validation
const createSalesReturn = z.object({
    customer_id: z.number().int().positive(),
    order_id: z.number().int().positive().optional(),
    return_date: z.string().optional(),
    notes: z.string().optional(),
    items: z.array(z.object({
        product_id: z.number().int().positive(),
        quantity: z.number().positive(),
        unit_price: z.number().positive(),
        discount: z.number().min(0).optional()
    })).min(1, 'At least one item is required')
});

const updateSalesReturn = z.object({
    status: z.enum(['pending', 'approved', 'returned', 'cancelled']).optional(),
    notes: z.string().optional()
});

// Sales Return Invoice Validation
const createSalesReturnInvoice = z.object({
    sales_return_id: z.number().int().positive()
});

const updateSalesReturnInvoice = z.object({
    status: z.enum(['draft', 'issued', 'refunded', 'cancelled']).optional()
});

// Sales Return Payment Validation
const createSalesReturnPayment = z.object({
    sales_return_id: z.number().int().positive(),
    invoice_id: z.number().int().positive().optional(),
    amount: z.number().positive(),
    payment_method: z.string().min(1),
    reference_number: z.string().optional()
});

module.exports = {
    createSalesReturn,
    updateSalesReturn,
    createSalesReturnInvoice,
    updateSalesReturnInvoice,
    createSalesReturnPayment
};
