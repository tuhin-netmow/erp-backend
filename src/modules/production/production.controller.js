const ProductionService = require('./production.service');
const { success, error, successWithPagination } = require('../../core/utils/response');

class ProductionController {
    // --- Production Runs ---
    async getRuns(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const filters = {
                status: req.query.status,
                search: req.query.search
            };
            const result = await ProductionService.getAllRuns(filters, page, limit);
            return successWithPagination(res, 'Production runs retrieved successfully', result.data, {
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
            const run = await ProductionService.getRunById(req.params.id);
            return success(res, 'Production run retrieved successfully', run);
        } catch (err) {
            return error(res, err.message, 404);
        }
    }

    async createRun(req, res) {
        try {
            const run = await ProductionService.createRun(req.body, req.user?.id);
            return success(res, 'Production run created successfully', run, 201);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }

    async updateRun(req, res) {
        try {
            const run = await ProductionService.updateRun(req.params.id, req.body);
            return success(res, 'Production run updated successfully', run);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }

    async deleteRun(req, res) {
        try {
            await ProductionService.deleteRun(req.params.id);
            return success(res, 'Production run deleted successfully', null);
        } catch (err) {
            return error(res, err.message, 404);
        }
    }

    // --- BOMs ---
    async getBOMs(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const filters = {
                product_id: req.query.product_id,
                search: req.query.search
            };
            const result = await ProductionService.getAllBOMs(filters, page, limit);
            return successWithPagination(res, 'BOMs retrieved successfully', result.data, {
                total: result.total,
                page,
                limit
            });
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getBOMById(req, res) {
        try {
            const bom = await ProductionService.getBOMById(req.params.id);
            return success(res, 'BOM retrieved successfully', bom);
        } catch (err) {
            return error(res, err.message, 404);
        }
    }

    async createBOM(req, res) {
        try {
            const bom = await ProductionService.createBOM(req.body, req.user.id);
            return success(res, 'BOM created successfully', bom, 201);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }

    async updateBOM(req, res) {
        try {
            const bom = await ProductionService.updateBOM(req.params.id, req.body);
            return success(res, 'BOM updated successfully', bom);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }

    async deleteBOM(req, res) {
        try {
            await ProductionService.deleteBOM(req.params.id);
            return success(res, 'BOM deleted successfully', null);
        } catch (err) {
            return error(res, err.message, 404);
        }
    }

    // --- Finished Goods ---
    async getFinishedGoods(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const filters = {
                search: req.query.search
            };
            const result = await ProductionService.getAllFinishedGoods(filters, page, limit);
            return successWithPagination(res, 'Finished goods retrieved successfully', result.data, {
                total: result.total,
                page,
                limit
            });
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async createFinishedGood(req, res) {
        try {
            // Force type to finished_good
            const data = { ...req.body, product_type: 'finished_good' };
            const product = await ProductionService.createFinishedGood(data, req.user.id);
            return success(res, 'Finished good created successfully', product, 201);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }

    async getFinishedGoodById(req, res) {
        try {
            const product = await ProductionService.getFinishedGoodById(req.params.id);
            return success(res, 'Finished good retrieved successfully', product);
        } catch (err) {
            return error(res, err.message, 404);
        }
    }

    async updateFinishedGood(req, res) {
        try {
            const product = await ProductionService.updateFinishedGood(req.params.id, req.body);
            return success(res, 'Finished good updated successfully', product);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }

    async deleteFinishedGood(req, res) {
        try {
            await ProductionService.deleteFinishedGood(req.params.id);
            return success(res, 'Finished good deleted successfully', null);
        } catch (err) {
            return error(res, err.message, 404);
        }
    }
}

module.exports = new ProductionController();
