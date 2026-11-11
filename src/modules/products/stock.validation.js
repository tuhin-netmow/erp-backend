const { z } = require('zod');

const updateStock = z.object({
    operation: z.enum(['add', 'subtract', 'set'], {
        errorMap: () => ({ message: 'Operation must be "add", "subtract", or "set"' })
    }),
    quantity: z.number().min(0, 'Quantity must be a non-negative number'),
    notes: z.string().optional(),
    date: z.string().optional(),
    movement_type: z.enum(['purchase', 'sale', 'return', 'adjustment', 'transfer', 'production', 'waste']).optional()
});

module.exports = {
    updateStock
};
