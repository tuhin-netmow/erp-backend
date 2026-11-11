const SalesRouteService = require('./salesroute.service');
const { success, error, successWithPagination } = require('../../core/utils/response');

class SalesRouteController {
    async getAllRoutes(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const filters = {
                is_active: req.query.is_active,
                search: req.query.search
            };

            const result = await SalesRouteService.getAllRoutes(filters, page, limit);
            return successWithPagination(res, 'Sales routes retrieved successfully', result.data, {
                total: result.total,
                page,
                limit
            });
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getRouteById(req, res) {
        try {
            const route = await SalesRouteService.getRouteById(req.params.id);
            return success(res, 'Sales route retrieved successfully', route);
        } catch (err) {
            return error(res, err.message, 404);
        }
    }

    async createRoute(req, res) {
        try {
            const route = await SalesRouteService.createRoute(req.body, req.user.id);
            return success(res, 'Sales route created successfully', route, 201);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }

    async updateRoute(req, res) {
        try {
            const route = await SalesRouteService.updateRoute(req.params.id, req.body);
            return success(res, 'Sales route updated successfully', route);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }

    async deleteRoute(req, res) {
        try {
            await SalesRouteService.deleteRoute(req.params.id);
            return success(res, 'Sales route deleted successfully', null);
        } catch (err) {
            return error(res, err.message, 404);
        }
    }

    async assignStaff(req, res) {
        try {
            const { staff_ids } = req.body;
            const route = await SalesRouteService.assignStaff(
                req.params.id,
                staff_ids,
                req.user.id
            );
            return success(res, 'Staff assigned to sales route successfully', route);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }

    async getAssignedStaff(req, res) {
        try {
            const route = await SalesRouteService.getAssignedStaff(req.params.id);
            return success(res, 'Assigned staff retrieved successfully', route);
        } catch (err) {
            return error(res, err.message, 404);
        }
    }

    async getMyRoutes(req, res) {
        try {
            const routes = await SalesRouteService.getStaffRoutesForCheckIn(req.user.id);
            return success(res, 'My routes retrieved successfully', routes);
        } catch (err) {
            return error(res, err.message, 500);
        }
    }
}

module.exports = new SalesRouteController();
