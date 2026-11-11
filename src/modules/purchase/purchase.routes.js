const express = require('express');
const router = express.Router();
const purchaseController = require('./purchase.controller');
const { verifyToken } = require('../../core/middleware/auth');
const { moduleCheck } = require('../../core/middleware/moduleCheck');
const { handlerWithFields } = require('../../core/utils/zodTypeView');
const validate = require('../../core/middleware/validate');
const { createPurchaseOrder, updatePurchaseOrder, createPurchaseInvoice, updatePurchaseInvoice, createPurchasePayment, createPurchaseReceipt } = require('./purchase.validation');

// Module name for routes-tree grouping
router.moduleName = 'Purchase Orders';

router.use(verifyToken);
router.use(moduleCheck('purchase'));

// Define routes metadata
router.routesMeta = [
    // --- Purchase Orders ---
    {
        path: '/orders',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => purchaseController.getPurchaseOrders(req, res),
        description: 'Get all purchase orders with pagination',
        database: {
            tables: ['purchase_orders', 'purchase_order_items', 'suppliers', 'products'],
            mainTable: 'purchase_orders',
            fields: {
                purchase_orders: ['id', 'po_number', 'supplier_id', 'order_date', 'expected_delivery_date', 'status', 'total_amount', 'tax_amount', 'discount_amount', 'payment_status', 'notes', 'created_at'],
                suppliers: ['id', 'name', 'email', 'phone', 'contact_person'],
                purchase_order_items: ['id', 'purchase_order_id', 'product_id', 'quantity', 'unit_cost', 'discount', 'line_total'],
                products: ['id', 'name', 'sku', 'price', 'image_url']
            },
            relationships: [
                'purchase_orders.supplier_id -> suppliers.id (FK)',
                'purchase_order_items.purchase_order_id -> purchase_orders.id (FK)',
                'purchase_order_items.product_id -> products.id (FK)'
            ]
        },
        queryParams: {
            page: 'Page number (default: 1)',
            limit: 'Items per page (default: 10)',
            status: 'Filter by status (pending/approved/ordered/partial/received/cancelled)',
            supplier_id: 'Filter by supplier ID',
            search: 'Search by PO number'
        },
        sampleResponse: {
            success: true,
            message: 'Purchase orders retrieved successfully',
            pagination: {
                total: 10,
                page: '1',
                limit: '10',
                totalPage: 1
            },
            data: [
                {
                    id: 1,
                    po_number: 'PO-1733130000000-123',
                    supplier_id: 1,
                    total_amount: 500.00,
                    status: 'pending',
                    created_at: '2025-12-03T05:00:00.000Z'
                }
            ]
        },
        examples: [
            {
                title: 'List Purchase Orders',
                description: 'Get paginated list of purchase orders',
                url: '/api/purchase/orders?page=1&limit=10&status=pending',
                method: 'GET',
                response: {
                    success: true,
                    message: 'Purchase orders retrieved successfully',
                    pagination: { total: 10, page: '1', limit: '10', totalPage: 1 },
                    data: [{ id: 1, po_number: 'PO-1733130000000-123', status: 'pending' }]
                }
            }
        ]
    },
    {
        path: '/orders/approved',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => purchaseController.getApprovedPurchaseOrders(req, res),
        description: 'Get all approved purchase orders',
        database: {
            tables: ['purchase_orders', 'purchase_order_items', 'suppliers'],
            mainTable: 'purchase_orders',
            fields: {
                purchase_orders: ['id', 'po_number', 'supplier_id', 'status', 'total_amount', 'created_at'],
                suppliers: ['id', 'name']
            },
            relationships: [
                'purchase_orders.supplier_id -> suppliers.id (FK)'
            ]
        },
        queryParams: {
            page: 'Page number (default: 1)',
            limit: 'Items per page (default: 10)',
            search: 'Search by PO number'
        },
        sampleResponse: {
            success: true,
            message: 'Approved purchase orders retrieved successfully',
            pagination: {
                total: 5,
                page: '1',
                limit: '10',
                totalPage: 1
            },
            data: [
                {
                    id: 2,
                    po_number: 'PO-1733130000000-456',
                    supplier_id: 1,
                    total_amount: 1500.00,
                    status: 'approved',
                    created_at: '2025-12-04T05:00:00.000Z'
                }
            ]
        },
        examples: [
            {
                title: 'List Approved Purchase Orders',
                description: 'Get list of orders with status "approved"',
                url: '/api/purchase/orders/approved',
                method: 'GET',
                response: {
                    success: true,
                    message: 'Approved purchase orders retrieved successfully',
                    pagination: { total: 5, page: '1', limit: '10', totalPage: 1 },
                    data: [{ id: 2, po_number: 'PO-1733130000000-456', status: 'approved' }]
                }
            }
        ]
    },
    {
        path: '/orders',
        method: 'POST',
        middlewares: [validate(createPurchaseOrder)],
        handler: handlerWithFields((req, res) => purchaseController.createPurchaseOrder(req, res), createPurchaseOrder),
        description: 'Create a new purchase order. `po_number` and `total_amount` are auto-generated.',
        database: {
            tables: ['purchase_orders', 'purchase_order_items'],
            mainTable: 'purchase_orders',
            requiredFields: ['supplier_id', 'items'],
            optionalFields: ['order_date', 'expected_delivery_date', 'notes'],
            autoGeneratedFields: ['id', 'po_number', 'total_amount', 'created_at', 'updated_at'],
            relationships: [
                'purchase_orders.supplier_id -> suppliers.id (FK)',
                'purchase_order_items.purchase_order_id -> purchase_orders.id (FK)',
                'purchase_order_items.product_id -> products.id (FK)'
            ]
        },
        sampleRequest: {
            supplier_id: 1,
            order_date: '2025-12-02',
            expected_delivery_date: '2025-12-15',
            notes: 'Regular monthly stock',
            items: [
                {
                    product_id: 5,
                    quantity: 100,
                    unit_cost: 45.00,
                    discount: 50.00
                }
            ]
        },
        sampleResponse: {
            status: true,
            message: 'Purchase order created successfully',
            data: {
                id: 1,
                po_number: 'PO-1733131375000-123',
                total_amount: 4450.00,
                created_by: 1
            }
        },
        examples: [
            {
                title: 'Create Purchase Order',
                description: 'Create a new purchase order with items',
                url: '/api/purchase/orders',
                method: 'POST',
                request: {
                    supplier_id: 1,
                    order_date: '2025-12-02',
                    expected_delivery_date: '2025-12-15',
                    items: [{ product_id: 5, quantity: 100, unit_cost: 45.00 }]
                },
                response: {
                    status: true,
                    message: 'Purchase order created successfully',
                    data: { id: 1, po_number: 'PO-1733131375000-123' }
                }
            }
        ]
    },


    // --- Purchase Invoices ---
    {
        path: '/orders/invoices',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => purchaseController.getAllPurchaseInvoices(req, res),
        description: 'Get all purchase invoices with pagination',
        database: {
            tables: ['purchase_invoices', 'purchase_orders', 'suppliers'],
            mainTable: 'purchase_invoices',
            fields: {
                purchase_invoices: ['id', 'invoice_number', 'purchase_order_id', 'invoice_date', 'due_date', 'total_amount', 'status', 'created_at'],
                purchase_orders: ['id', 'po_number', 'supplier_id', 'total_amount', 'status'],
                suppliers: ['id', 'name', 'email', 'phone', 'contact_person']
            },
            relationships: [
                'purchase_invoices.purchase_order_id -> purchase_orders.id (FK)',
                'purchase_orders.supplier_id -> suppliers.id (FK)'
            ]
        },
        queryParams: {
            page: 'Page number (default: 1)',
            limit: 'Items per page (default: 10)',
            status: 'Filter by invoice status',
            supplier_id: 'Filter by supplier ID',
            search: 'Search by invoice number, supplier name, or supplier ID'
        },
        sampleResponse: {
            success: true,
            message: 'Purchase invoices retrieved successfully',
            pagination: {
                total: 5,
                page: '1',
                limit: '10',
                totalPage: 1
            },
            data: [
                {
                    id: 1,
                    invoice_number: 'PINV-1733130000000-123',
                    purchase_order_id: 1,
                    total_amount: 4500.00,
                    status: 'received',
                    created_at: '2025-12-03T05:00:00.000Z'
                }
            ]
        },
        examples: [
            {
                title: 'List Purchase Invoices',
                description: 'Get all purchase invoices',
                url: '/api/purchase/orders/invoices?page=1&limit=10',
                method: 'GET',
                response: {
                    success: true,
                    message: 'Purchase invoices retrieved successfully',
                    data: [{ id: 1, invoice_number: 'PINV-1733130000000-123' }]
                }
            }
        ]
    },
    {
        path: '/orders/invoices',
        method: 'POST',
        middlewares: [validate(createPurchaseInvoice)],
        handler: handlerWithFields((req, res) => purchaseController.createPurchaseInvoice(req, res), createPurchaseInvoice),
        description: 'Create a purchase invoice from a purchase order',
        database: {
            tables: ['purchase_invoices', 'purchase_orders'],
            mainTable: 'purchase_invoices',
            requiredFields: ['purchase_order_id'],
            optionalFields: ['due_date'],
            autoGeneratedFields: ['id', 'invoice_number', 'total_amount', 'invoice_date', 'created_at'],
            relationships: ['purchase_invoices.purchase_order_id -> purchase_orders.id (FK)']
        },
        sampleRequest: {
            purchase_order_id: 1,
            due_date: '2025-12-31'
        },
        sampleResponse: {
            status: true,
            message: 'Purchase invoice created successfully'
        },
        examples: [
            {
                title: 'Create Purchase Invoice',
                description: 'Generate an invoice from a purchase order',
                url: '/api/purchase/orders/invoices',
                method: 'POST',
                request: { purchase_order_id: 1, due_date: '2025-12-31' },
                response: {
                    status: true,
                    message: 'Purchase invoice created successfully'
                }
            }
        ]
    },
    {
        path: '/orders/invoices/:id',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => purchaseController.getPurchaseInvoiceById(req, res),
        description: 'Get purchase invoice details by ID',
        database: {
            tables: ['purchase_invoices', 'purchase_orders', 'suppliers'],
            mainTable: 'purchase_invoices',
            fields: {
                purchase_invoices: ['id', 'invoice_number', 'purchase_order_id', 'invoice_date', 'due_date', 'total_amount', 'status', 'created_at'],
                purchase_orders: ['id', 'po_number', 'supplier_id'],
                suppliers: ['id', 'name', 'email', 'phone', 'contact_person']
            },
            relationships: [
                'purchase_invoices.purchase_order_id -> purchase_orders.id (FK)',
                'purchase_orders.supplier_id -> suppliers.id (FK)'
            ]
        },
        sampleResponse: {
            status: true,
            message: 'Purchase invoice retrieved successfully',
            data: {
                id: 1,
                invoice_number: 'PINV-1733130000000-123',
                purchase_order_id: 1,
                invoice_date: '2025-12-08T10:00:00.000Z',
                due_date: '2025-12-31',
                total_amount: 4500.00,
                status: 'received',
                created_by: 1,
                created_at: '2025-12-08T10:00:00.000Z',
                purchase_order: {
                    id: 1,
                    po_number: 'PO-1733130000000-123',
                    supplier_id: 1,
                    total_amount: 4500.00,
                    status: 'approved'
                }
            }
        },
        examples: [
            {
                title: 'Get Purchase Invoice',
                description: 'Get invoice details by ID',
                url: '/api/purchase/orders/invoices/1',
                method: 'GET',
                response: {
                    status: true,
                    data: { id: 1, invoice_number: 'PINV-1733130000000-123' }
                }
            }
        ]
    },
    {
        path: '/orders/invoices/:id',
        method: 'PATCH',
        middlewares: [validate(updatePurchaseInvoice)],
        handler: handlerWithFields((req, res) => purchaseController.updatePurchaseInvoice(req, res), updatePurchaseInvoice),
        description: 'Update purchase invoice status (e.g., mark as paid)',
        database: {
            tables: ['purchase_invoices'],
            mainTable: 'purchase_invoices',
            fields: {
                purchase_invoices: ['status', 'due_date']
            }
        },
        sampleRequest: {
            status: 'paid'
        },
        sampleResponse: {
            status: true,
            message: 'Purchase invoice updated successfully',
            data: {
                id: 1,
                invoice_number: 'PINV-1733130000000-123',
                status: 'paid',
                total_amount: 4500.00
            }
        },
        examples: [
            {
                title: 'Update Purchase Invoice',
                description: 'Update invoice status',
                url: '/api/purchase/orders/invoices/1',
                method: 'PATCH',
                request: { status: 'paid' },
                response: {
                    status: true,
                    message: 'Purchase invoice updated successfully'
                }
            }
        ]
    },

    // --- Purchase Payments ---
    {
        path: '/orders/payments',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => purchaseController.getAllPurchasePayments(req, res),
        description: 'Get all purchase payments with pagination and search',
        database: {
            tables: ['purchase_payments', 'purchase_orders', 'purchase_invoices', 'suppliers'],
            mainTable: 'purchase_payments',
            fields: {
                purchase_payments: ['id', 'purchase_order_id', 'invoice_id', 'amount', 'payment_date', 'payment_method', 'reference_number', 'status', 'created_at'],
                purchase_orders: ['id', 'po_number', 'supplier_id'],
                suppliers: ['id', 'name', 'email', 'phone', 'contact_person'],
                purchase_invoices: ['id', 'invoice_number']
            },
            relationships: [
                'purchase_payments.purchase_order_id -> purchase_orders.id (FK)',
                'purchase_payments.invoice_id -> purchase_invoices.id (FK)',
                'purchase_orders.supplier_id -> suppliers.id (FK)'
            ]
        },
        queryParams: {
            page: 'Page number (default: 1)',
            limit: 'Items per page (default: 10)',
            purchase_order_id: 'Filter by purchase order ID',
            payment_method: 'Filter by payment method',
            search: 'Search by reference number'
        },
        sampleResponse: {
            success: true,
            message: 'Purchase payments retrieved successfully',
            pagination: {
                total: 15,
                page: '1',
                limit: '10',
                totalPage: 2
            },
            data: [
                {
                    id: 1,
                    purchase_order_id: 1,
                    invoice_id: 1,
                    amount: 4500.00,
                    payment_method: 'bank_transfer',
                    reference_number: 'PREF-123456',
                    payment_date: '2025-12-08T10:00:00.000Z',
                    created_at: '2025-12-08T10:00:00.000Z',
                    purchase_order: {
                        id: 1,
                        po_number: 'PO-1733130000000-123',
                        total_amount: 4500.00
                    },
                    invoice: {
                        id: 1,
                        invoice_number: 'PINV-1733130000000-123'
                    }
                }
            ]
        },
        examples: [
            {
                title: 'List Purchase Payments',
                description: 'Get list of payments made',
                url: '/api/purchase/orders/payments?page=1&limit=10',
                method: 'GET',
                response: {
                    success: true,
                    message: 'Purchase payments retrieved successfully',
                    data: [{ id: 1, amount: 4500.00, payment_method: 'bank_transfer' }]
                }
            }
        ]
    },
    {
        path: '/orders/payments',
        method: 'POST',
        middlewares: [validate(createPurchasePayment)],
        handler: handlerWithFields((req, res) => purchaseController.createPurchasePayment(req, res), createPurchasePayment),
        description: 'Record a payment for a purchase order',
        database: {
            tables: ['purchase_payments', 'purchase_orders', 'purchase_invoices'],
            mainTable: 'purchase_payments',
            requiredFields: ['purchase_order_id', 'amount', 'payment_method'],
            optionalFields: ['invoice_id', 'reference_number'],
            autoGeneratedFields: ['id', 'payment_date', 'created_at'],
            relationships: [
                'purchase_payments.purchase_order_id -> purchase_orders.id (FK)',
                'purchase_payments.invoice_id -> purchase_invoices.id (FK)'
            ]
        },
        sampleRequest: {
            purchase_order_id: 1,
            amount: 4500.00,
            payment_method: 'bank_transfer'
        },
        sampleResponse: {
            status: true,
            message: 'Purchase payment recorded successfully'
        },
        examples: [
            {
                title: 'Record Payment',
                description: 'Record a payment for a purchase order',
                url: '/api/purchase/orders/payments',
                method: 'POST',
                request: { purchase_order_id: 1, amount: 4500.00, payment_method: 'bank_transfer' },
                response: {
                    status: true,
                    message: 'Purchase payment recorded successfully'
                }
            }
        ]
    },
    {
        path: '/orders/payments/:id',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => purchaseController.getPurchasePaymentById(req, res),
        description: 'Get purchase payment details by ID',
        database: {
            tables: ['purchase_payments', 'purchase_orders', 'purchase_invoices'],
            mainTable: 'purchase_payments',
            fields: {
                purchase_payments: ['id', 'purchase_order_id', 'invoice_id', 'amount', 'payment_date', 'payment_method', 'reference_number', 'status', 'created_at'],
                purchase_orders: ['id', 'po_number'],
                purchase_invoices: ['id', 'invoice_number']
            },
            relationships: [
                'purchase_payments.purchase_order_id -> purchase_orders.id (FK)',
                'purchase_payments.invoice_id -> purchase_invoices.id (FK)'
            ]
        },
        sampleResponse: {
            status: true,
            message: 'Purchase payment retrieved successfully',
            data: {
                id: 1,
                purchase_order_id: 1,
                invoice_id: 1,
                amount: 4500.00,
                payment_method: 'bank_transfer',
                reference_number: 'PREF-123456',
                payment_date: '2025-12-08T10:00:00.000Z',
                created_at: '2025-12-08T10:00:00.000Z',
                purchase_order: {
                    id: 1,
                    po_number: 'PO-1733130000000-123'
                },
                invoice: {
                    id: 1,
                    invoice_number: 'PINV-1733130000000-123'
                }
            }
        },
        examples: [
            {
                title: 'Get Payment',
                description: 'Get payment details by ID',
                url: '/api/purchase/orders/payments/1',
                method: 'GET',
                response: {
                    status: true,
                    data: { id: 1, amount: 4500.00 }
                }
            }
        ]
    },


    // --- Purchase Order Specific Routes (moved to prevent route collision) ---
    {
        path: '/orders/:id',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => purchaseController.getPurchaseOrderById(req, res),
        description: 'Get purchase order details with populated supplier and product information',
        database: {
            tables: ['purchase_orders', 'purchase_order_items', 'suppliers', 'products', 'purchase_invoices', 'purchase_payments'],
            mainTable: 'purchase_orders',
            fields: {
                purchase_orders: ['id', 'po_number', 'supplier_id', 'order_date', 'expected_delivery_date', 'status', 'total_amount', 'tax_amount', 'discount_amount', 'payment_status', 'notes', 'created_at'],
                suppliers: ['id', 'name', 'email', 'phone', 'contact_person', 'address', 'city'],
                purchase_order_items: ['id', 'purchase_order_id', 'product_id', 'quantity', 'unit_cost', 'discount', 'line_total'],
                products: ['id', 'name', 'sku', 'price', 'image_url'],
                purchase_invoices: ['id', 'invoice_number', 'status', 'total_amount'],
                purchase_payments: ['id', 'amount', 'payment_date', 'payment_method']
            },
            relationships: [
                'purchase_orders.supplier_id -> suppliers.id (FK)',
                'purchase_order_items.purchase_order_id -> purchase_orders.id (FK)',
                'purchase_order_items.product_id -> products.id (FK)',
                'purchase_invoices.purchase_order_id -> purchase_orders.id (HasMany)',
                'purchase_payments.purchase_order_id -> purchase_orders.id (HasMany)'
            ]
        },
        sampleResponse: {
            status: true,
            data: {
                id: 1,
                po_number: 'PO-1733131375000-123',
                supplier_id: 1,
                order_date: '2025-12-02T00:00:00.000Z',
                status: 'pending',
                total_amount: 4500.00,
                notes: 'Regular monthly stock',
                expected_delivery_date: '2025-12-15',
                supplier: {
                    id: 1,
                    name: 'ABC Supplies Ltd',
                    email: 'contact@abcsupplies.com',
                    phone: '+1234567890',
                    contact_person: 'John Smith'
                },
                items: [
                    {
                        id: 1,
                        purchase_order_id: 1,
                        product_id: 5,
                        quantity: 100,
                        unit_cost: 45.00,
                        discount: 0.00,
                        line_total: 4500.00,
                        product: {
                            id: 5,
                            name: 'Office Chair',
                            sku: 'CHR-001',
                            price: 89.99,
                            image_url: 'http://example.com/chair.jpg'
                        }
                    }
                ],
                invoice: null,
                payments: []
            }
        },
        examples: [
            {
                title: 'Get Purchase Order',
                description: 'Get detailed purchase order info',
                url: '/api/purchase/orders/1',
                method: 'GET',
                response: {
                    status: true,
                    data: { id: 1, po_number: 'PO-123', supplier: { name: 'ABC Supplies' } }
                }
            }
        ]
    },
    {
        path: '/orders/:id',
        method: 'PUT',
        middlewares: [validate(updatePurchaseOrder)],
        handler: handlerWithFields((req, res) => purchaseController.updatePurchaseOrder(req, res), updatePurchaseOrder),
        description: 'Update purchase order',
        database: {
            tables: ['purchase_orders'],
            mainTable: 'purchase_orders',
            fields: {
                purchase_orders: ['status', 'notes', 'expected_delivery_date']
            }
        },
        sampleRequest: {
            status: 'approved'
        },
        sampleResponse: {
            status: true,
            message: 'Purchase order updated successfully'
        },
        examples: [
            {
                title: 'Update Purchase Order',
                description: 'Update status or details of a PO',
                url: '/api/purchase/orders/1',
                method: 'PUT',
                request: { status: 'approved' },
                response: {
                    status: true,
                    message: 'Purchase order updated successfully'
                }
            }
        ]
    },
    {
        path: '/orders/:id',
        method: 'DELETE',
        middlewares: [],
        handler: (req, res) => purchaseController.deletePurchaseOrder(req, res),
        description: 'Delete a purchase order',
        database: {
            tables: ['purchase_orders', 'purchase_order_items'],
            mainTable: 'purchase_orders',
            sideEffects: ['Deletes associated purchase_order_items']
        },
        sampleResponse: {
            status: true,
            message: 'Purchase order deleted successfully'
        },
        examples: [
            {
                title: 'Delete Purchase Order',
                description: 'Remove a purchase order',
                url: '/api/purchase/orders/1',
                method: 'DELETE',
                response: {
                    status: true,
                    message: 'Purchase order deleted successfully'
                }
            }
        ]
    },
    {
        path: '/orders/:id/receive',
        method: 'POST',
        middlewares: [validate(createPurchaseReceipt)],
        handler: handlerWithFields((req, res) => purchaseController.createPurchaseReceipt(req, res), createPurchaseReceipt),
        description: 'Record goods receipt for purchase order. This will automatically add stock to inventory.',
        database: {
            tables: ['purchase_receipts', 'purchase_orders', 'stock_movements', 'products'],
            mainTable: 'purchase_receipts',
            requiredFields: ['status'],
            optionalFields: ['receipt_date', 'received_by', 'notes'],
            autoGeneratedFields: ['id', 'receipt_number', 'received_at', 'created_at', 'updated_at'],
            relationships: [
                'purchase_receipts.purchase_order_id -> purchase_orders.id (FK)'
            ],
            sideEffects: [
                'Increases products.stock_quantity for each item in the purchase order',
                'Creates stock_movements records (movement_type: purchase, quantity: positive)',
                'Updates purchase_orders.status to received or partial',
                'Sets purchase_receipts.received_at timestamp when status is completed'
            ]
        },
        sampleRequest: {
            status: 'completed',
            receipt_date: '2025-12-09',
            received_by: 'John Doe',
            notes: 'All items received in good condition'
        },
        sampleResponse: {
            status: true,
            message: 'Purchase receipt recorded successfully'
        },
        examples: [
            {
                title: 'Receive Goods',
                description: 'Record goods receipt for a PO',
                url: '/api/purchase/orders/1/receive',
                method: 'POST',
                request: {
                    status: 'completed',
                    receipt_date: '2025-12-09',
                    notes: 'Items received'
                },
                response: {
                    status: true,
                    message: 'Purchase receipt recorded successfully'
                }
            }
        ]
    },

    // --- Map Locations ---
    {
        path: '/maps',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => purchaseController.getPurchaseOrderLocations(req, res),
        description: 'List of purchase orders with supplier locations for map display',
        database: {
            tables: ['purchase_orders', 'suppliers'],
            mainTable: 'purchase_orders',
            fields: {
                purchase_orders: ['id', 'po_number', 'supplier_id', 'total_amount', 'status'],
                suppliers: ['id', 'name', 'address', 'city', 'latitude', 'longitude']
            },
            relationships: [
                'purchase_orders.supplier_id -> suppliers.id (FK)'
            ]
        },
        sampleResponse: {
            status: true,
            data: {
                total: 5,
                locations: [
                    {
                        id: 1,
                        po_number: 'PO-1733130000000-123',
                        status: 'pending',
                        total_amount: 4500.00,
                        order_date: '2025-12-02T00:00:00.000Z',
                        expected_delivery_date: '2025-12-15T00:00:00.000Z',
                        supplier: {
                            id: 1,
                            name: 'ABC Supplies Ltd',
                            contact_person: 'John Smith',
                            address: '123 Industrial Park',
                            city: 'New York',
                            phone: '+1234567890',
                            email: 'contact@abcsupplies.com'
                        },
                        coordinates: {
                            lat: 40.7128,
                            lng: -74.0060
                        }
                    }
                ]
            }
        },
        examples: [
            {
                title: 'Purchase Order Map',
                description: 'Get supplier locations for purchase orders',
                url: '/api/purchase/maps',
                method: 'GET',
                response: {
                    status: true,
                    data: {
                        total: 5,
                        locations: [{ id: 1, po_number: 'PO-123', coordinates: { lat: 40.7, lng: -74.0 } }]
                    }
                }
            }
        ]
    }
];

// Register routes
router.routesMeta.forEach(r => {
    router[r.method.toLowerCase()](r.path, ...r.middlewares, r.handler);
});

module.exports = router;
