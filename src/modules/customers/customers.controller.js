const CustomerService = require('./customers.service');
const { success, error, successWithPagination } = require('../../core/utils/response');

class CustomerController {
    async getAllCustomers(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const filters = {
                customer_type: req.query.customer_type,
                is_active: req.query.is_active,
                search: req.query.search,
                sort: req.query.sort
            };

            const result = await CustomerService.getAllCustomers(filters, page, limit);
            return successWithPagination(res, 'Customers retrieved successfully', result.data, {
                total: result.total,
                page,
                limit
            });
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getActiveCustomers(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const filters = {
                ...req.query,
                is_active: true
            };

            const result = await CustomerService.getAllCustomers(filters, page, limit);
            return successWithPagination(res, 'Active customers retrieved successfully', result.data, {
                total: result.total,
                page,
                limit
            });
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getInactiveCustomers(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const filters = {
                ...req.query,
                is_active: false
            };

            const result = await CustomerService.getAllCustomers(filters, page, limit);
            return successWithPagination(res, 'Inactive customers retrieved successfully', result.data, {
                total: result.total,
                page,
                limit
            });
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getCustomerById(req, res) {
        try {
            const customer = await CustomerService.getCustomerById(req.params.id);
            return success(res, 'Customer retrieved successfully', customer);
        } catch (err) {
            return error(res, err.message, 404);
        }
    }

    async createCustomer(req, res) {
        try {
            const customer = await CustomerService.createCustomer(req.body, req.user.id);
            return success(res, 'Customer created successfully', customer, 201);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }

    async updateCustomer(req, res) {
        try {
            const customer = await CustomerService.updateCustomer(req.params.id, req.body);
            return success(res, 'Customer updated successfully', customer);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }

    async deleteCustomer(req, res) {
        try {
            await CustomerService.deleteCustomer(req.params.id);
            return success(res, null, 'Customer deleted successfully');
        } catch (err) {
            return error(res, err.message, 404);
        }
    }

    async getCustomerLocations(req, res) {
        try {
            const filters = {
                country: req.query.country
            };
            const locations = await CustomerService.getCustomerLocations(filters);
            return success(res, 'Customer locations retrieved successfully', locations);
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getCustomerStats(req, res) {
        try {
            const stats = await CustomerService.getCustomerStats();
            return success(res, 'Customer stats retrieved successfully', stats);
        } catch (err) {
            return error(res, err.message, 500);
        }
    }
}

module.exports = new CustomerController();
