const { z } = require('zod');

exports.createMenuSchema = z.object({
    title: z.string().min(1, "Title is required"),
    path: z.string().optional(),
    icon: z.string().optional(),
    parent_id: z.number().optional().nullable(),
    sort_order: z.number().default(0),
    is_active: z.boolean().default(true)
});

exports.updateMenuSchema = z.object({
    title: z.string().optional(),
    path: z.string().optional(),
    icon: z.string().optional(),
    parent_id: z.number().optional().nullable(),
    sort_order: z.number().optional(),
    is_active: z.boolean().optional()
});
