const { z } = require('zod');

const createProduct = z.object({
    name: z.string().min(1, 'Product name is required').max(255),
    sku: z.string().max(100).optional(),
    description: z.string().nullable().optional(),
    specification: z.string().nullable().optional(),
    category_id: z.number().int().positive().nullable().optional(),
    unit_id: z.number().int().positive().nullable().optional(),
    price: z.number().min(0, 'Price must be non-negative'),
    cost: z.number().min(0, 'Cost must be non-negative').nullable().optional(),
    purchase_tax: z.number().min(0, 'Purchase tax must be non-negative').nullable().optional().default(0),
    sales_tax: z.number().min(0, 'Sales tax must be non-negative').nullable().optional().default(0),
    stock_quantity: z.number().min(0, 'Stock quantity must be non-negative').default(0),
    initial_stock: z.number().min(0, 'Initial stock must be non-negative').nullable().optional(),
    min_stock_level: z.number().min(0).nullable().optional(),
    max_stock_level: z.number().min(0).nullable().optional(),
    barcode: z.string().max(100).nullable().optional(),
    image_url: z.string().url().max(500).nullable().optional().or(z.literal('')),
    thumb_url: z.string().url().max(500).nullable().optional().or(z.literal('')),
    gallery_items: z.array(z.string().url()).nullable().optional(),
    // Logistics fields
    weight: z.number().min(0, 'Weight must be non-negative').nullable().optional(),
    length: z.number().min(0, 'Length must be non-negative').nullable().optional(),
    width: z.number().min(0, 'Width must be non-negative').nullable().optional(),
    height: z.number().min(0, 'Height must be non-negative').nullable().optional(),
    expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expiry_date must be in YYYY-MM-DD format').nullable().optional().or(z.literal('')),
    is_active: z.boolean().default(true),
    is_commissionable: z.boolean().default(false)
});

const updateProduct = z.object({
    name: z.string().min(1).max(255).optional(),
    sku: z.string().min(1).max(100).optional(),
    description: z.string().nullable().optional(),
    specification: z.string().nullable().optional(),
    category_id: z.number().int().positive().nullable().optional(),
    unit_id: z.number().int().positive().nullable().optional(),
    price: z.number().min(0).optional(),
    cost: z.number().min(0).nullable().optional(),
    purchase_tax: z.number().min(0).nullable().optional(),
    sales_tax: z.number().min(0).nullable().optional(),
    stock_quantity: z.number().min(0).optional(),
    initial_stock: z.number().min(0).nullable().optional(),
    min_stock_level: z.number().min(0).nullable().optional(),
    max_stock_level: z.number().min(0).nullable().optional(),
    barcode: z.string().max(100).nullable().optional(),
    image_url: z.string().url().max(500).nullable().optional().or(z.literal('')),
    thumb_url: z.string().url().max(500).nullable().optional().or(z.literal('')),
    gallery_items: z.array(z.string().url()).nullable().optional(),
    // Logistics fields
    weight: z.number().min(0).nullable().optional(),
    length: z.number().min(0).nullable().optional(),
    width: z.number().min(0).nullable().optional(),
    height: z.number().min(0).nullable().optional(),
    expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expiry_date must be in YYYY-MM-DD format').nullable().optional().or(z.literal('')),
    is_active: z.boolean().optional(),
    is_commissionable: z.boolean().optional()
});

const createCategory = z.object({
    name: z.string().min(1, 'Category name is required').max(255),
    description: z.string().optional(),
    parent_id: z.number().int().positive().optional(),
    is_active: z.boolean().default(true)
});

const updateCategory = z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    parent_id: z.number().int().positive().optional(),
    is_active: z.boolean().optional()
});

const createUnit = z.object({
    name: z.string().min(1, 'Unit name is required').max(100),
    symbol: z.string().min(1, 'Symbol is required').max(20),
    is_active: z.boolean().default(true)
});

const updateUnit = z.object({
    name: z.string().min(1).max(100).optional(),
    symbol: z.string().min(1).max(20).optional(),
    is_active: z.boolean().optional()
});

module.exports = {
    createProduct,
    updateProduct,
    createCategory,
    updateCategory,
    createUnit,
    updateUnit
};
