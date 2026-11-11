const { z } = require('zod');

const dateRangeSchema = z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional()
});

const monthYearSchema = z.object({
    month: z.string().regex(/^\d{1,2}$/, 'Month must be 1-12'),
    year: z.string().regex(/^\d{4}$/, 'Year must be YYYY')
});

const yearSchema = z.object({
    year: z.string().regex(/^\d{4}$/, 'Year must be YYYY')
});

const dashboardFilterSchema = z.object({
    filter: z.enum(['thisWeek', 'thisMonth', 'lastMonth', 'thisYear']).optional()
});

module.exports = {
    dateRangeSchema,
    monthYearSchema,
    yearSchema,
    dashboardFilterSchema
};
