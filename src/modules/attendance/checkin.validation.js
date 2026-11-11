const { z } = require('zod');

const createCheckIn = z.object({
    customer_id: z.number().int().positive('Customer ID is required'),
    staff_id: z.number().int().positive('Staff ID is required'),
    check_in_time: z.string().datetime().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    distance_meters: z.number().min(0).optional(),
    note: z.string().optional()
});

const updateCheckIn = z.object({
    customer_id: z.number().int().positive().optional(),
    staff_id: z.number().int().positive().optional(),
    check_in_time: z.string().datetime().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    distance_meters: z.number().min(0).optional(),
    note: z.string().optional()
});

module.exports = {
    createCheckIn,
    updateCheckIn
};
