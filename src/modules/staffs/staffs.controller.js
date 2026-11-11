const StaffService = require('./staffs.service');
const { success, error, successWithPagination } = require('../../core/utils/response');

class StaffController {
    async getAllStaffs(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const filters = {
                department_id: req.query.department_id,
                role_id: req.query.role_id,
                status: req.query.status,
                search: req.query.search
            };

            const result = await StaffService.getAllStaffs(filters, page, limit);
            return successWithPagination(res, 'Staff members retrieved successfully', result.data, {
                total: result.total,
                page,
                limit
            });
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getStaffById(req, res) {
        try {
            const staff = await StaffService.getStaffById(req.params.id);
            return success(res, 'Staff retrieved successfully', staff);
        } catch (err) {
            return error(res, err.message, 404);
        }
    }

    async createStaff(req, res) {
        try {
            const staff = await StaffService.createStaff(req.body, req.user.id);
            return success(res, 'Staff created successfully', staff, 201);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }

    async updateStaff(req, res) {
        try {
            const staff = await StaffService.updateStaff(req.params.id, req.body);
            return success(res, 'Staff updated successfully', staff);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }

    async deleteStaff(req, res) {
        try {
            await StaffService.deleteStaff(req.params.id);
            return success(res, 'Staff deleted successfully', null);
        } catch (err) {
            return error(res, err.message, 404);
        }
    }

    async getStaffRoutes(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const filters = {
                search: req.query.search
            };

            const result = await StaffService.getStaffsWithRoutes(filters, page, limit);

            // Return with standard pagination wrapper
            return successWithPagination(res, 'Staff routes retrieved successfully', result.data, {
                total: result.total,
                page,
                limit
            });
        } catch (err) {
            return error(res, err.message, 500);
        }
    }
}

module.exports = new StaffController();
