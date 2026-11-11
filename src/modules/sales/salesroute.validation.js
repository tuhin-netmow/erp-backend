const { z } = require('zod');

const createRoute = z.object({
    route_name: z.string().min(1, 'Route name is required').max(255),
    description: z.string().optional(),
    assigned_sales_rep_id: z.number().int().positive().optional(),
    start_location: z.string().max(255).optional(),
    end_location: z.string().max(255).optional(),
    is_active: z.boolean().default(true)
});

const updateRoute = z.object({
    route_name: z.string().min(1).max(255).optional(),
    description: z.string().optional().nullable(),
    assigned_sales_rep_id: z.number().int().positive().optional().nullable(),
    start_location: z.string().max(255).optional().nullable(),
    end_location: z.string().max(255).optional().nullable(),
    is_active: z.boolean().optional()
});

const assignStaff = z.object({
    staff_ids: z.array(z.number().int().positive()).min(1, 'At least one staff member must be assigned')
});

module.exports = {
    createRoute,
    updateRoute,
    assignStaff
};
