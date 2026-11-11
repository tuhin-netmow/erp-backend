const { z } = require('zod');

// Purchase Order Validation
const createPurchaseOrder = z.object({
    supplier_id: z.number().int().positive(),
    order_date: z.string().optional(),
    expected_delivery_date: z.string().optional(),
    notes: z.string().optional(),
    items: z.array(z.object({
        product_id: z.number().int().positive(),
        quantity: z.number().positive(),
        unit_cost: z.number().positive(),
        discount: z.number().min(0).optional()
    })).min(1, 'At least one item is required')
});

const updatePurchaseOrder = z.object({
    status: z.enum(['pending', 'approved', 'ordered', 'partial', 'received', 'cancelled', 'returned']).optional(),
    expected_delivery_date: z.string().optional(),
    notes: z.string().optional()
});

// Purchase Invoice Validation
const createPurchaseInvoice = z.object({
    purchase_order_id: z.number().int().positive(),
    due_date: z.string().optional()
});

const updatePurchaseInvoice = z.object({
    status: z.enum(['draft', 'received', 'paid', 'overdue', 'cancelled']).optional(),
    due_date: z.string().optional()
});

// Purchase Payment Validation
const createPurchasePayment = z.object({
    purchase_order_id: z.number().int().positive(),
    invoice_id: z.number().int().positive().optional(),
    amount: z.number().positive(),
    payment_method: z.string().min(1),
    reference_number: z.string().optional(),
    wastage: z.number().min(0).optional()
});

// Purchase Receipt Validation
const createPurchaseReceipt = z.object({
    receipt_date: z.string().optional(),
    received_by: z.string().optional(),
    status: z.enum(['pending', 'partial', 'completed', 'rejected']).default('completed'),
    notes: z.string().optional()
});

module.exports = {
    createPurchaseOrder,
    updatePurchaseOrder,
    createPurchaseInvoice,
    updatePurchaseInvoice,
    createPurchasePayment,
    createPurchaseReceipt
};
