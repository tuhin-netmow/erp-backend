const SupplierService = require('./suppliers.service');
const { success, error, successWithPagination } = require('../../core/utils/response');

class SupplierController {
    async getAllSuppliers(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const filters = {
                is_active: req.query.is_active,
                search: req.query.search,
                sort: req.query.sort
            };

            const result = await SupplierService.getAllSuppliers(filters, page, limit);
            return successWithPagination(res, 'Suppliers retrieved successfully', result.data, {
                total: result.total,
                page,
                limit
            });
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getSupplierById(req, res) {
        try {
            const supplier = await SupplierService.getSupplierById(req.params.id);
            return success(res, 'Supplier retrieved successfully', supplier);
        } catch (err) {
            return error(res, err.message, 404);
        }
    }

    async createSupplier(req, res) {
        try {
            const supplier = await SupplierService.createSupplier(req.body, req.user.id);
            return success(res, 'Supplier created successfully', supplier, 201);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }

    async updateSupplier(req, res) {
        try {
            const supplier = await SupplierService.updateSupplier(req.params.id, req.body);
            return success(res, 'Supplier updated successfully', supplier);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }

    async deleteSupplier(req, res) {
        try {
            await SupplierService.deleteSupplier(req.params.id);
            return success(res, null, 'Supplier deleted successfully');
        } catch (err) {
            return error(res, err.message, 404);
        }
    }

    async getSupplierStats(req, res) {
        try {
            const stats = await SupplierService.getSupplierStats();
            return success(res, 'Supplier statistics retrieved successfully', stats);
        } catch (err) {
            return error(res, err.message, 500);
        }
    }
}

module.exports = new SupplierController();
