const DepartmentService = require('./departments.service');
const { success, error, successWithPagination } = require('../../core/utils/response');

class DepartmentController {
    async getDepartments(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const filters = {
                status: req.query.status,
                search: req.query.search
            };

            const result = await DepartmentService.getAllDepartments(filters, page, limit);
            return successWithPagination(res, 'Departments retrieved successfully', result.data, {
                total: result.total,
                page,
                limit
            });
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getDepartmentById(req, res) {
        try {
            const department = await DepartmentService.getDepartmentById(req.params.id);
            return success(res, 'Department retrieved successfully', department);
        } catch (err) {
            return error(res, err.message, 404);
        }
    }

    async createDepartment(req, res) {
        try {
            const department = await DepartmentService.createDepartment(req.body, req.user.id);
            return success(res, 'Department created successfully', department, 201);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }

    async updateDepartment(req, res) {
        try {
            const department = await DepartmentService.updateDepartment(req.params.id, req.body);
            return success(res, 'Department updated successfully', department);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }

    async deleteDepartment(req, res) {
        try {
            await DepartmentService.deleteDepartment(req.params.id);
            return success(res, 'Department deleted successfully');
        } catch (err) {
            return error(res, err.message, 404);
        }
    }
}

module.exports = new DepartmentController();
