const { z } = require('zod');

exports.createDashboardSchema = z.object({
    name: z.string().min(1, "Name is required"),
    slug: z.string().min(1, "Slug is required"),
    type: z.string().default('stat'),
    size: z.string().default('1x1'),
    is_active: z.boolean().default(true)
});

exports.updateDashboardSchema = z.object({
    name: z.string().optional(),
    slug: z.string().optional(),
    type: z.string().optional(),
    size: z.string().optional(),
    is_active: z.boolean().optional()
});
