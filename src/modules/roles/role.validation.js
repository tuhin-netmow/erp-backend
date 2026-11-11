// role.validation.js
const { z } = require('zod');

exports.createSchema = z.object({
  role: z.string().optional(),
  name: z.string().optional(),
  display_name: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  permissions: z.array(z.any()).optional(),
  menu: z.array(z.string()).optional(),
  dashboard: z.array(z.string()).optional(),
  custom: z.record(z.any()).optional(),
}).refine(data => data.role || data.name, {
  message: "Either 'role' or 'name' must be provided",
  path: ['name']
});

exports.updateSchema = z.object({
  role: z.string().optional(),
  name: z.string().optional(),
  display_name: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  permissions: z.array(z.any()).optional(),
  menu: z.array(z.string()).optional(),
  dashboard: z.array(z.string()).optional(),
  custom: z.record(z.any()).optional(),
});
