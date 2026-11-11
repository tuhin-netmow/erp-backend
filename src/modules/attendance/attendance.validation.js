const { z } = require('zod');

const updateAttendance = z.object({
    check_in: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/).optional(),
    check_out: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/).optional(),
    status: z.enum(['present', 'absent', 'late', 'half_day', 'on_leave']).optional(),
    notes: z.string().optional(),
    total_hours: z.union([z.number(), z.string()]).transform(val => Number(val)).optional()
});

const recordAttendance = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    start_at: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, 'Invalid time format (HH:mm:ss)'),
    end_at: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, 'Invalid time format (HH:mm:ss)'),
    total_hour: z.union([z.number(), z.string()]).transform(val => Number(val)).optional()
});

const recordFullLeave = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    reason: z.string().optional()
});

const recordShortLeave = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, 'Invalid time format (HH:mm:ss)'),
    end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, 'Invalid time format (HH:mm:ss)'),
    reason: z.string().optional()
});

module.exports = {
    updateAttendance,
    recordAttendance,
    recordFullLeave,
    recordShortLeave
};

