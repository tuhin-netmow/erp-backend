const { z } = require('zod');

const createSupplier = z.object({
    name: z.string().min(1, 'Supplier name is required').max(255),
    code: z.string().max(50).optional(),
    contact_person: z.string().max(255).optional(),
    email: z.string().email('Invalid email format').max(255).optional(),
    phone: z.string().max(50).optional(),
    address: z.string().optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    postal_code: z.string().max(20).optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    tax_id: z.string().max(100).optional(),
    website: z.string().url().max(255).optional().or(z.literal('')),
    payment_terms: z.string().max(100).optional(),
    notes: z.string().optional(),
    thumb_url: z.string().optional(),
    gallery_items: z.array(z.any()).optional(),
    is_active: z.boolean().default(true)
});

const updateSupplier = z.object({
    name: z.string().min(1).max(255).optional(),
    code: z.string().max(50).optional(),
    contact_person: z.string().max(255).optional(),
    email: z.string().email('Invalid email format').max(255).optional(),
    phone: z.string().max(50).optional(),
    address: z.string().optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    postal_code: z.string().max(20).optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    tax_id: z.string().max(100).optional(),
    website: z.string().url().max(255).optional().or(z.literal('')),
    payment_terms: z.string().max(100).optional(),
    notes: z.string().optional(),
    thumb_url: z.string().optional(),
    gallery_items: z.array(z.any()).optional(),
    is_active: z.boolean().optional()
});

module.exports = {
    createSupplier,
    updateSupplier
};
