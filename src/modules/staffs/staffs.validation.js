const { z } = require('zod');

const createStaff = z.object({
    first_name: z.string().min(1, 'First name is required').max(100),
    last_name: z.string().min(1, 'Last name is required').max(100),
    email: z.string().email('Invalid email format').max(255),
    password: z.string().min(4, 'Password must be at least 4 characters').optional(),
    phone: z.string().max(50).optional(),
    position: z.string().max(100).optional(),
    department_id: z.number().int().positive().optional(),
    role_id: z.number().int().positive().optional(),
    hire_date: z.string().optional(), // Should be YYYY-MM-DD
    salary: z.number().min(0).optional(),
    address: z.string().optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    postal_code: z.string().max(20).optional(),
    status: z.enum(['active', 'inactive', 'terminated', 'on_leave']).default('active'),
    notes: z.string().optional(),
    thumb_url: z.union([z.string().url('Invalid URL format'), z.literal('')]).optional().nullable(),
    gallery_items: z.array(z.string().url('Invalid URL format')).optional()
});

const updateStaff = z.object({
    first_name: z.string().min(1).max(100).optional(),
    last_name: z.string().min(1).max(100).optional(),
    email: z.string().email('Invalid email format').max(255).optional(),
    password: z.string().min(4, 'Password must be at least 4 characters').optional(),
    phone: z.string().max(50).optional(),
    position: z.string().max(100).optional(),
    department_id: z.number().int().positive().optional(),
    role_id: z.number().int().positive().optional(),
    hire_date: z.string().optional(),
    salary: z.number().min(0).optional(),
    address: z.string().optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    postal_code: z.string().max(20).optional(),
    status: z.enum(['active', 'inactive', 'terminated', 'on_leave']).optional(),
    notes: z.string().optional(),
    thumb_url: z.union([z.string().url('Invalid URL format'), z.literal('')]).optional().nullable(),
    gallery_items: z.array(z.string().url('Invalid URL format')).optional()
});

module.exports = {
    createStaff,
    updateStaff
};
