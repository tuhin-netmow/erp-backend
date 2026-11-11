const purchaseReturnService = require('./purchase-return.service');

class PurchaseReturnController {
    // Purchase Returns
    async getPurchaseReturns(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const { status, supplier_id, search } = req.query;
            const filters = { status, supplier_id, search };
            const result = await purchaseReturnService.getAllPurchaseReturns(filters, page, limit);

            res.status(200).json({
                success: true,
                message: 'Purchase returns retrieved successfully',
                pagination: {
                    total: result.total,
                    page,
                    limit,
                    totalPage: Math.ceil(result.total / (limit || 10))
                },
                data: result.data
            });
        } catch (error) {
            res.status(500).json({ status: false, message: error.message });
        }
    }

    async getApprovedPurchaseReturns(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const { search } = req.query;
            const filters = { status: 'approved', search };
            const result = await purchaseReturnService.getAllPurchaseReturns(filters, page, limit);

            res.status(200).json({
                success: true,
                message: 'Approved purchase returns retrieved successfully',
                pagination: {
                    total: result.total,
                    page,
                    limit,
                    totalPage: Math.ceil(result.total / (limit || 10))
                },
                data: result.data
            });
        } catch (error) {
            res.status(500).json({ status: false, message: error.message });
        }
    }

    async getPurchaseReturnById(req, res) {
        try {
            const result = await purchaseReturnService.getPurchaseReturnById(req.params.id);
            res.status(200).json({
                status: true,
                message: 'Purchase return retrieved successfully',
                data: result
            });
        } catch (error) {
            res.status(error.message.includes('not found') ? 404 : 500).json({
                status: false,
                message: error.message
            });
        }
    }

    async createPurchaseReturn(req, res) {
        try {
            const userId = req.user.id;
            const result = await purchaseReturnService.createPurchaseReturn(req.body, userId);
            res.status(201).json({
                status: true,
                message: 'Purchase return created successfully',
                data: result
            });
        } catch (error) {
            res.status(400).json({ status: false, message: error.message });
        }
    }

    async updatePurchaseReturn(req, res) {
        try {
            const result = await purchaseReturnService.updatePurchaseReturn(req.params.id, req.body);
            res.status(200).json({
                status: true,
                message: 'Purchase return updated successfully',
                data: result
            });
        } catch (error) {
            res.status(error.message.includes('not found') ? 404 : 400).json({
                status: false,
                message: error.message
            });
        }
    }

    async deletePurchaseReturn(req, res) {
        try {
            await purchaseReturnService.deletePurchaseReturn(req.params.id);
            res.status(200).json({
                status: true,
                message: 'Purchase return deleted successfully'
            });
        } catch (error) {
            res.status(error.message.includes('not found') ? 404 : 500).json({
                status: false,
                message: error.message
            });
        }
    }

    // Purchase Return Invoices
    async getAllPurchaseReturnInvoices(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const { status, supplier_id, search } = req.query;
            const filters = { status, supplier_id, search };
            const result = await purchaseReturnService.getAllPurchaseReturnInvoices(filters, page, limit);

            res.status(200).json({
                success: true,
                message: 'Purchase return invoices retrieved successfully',
                pagination: {
                    total: result.total,
                    page,
                    limit,
                    totalPage: Math.ceil(result.total / (limit || 10))
                },
                data: result.data
            });
        } catch (error) {
            res.status(500).json({ status: false, message: error.message });
        }
    }

    async getPurchaseReturnInvoiceById(req, res) {
        try {
            const result = await purchaseReturnService.getPurchaseReturnInvoiceById(req.params.id);
            res.status(200).json({
                status: true,
                message: 'Purchase return invoice retrieved successfully',
                data: result
            });
        } catch (error) {
            res.status(404).json({ status: false, message: error.message });
        }
    }

    async createPurchaseReturnInvoice(req, res) {
        try {
            const userId = req.user.id;
            const result = await purchaseReturnService.createPurchaseReturnInvoice(req.body, userId);
            res.status(201).json({
                status: true,
                message: 'Purchase return invoice created successfully',
                data: result
            });
        } catch (error) {
            res.status(400).json({ status: false, message: error.message });
        }
    }

    async updatePurchaseReturnInvoice(req, res) {
        try {
            const result = await purchaseReturnService.updatePurchaseReturnInvoice(req.params.id, req.body);
            res.status(200).json({
                status: true,
                message: 'Purchase return invoice updated successfully',
                data: result
            });
        } catch (error) {
            res.status(400).json({ status: false, message: error.message });
        }
    }

    // Purchase Return Payments
    async getAllPurchaseReturnPayments(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const { purchase_return_id, payment_method, search } = req.query;
            const filters = { purchase_return_id, payment_method, search };
            const result = await purchaseReturnService.getAllPurchaseReturnPayments(filters, page, limit);

            res.status(200).json({
                success: true,
                message: 'Purchase return payments retrieved successfully',
                pagination: {
                    total: result.total,
                    page,
                    limit,
                    totalPage: Math.ceil(result.total / (limit || 10))
                },
                data: result.data
            });
        } catch (error) {
            res.status(500).json({ status: false, message: error.message });
        }
    }

    async getPurchaseReturnPaymentById(req, res) {
        try {
            const result = await purchaseReturnService.getPurchaseReturnPaymentById(req.params.id);
            res.status(200).json({
                status: true,
                message: 'Purchase return payment retrieved successfully',
                data: result
            });
        } catch (error) {
            res.status(404).json({ status: false, message: error.message });
        }
    }

    async createPurchaseReturnPayment(req, res) {
        try {
            const userId = req.user.id;
            const result = await purchaseReturnService.createPurchaseReturnPayment(req.body, userId);
            res.status(201).json({
                status: true,
                message: 'Purchase return payment recorded successfully',
                data: result
            });
        } catch (error) {
            res.status(400).json({ status: false, message: error.message });
        }
    }
}

module.exports = new PurchaseReturnController();
