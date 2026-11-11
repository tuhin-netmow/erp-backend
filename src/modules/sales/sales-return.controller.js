const salesReturnService = require('./sales-return.service');

class SalesReturnController {
    // Sales Returns
    async getSalesReturns(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const { status, customer_id, search, order_id } = req.query;
            const filters = { status, customer_id, search, order_id };
            const result = await salesReturnService.getAllSalesReturns(filters, page, limit);

            res.status(200).json({
                success: true,
                message: 'Sales returns retrieved successfully',
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

    async getApprovedSalesReturns(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const { search } = req.query;
            const filters = { status: 'approved', search };
            const result = await salesReturnService.getAllSalesReturns(filters, page, limit);

            res.status(200).json({
                success: true,
                message: 'Approved sales returns retrieved successfully',
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

    async getSalesReturnById(req, res) {
        try {
            const result = await salesReturnService.getSalesReturnById(req.params.id);
            res.status(200).json({
                status: true,
                message: 'Sales return retrieved successfully',
                data: result
            });
        } catch (error) {
            res.status(error.message.includes('not found') ? 404 : 500).json({
                status: false,
                message: error.message
            });
        }
    }

    async createSalesReturn(req, res) {
        try {
            const userId = req.user.id;
            const result = await salesReturnService.createSalesReturn(req.body, userId);
            res.status(201).json({
                status: true,
                message: 'Sales return created successfully',
                data: result
            });
        } catch (error) {
            res.status(400).json({ status: false, message: error.message });
        }
    }

    async updateSalesReturn(req, res) {
        try {
            const result = await salesReturnService.updateSalesReturn(req.params.id, req.body);
            res.status(200).json({
                status: true,
                message: 'Sales return updated successfully',
                data: result
            });
        } catch (error) {
            res.status(error.message.includes('not found') ? 404 : 400).json({
                status: false,
                message: error.message
            });
        }
    }

    async deleteSalesReturn(req, res) {
        try {
            await salesReturnService.deleteSalesReturn(req.params.id);
            res.status(200).json({
                status: true,
                message: 'Sales return deleted successfully'
            });
        } catch (error) {
            res.status(error.message.includes('not found') ? 404 : 500).json({
                status: false,
                message: error.message
            });
        }
    }

    // Sales Return Invoices
    async getAllSalesReturnInvoices(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const { status, customer_id, search } = req.query;
            const filters = { status, customer_id, search };
            const result = await salesReturnService.getAllSalesReturnInvoices(filters, page, limit);

            res.status(200).json({
                success: true,
                message: 'Sales return invoices retrieved successfully',
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

    async getSalesReturnInvoiceById(req, res) {
        try {
            const result = await salesReturnService.getSalesReturnInvoiceById(req.params.id);
            res.status(200).json({
                status: true,
                message: 'Sales return invoice retrieved successfully',
                data: result
            });
        } catch (error) {
            res.status(404).json({ status: false, message: error.message });
        }
    }

    async createSalesReturnInvoice(req, res) {
        try {
            const userId = req.user.id;
            const result = await salesReturnService.createSalesReturnInvoice(req.body, userId);
            res.status(201).json({
                status: true,
                message: 'Sales return invoice created successfully',
                data: result
            });
        } catch (error) {
            res.status(400).json({ status: false, message: error.message });
        }
    }

    async updateSalesReturnInvoice(req, res) {
        try {
            const result = await salesReturnService.updateSalesReturnInvoice(req.params.id, req.body);
            res.status(200).json({
                status: true,
                message: 'Sales return invoice updated successfully',
                data: result
            });
        } catch (error) {
            res.status(400).json({ status: false, message: error.message });
        }
    }

    // Sales Return Payments
    async getAllSalesReturnPayments(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const { sales_return_id, payment_method, search } = req.query;
            const filters = { sales_return_id, payment_method, search };
            const result = await salesReturnService.getAllSalesReturnPayments(filters, page, limit);

            res.status(200).json({
                success: true,
                message: 'Sales return payments retrieved successfully',
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

    async getSalesReturnPaymentById(req, res) {
        try {
            const result = await salesReturnService.getSalesReturnPaymentById(req.params.id);
            res.status(200).json({
                status: true,
                message: 'Sales return payment retrieved successfully',
                data: result
            });
        } catch (error) {
            res.status(404).json({ status: false, message: error.message });
        }
    }

    async createSalesReturnPayment(req, res) {
        try {
            const userId = req.user.id;
            const result = await salesReturnService.createSalesReturnPayment(req.body, userId);
            res.status(201).json({
                status: true,
                message: 'Sales return refund recorded successfully',
                data: result
            });
        } catch (error) {
            res.status(400).json({ status: false, message: error.message });
        }
    }
}

module.exports = new SalesReturnController();
