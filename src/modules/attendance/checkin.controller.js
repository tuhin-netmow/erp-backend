const CheckInService = require('./checkin.service');
const { success, error, successWithPagination } = require('../../core/utils/response');

class CheckInController {
    async getCheckIns(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const filters = {
                staff_id: req.query.staff_id,
                customer_id: req.query.customer_id,
                date: req.query.date,
                search: req.query.search
            };

            const result = await CheckInService.getAllCheckIns(filters, page, limit);
            return successWithPagination(res, 'Check-ins retrieved successfully', result.data, {
                total: result.total,
                page,
                limit
            });
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getCheckInById(req, res) {
        try {
            const checkIn = await CheckInService.getCheckInById(req.params.id);
            return success(res, 'Check-in retrieved successfully', checkIn);
        } catch (err) {
            return error(res, err.message, 404);
        }
    }

    async createCheckIn(req, res) {
        try {
            const checkIn = await CheckInService.createCheckIn(req.body);
            return success(res, 'Check-in created successfully', checkIn, 201);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }

    async updateCheckIn(req, res) {
        try {
            const checkIn = await CheckInService.updateCheckIn(req.params.id, req.body);
            return success(res, 'Check-in updated successfully', checkIn);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }

    async deleteCheckIn(req, res) {
        try {
            await CheckInService.deleteCheckIn(req.params.id);
            return success(res, 'Check-in deleted successfully');
        } catch (err) {
            return error(res, err.message, 404);
        }
    }

    async getCustomersWithCheckIns(req, res) {
        try {
            const date = req.params.date;
            if (!date) {
                return error(res, 'Date parameter is required', 400);
            }
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = await CheckInService.getCustomersWithCheckIns(date, page, limit);
            return successWithPagination(res, 'Customer list with check-ins retrieved successfully', result.data, {
                total: result.total,
                page,
                limit
            });
        } catch (err) {
            return error(res, err.message, 500);
        }
    }
}

module.exports = new CheckInController();
