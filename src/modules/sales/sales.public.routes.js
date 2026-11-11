const express = require('express');
const router = express.Router();
const salesController = require('./sales.controller');
const salesReturnController = require('./sales-return.controller');

// Module name for routes-tree grouping
router.moduleName = 'Public Sales';

// Public routes - NO authentication required
// These routes are for sharing invoices with customers

// Public Invoice Preview
// Note: This route is mounted at /public/sales, so full path is /api/public/sales/orders/invoices/:id/public
router.get('/orders/invoices/:id/public', (req, res) => {
  return salesController.getInvoiceById(req, res);
});

// Public Sales Returns by Order ID
// Note: This route is mounted at /public/sales, so full path is /api/public/sales/orders/:orderId/returns
router.get('/orders/:orderId/returns', (req, res) => {
  // Reuse the existing getSalesReturns but filter by order_id
  req.query.order_id = req.params.orderId;
  // Set a high limit to get all returns for the order
  req.query.limit = 100;
  return salesReturnController.getSalesReturns(req, res);
});

module.exports = router;
