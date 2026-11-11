const SalesRouteRepository = require('./salesroute.repository');

class SalesRouteService {
    async getAllRoutes(filters = {}, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const result = await SalesRouteRepository.findAll(filters, limit, offset);
        return {
            data: result.rows,
            total: result.count
        };
    }

    async getRouteById(id) {
        const route = await SalesRouteRepository.findById(id);
        if (!route) {
            throw new Error('Sales route not found');
        }
        return route;
    }

    async createRoute(data, userId) {
        return await SalesRouteRepository.create({ ...data, created_by: userId });
    }

    async updateRoute(id, data) {
        const route = await SalesRouteRepository.update(id, data);
        if (!route) {
            throw new Error('Sales route not found');
        }
        return route;
    }

    async deleteRoute(id) {
        const route = await SalesRouteRepository.delete(id);
        if (!route) {
            throw new Error('Sales route not found');
        }
        return route;
    }

    async assignStaff(routeId, staffIds, assignedBy) {
        if (!Array.isArray(staffIds)) {
            throw new Error('Staff must be an array of user IDs');
        }

        const route = await SalesRouteRepository.assignStaff(routeId, staffIds, assignedBy);
        if (!route) {
            throw new Error('Sales route not found');
        }
        return route;
    }

    async getAssignedStaff(routeId) {
        const route = await SalesRouteRepository.getAssignedStaff(routeId);
        if (!route) {
            throw new Error('Sales route not found');
        }
        return route;
    }

    async getStaffRoutesForCheckIn(staffId) {
        return await SalesRouteRepository.getStaffRoutesForCheckIn(staffId);
    }
}

module.exports = new SalesRouteService();
