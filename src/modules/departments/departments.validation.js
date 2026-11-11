const { z } = require('zod');

const createDepartment = z.object({
    name: z.string().min(1, 'Department name is required').max(100),
    description: z.string().optional()
});

const updateDepartment = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional()
});

module.exports = {
    createDepartment,
    updateDepartment
};
