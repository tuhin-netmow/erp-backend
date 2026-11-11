const PayrollService = require('./payroll.service');
const { success, error, successWithPagination } = require('../../core/utils/response');

class PayrollController {
    async generateRun(req, res) {
        try {
            console.log("Generate Run Payload:", JSON.stringify(req.body, null, 2));
            const { month, staff_ids, custom_amounts, staffIds, customAmounts } = req.body;
            // Robustly handle staff_ids or staffIds
            const ids = staff_ids || staffIds;
            const amounts = custom_amounts || customAmounts || {};

            const run = await PayrollService.generateRun(month, req.user.id, ids, amounts);
            return success(res, 'Payroll run generated successfully', run, 201);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }

    async getRuns(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const filters = {
                month: req.query.month,
                status: req.query.status
            };

            const result = await PayrollService.getAllRuns(filters, page, limit);
            return successWithPagination(res, 'Payroll runs retrieved successfully', result.data, {
                total: result.total,
                page,
                limit
            });
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getRunById(req, res) {
        try {
            const run = await PayrollService.getRunById(req.params.id);
            return success(res, 'Payroll run retrieved successfully', run);
        } catch (err) {
            return error(res, err.message, 404);
        }
    }

    async approveRun(req, res) {
        try {
            const run = await PayrollService.approveRun(req.params.id);
            return success(res, 'Payroll run approved successfully', run);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }

    async payRun(req, res) {
        try {
            const run = await PayrollService.payRun(req.params.id);
            return success(res, 'Payroll run paid and expense recorded successfully', run);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }

    async deleteRun(req, res) {
        try {
            await PayrollService.deleteRun(req.params.id);
            return success(res, 'Payroll run deleted successfully', null);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }

    async getStructure(req, res) {
        try {
            const { staffId } = req.params;
            const structure = await PayrollService.getStructure(staffId);
            if (!structure) {
                return success(res, 'Payroll structure retrieved', {
                    staff_id: parseInt(staffId),
                    basic_salary: 0,
                    allowances: [],
                    deductions: [],
                    bank_details: {},
                    net_salary: 0
                });
            }
            return success(res, 'Payroll structure retrieved', structure);
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async saveStructure(req, res) {
        try {
            const { staffId } = req.params;
            const structure = await PayrollService.upsertStructure(staffId, req.body);
            return success(res, 'Payroll structure saved', structure);
        } catch (err) {
            return error(res, err.message, 500);
        }
    }
    async getAdvances(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const filters = {
                staff_id: req.query.staff_id,
                status: req.query.status,
                month: req.query.month
            };

            const result = await PayrollService.getAllAdvances(filters, page, limit);
            return successWithPagination(res, 'Advances retrieved successfully', result.data, result.pagination);
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getAdvanceById(req, res) {
        try {
            const advance = await PayrollService.getAdvanceById(req.params.id);
            return success(res, 'Advance retrieved successfully', advance);
        } catch (err) {
            return error(res, err.message, 404);
        }
    }

    async createAdvance(req, res) {
        try {
            const data = {
                ...req.body,
                created_by: req.user.id
            };
            const advance = await PayrollService.createAdvance(data);
            return success(res, 'Advance created successfully', advance, 201);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }

    async updateAdvance(req, res) {
        try {
            const advance = await PayrollService.updateAdvance(req.params.id, req.body);
            return success(res, 'Advance updated successfully', advance);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }

    async deleteAdvance(req, res) {
        try {
            await PayrollService.deleteAdvance(req.params.id);
            return success(res, 'Advance deleted successfully', null);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }

    async returnAdvance(req, res) {
        try {
            const entry = await PayrollService.processAdvanceReturn(req.params.id, req.body);
            return success(res, 'Return recorded successfully', entry, 201);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }

    async addPayment(req, res) {
        try {
            const payment = await PayrollService.addPayment(req.params.itemId, req.body, req.user.id);
            return success(res, 'Payment recorded successfully', payment, 201);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }
}


module.exports = new PayrollController();

