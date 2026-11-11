const { z } = require('zod');

exports.createSchema = z.object({
  name: z.string().min(2).optional(), // Optional if first_name/last_name provided
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  email: z.string().email(),
  password: z.string().min(4),
  role_id: z.number().int().nullable().optional(),
  phone: z.string().max(50).optional(),
  position: z.string().max(100).optional(),
  department_id: z.number().int().positive().optional(),
  hire_date: z.string().optional(),
  salary: z.number().min(0).optional(),
  address: z.string().optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  postal_code: z.string().max(20).optional(),
  status: z.enum(['active', 'inactive', 'terminated', 'on_leave']).default('active'),
  notes: z.string().optional(),
  thumb_url: z.union([z.string().url(), z.literal('')]).optional().nullable(),
  gallery_items: z.array(z.string().url()).optional()
}).refine(data => data.name || (data.first_name && data.last_name), {
  message: "Either 'name' OR 'first_name' and 'last_name' must be provided",
  path: ["name"]
});

exports.updateSchema = z.object({
  name: z.string().min(2).optional(),
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  password: z.preprocess((value) => {
    if (value === undefined || value === null) {
      return undefined;
    }
    if (typeof value === 'string' && value.trim() === '') {
      return undefined;
    }
    return value;
  }, z.string().min(4).optional()),
  role_id: z.number().int().nullable().optional(),
  phone: z.string().max(50).optional(),
  position: z.string().max(100).optional(),
  department_id: z.number().int().positive().optional(),
  hire_date: z.string().optional(),
  salary: z.number().min(0).optional(),
  address: z.string().optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  postal_code: z.string().max(20).optional(),
  status: z.enum(['active', 'inactive', 'terminated', 'on_leave']).optional(),
  notes: z.string().optional(),
  thumb_url: z.union([z.string().url(), z.literal('')]).optional().nullable(),
  gallery_items: z.array(z.string().url()).optional()
});
