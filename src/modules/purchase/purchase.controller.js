const PurchaseService = require('./purchase.service');
const { success, error, successWithPagination } = require('../../core/utils/response');

class PurchaseController {
    // Purchase Orders
    async getPurchaseOrders(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const filters = {
                status: req.query.status,
                supplier_id: req.query.supplier_id,
                search: req.query.search
            };

            const result = await PurchaseService.getAllPurchaseOrders(filters, page, limit);
            return successWithPagination(res, 'Purchase orders retrieved successfully', result.data, {
                total: result.total,
                page,
                limit
            });
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getApprovedPurchaseOrders(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const filters = {
                status: 'approved',
                search: req.query.search
            };

            const result = await PurchaseService.getAllPurchaseOrders(filters, page, limit);
            return successWithPagination(res, 'Approved purchase orders retrieved successfully', result.data, {
                total: result.total,
                page,
                limit
            });
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getPurchaseOrderById(req, res) {
        try {
            const po = await PurchaseService.getPurchaseOrderById(req.params.id);
            return success(res, 'Purchase order retrieved successfully', po);
        } catch (err) {
            return error(res, err.message, 404);
        }
    }

    async createPurchaseOrder(req, res) {
        try {
            const po = await PurchaseService.createPurchaseOrder(req.body, req.user.id);
            return success(res, 'Purchase order created successfully', po, 201);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }

    async updatePurchaseOrder(req, res) {
        try {
            const po = await PurchaseService.updatePurchaseOrder(req.params.id, req.body, req.user.id);
            return success(res, 'Purchase order updated successfully', po);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }

    async deletePurchaseOrder(req, res) {
        try {
            await PurchaseService.deletePurchaseOrder(req.params.id);
            return success(res, 'Purchase order deleted successfully', null);
        } catch (err) {
            return error(res, err.message, 404);
        }
    }

    // Purchase Invoices
    async getAllPurchaseInvoices(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const filters = {
                status: req.query.status,
                supplier_id: req.query.supplier_id,
                search: req.query.search,
                id: req.query.id
            };

            const result = await PurchaseService.getAllPurchaseInvoices(filters, page, limit);
            return successWithPagination(res, 'Purchase invoices retrieved successfully', result.data, {
                total: result.total,
                page,
                limit
            });
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getPurchaseInvoiceById(req, res) {
        try {
            const invoice = await PurchaseService.getPurchaseInvoiceById(req.params.id);
            return success(res, 'Purchase invoice retrieved successfully', invoice);
        } catch (err) {
            return error(res, err.message, 404);
        }
    }

    async createPurchaseInvoice(req, res) {
        try {
            const invoice = await PurchaseService.createPurchaseInvoice(req.body, req.user.id);
            return success(res, 'Purchase invoice created successfully', invoice, 201);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }

    async updatePurchaseInvoice(req, res) {
        try {
            const invoice = await PurchaseService.updatePurchaseInvoice(req.params.id, req.body);
            return success(res, 'Purchase invoice updated successfully', invoice);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }

    // Purchase Payments
    async getAllPurchasePayments(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const filters = {
                purchase_order_id: req.query.purchase_order_id,
                payment_method: req.query.payment_method,
                search: req.query.search
            };
            const result = await PurchaseService.getAllPurchasePayments(filters, page, limit);
            return successWithPagination(res, 'Purchase payments retrieved successfully', result.data, {
                total: result.total,
                page,
                limit
            });
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getPurchasePaymentById(req, res) {
        try {
            const payment = await PurchaseService.getPurchasePaymentById(req.params.id);
            return success(res, 'Purchase payment retrieved successfully', payment);
        } catch (err) {
            return error(res, err.message, 404);
        }
    }

    async createPurchasePayment(req, res) {
        try {
            const payment = await PurchaseService.createPurchasePayment(req.body, req.user.id);
            return success(res, 'Purchase payment recorded successfully', payment, 201);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }

    // Purchase Receipts
    async createPurchaseReceipt(req, res) {
        try {
            const receipt = await PurchaseService.createPurchaseReceipt(req.params.id, req.body, req.user.id);
            return success(res, 'Purchase receipt recorded successfully', receipt, 201);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }

    // Map Locations
    async getPurchaseOrderLocations(req, res) {
        try {
            const data = await PurchaseService.getPurchaseOrderLocations();
            return success(res, 'Purchase order locations retrieved successfully', data);
        } catch (err) {
            return error(res, err.message, 500);
        }
    }
}

module.exports = new PurchaseController();
