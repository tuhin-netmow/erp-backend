const express = require('express');
const router = express.Router();
const salesController = require('./sales.controller');
const { verifyToken } = require('../../core/middleware/auth');
const { moduleCheck } = require('../../core/middleware/moduleCheck');
const { handlerWithFields } = require('../../core/utils/zodTypeView');
const validate = require('../../core/middleware/validate');
const { createWarehouse, createOrder, createInvoice, createPayment, createDelivery, updateInvoiceStatus, createSalesRoute } = require('./sales.validation');

// Module name for routes-tree grouping
router.moduleName = 'Sales & Orders';

// Public route (unauthenticated download)
router.get('/public/invoices/:id/download', (req, res) => salesController.downloadInvoicePdfPublic(req, res));

router.use(verifyToken);
router.use(moduleCheck('sales'));

// Define routes metadata
router.routesMeta = [
    // --- Orders ---
    {
        path: '/orders',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => salesController.getAllOrders(req, res),
        description: 'Get all orders with pagination',
        database: {
            tables: ['orders', 'order_items', 'customers', 'products', 'deliveries'],
            mainTable: 'orders',
            fields: {
                orders: ['id', 'order_number', 'customer_id', 'order_date', 'status', 'total_amount', 'tax_amount', 'discount_amount', 'shipping_address', 'billing_address', 'payment_status', 'notes', 'due_date', 'delivery_date', 'created_at'],
                customers: ['id', 'name', 'email', 'phone', 'company'],
                order_items: ['id', 'order_id', 'product_id', 'quantity', 'unit_price', 'discount', 'line_total', 'notes', 'remark'],
                products: ['id', 'name', 'sku', 'price', 'image_url'],
                delivery: ['id', 'delivery_number', 'delivery_date', 'status', 'notes'],
                calculated: ['delivery_status']
            },
            relationships: [
                'orders.customer_id -> customers.id (FK)',
                'order_items.order_id -> orders.id (FK)',
                'order_items.product_id -> products.id (FK)',
                'orders.id -> deliveries.order_id (HasOne - Latest delivery only)'
            ]
        },
        queryParams: {
            page: 'Page number (default: 1)',
            limit: 'Items per page (default: 10)',
            status: 'Filter by order status',
            customer_id: 'Filter by customer ID',
            search: 'Search by order number'
        },
        sampleResponse: {
            success: true,
            message: 'Orders retrieved successfully',
            pagination: {
                total: 10,
                page: '1',
                limit: '10',
                totalPage: 1
            },
            data: [
                {
                    id: 1,
                    order_number: 'ORD-1733130000000',
                    customer_id: 1,
                    total_amount: '150.00',
                    status: 'pending',
                    delivery_status: 'delivered',
                    notes: 'Please deliver between 9 AM and 5 PM',
                    due_date: '2025-12-15',
                    created_at: '2025-12-03T05:00:00.000Z',
                    customer: {
                        id: 1,
                        name: 'John Doe',
                        email: 'john@example.com',
                        phone: '+1234567890',
                        company: 'ABC Corp'
                    },
                    items: [
                        {
                            id: 1,
                            order_id: 1,
                            product_id: 1,
                            quantity: 2,
                            unit_price: 50.00,
                            discount: 5.00,
                            line_total: 95.00,
                            product: {
                                id: 1,
                                name: 'Wireless Mouse',
                                sku: 'MOU-001',
                                price: 29.99,
                                image_url: 'http://example.com/thumb.jpg'
                            }
                        }
                    ],
                    delivery: {
                        id: 1,
                        delivery_number: 'DEL-123456',
                        delivery_date: '2025-12-09',
                        status: 'delivered',
                        notes: 'Left at reception'
                    }
                }
            ]
        },
        examples: [
            {
                title: 'Get all orders with default pagination',
                description: 'Retrieve all orders with default settings (page 1, 10 items per page)',
                url: '/api/sales/orders',
                method: 'GET',
                response: {
                    success: true,
                    message: 'Orders retrieved successfully',
                    pagination: { total: 25, page: '1', limit: '10', totalPage: 3 },
                    data: [{ id: 1, order_number: 'ORD-1733130000000', status: 'pending', total_amount: '150.00' }]
                }
            },
            {
                title: 'Filter orders by status',
                description: 'Get only pending orders',
                url: '/api/sales/orders?status=pending',
                method: 'GET',
                response: {
                    success: true,
                    message: 'Orders retrieved successfully',
                    pagination: { total: 5, page: '1', limit: '10', totalPage: 1 },
                    data: [{ id: 2, order_number: 'ORD-1733140000000', status: 'pending', total_amount: '200.00' }]
                }
            },
            {
                title: 'Search orders by order number',
                description: 'Find specific order by searching order number',
                url: '/api/sales/orders?search=ORD-123',
                method: 'GET',
                response: {
                    success: true,
                    message: 'Orders retrieved successfully',
                    pagination: { total: 1, page: '1', limit: '10', totalPage: 1 },
                    data: [{ id: 3, order_number: 'ORD-123456', status: 'confirmed', total_amount: '180.00' }]
                }
            }
        ]
    },
    {
        path: '/orders/bulk-delete-preview',
        method: 'POST',
        middlewares: [],
        handler: (req, res) => salesController.previewBulkDeleteOrders(req, res),
        description: 'Preview database records deletion risk before deleting orders'
    },
    {
        path: '/orders/bulk-delete',
        method: 'POST',
        middlewares: [],
        handler: (req, res) => salesController.bulkDeleteOrders(req, res),
        description: 'Bulk delete orders and related entities while archiving in deleted histories'
    },
    {
        path: '/orders',
        method: 'POST',
        middlewares: [validate(createOrder)],
        handler: handlerWithFields((req, res) => salesController.createOrder(req, res), createOrder),
        description: 'Create a new order. `order_number` and `total_amount` are auto-generated.',
        database: {
            tables: ['orders', 'order_items', 'stock_movements', 'products'],
            mainTable: 'orders',
            requiredFields: ['customer_id', 'items'],
            optionalFields: ['shipping_address', 'billing_address', 'notes', 'due_date', 'delivery_date'],
            autoGeneratedFields: ['id', 'order_number', 'total_amount', 'created_at', 'updated_at'],
            relationships: [
                'orders.customer_id -> customers.id (FK)',
                'order_items.order_id -> orders.id (FK)',
                'order_items.product_id -> products.id (FK)'
            ],
            sideEffects: [
                'Decreases products.stock_quantity for each item',
                'Creates stock_movements records (movement_type: sale, quantity: negative)',
                'Updates product stock levels automatically'
            ]
        },
        sampleRequest: {
            customer_id: 1,
            shipping_address: '123 Main St, New York, NY',
            billing_address: '123 Main St, New York, NY',
            notes: 'Please deliver between 9 AM and 5 PM',
            due_date: '2025-12-15',
            delivery_date: '2025-12-16',
            items: [
                {
                    product_id: 1,
                    quantity: 2,
                    unit_price: 50.00,
                    discount: 5.00,
                    line_total: 95.00,
                    notes: 'Handle with care',
                    remark: 'Gift wrap'
                }
            ]
        },
        sampleResponse: {
            status: true,
            message: 'Order created successfully',
            data: {
                id: 1,
                order_number: 'ORD-1733130000000-123',
                total_amount: 100.00,
                created_by: 1
            }
        },
        examples: [
            {
                title: 'Create simple order',
                description: 'Create order with single item',
                url: '/api/sales/orders',
                method: 'POST',
                request: {
                    customer_id: 1,
                    items: [{ product_id: 1, quantity: 2, unit_price: 50.00 }]
                },
                response: {
                    status: true,
                    message: 'Order created successfully',
                    data: { id: 1, order_number: 'ORD-1733130000000-123' }
                }
            }
        ]
    },
    {
        path: '/orders-items',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => salesController.getOrdersItems(req, res),
        description: 'Get items for multiple selected orders',
        queryParams: {
            orders: 'List of order IDs (e.g. [1,2] or 1,2)'
        },
        sampleResponse: {
            success: true,
            message: 'Orders items retrieved successfully',
            data: [
                {
                    id: 1,
                    items: []
                }
            ]
        }
    },
    {
        path: '/orders/:id',
        method: 'PUT',
        middlewares: [validate(createOrder)],
        handler: handlerWithFields((req, res) => salesController.updateOrder(req, res), createOrder),
        description: 'Update an existing order. Only pending orders can be edited.',
        database: {
            tables: ['orders', 'order_items', 'stock_movements', 'products'],
            mainTable: 'orders',
            requiredFields: ['customer_id', 'items'],
            optionalFields: ['shipping_address', 'billing_address', 'notes', 'due_date', 'delivery_date'],
            relationships: [
                'orders.customer_id -> customers.id (FK)',
                'order_items.order_id -> orders.id (FK)',
                'order_items.product_id -> products.id (FK)'
            ],
            sideEffects: [
                'Updates order items (replaces existing items)',
                'Adjusts stock based on quantity changes',
                'Creates stock_movements records for adjustments',
                'Recalculates total_amount'
            ]
        },
        sampleRequest: {
            customer_id: 1,
            shipping_address: '123 Main St, New York, NY',
            notes: 'Updated order notes',
            due_date: '2025-12-20',
            items: [
                {
                    product_id: 1,
                    quantity: 3,
                    unit_price: 50.00,
                    discount: 5.00,
                    sales_tax: 10,
                    specification: 'Color: Black',
                    remark: 'Updated quantity'
                }
            ]
        },
        sampleResponse: {
            status: true,
            message: 'Order updated successfully',
            data: {
                id: 1,
                order_number: 'ORD-1733130000000-123',
                customer_id: 1,
                status: 'pending',
                total_amount: 150.00,
                items: [
                    {
                        id: 1,
                        product_id: 1,
                        quantity: 3,
                        unit_price: '50.00',
                        discount: 5.00,
                        sales_tax: 10,
                        specification: 'Color: Black',
                        remark: 'Updated quantity',
                        line_total: 145.00
                    }
                ]
            }
        },
        examples: [{
            title: 'Update Order Items',
            description: 'Modify quantities and prices for a pending order',
            url: '/api/sales/orders/1',
            method: 'PUT',
            request: {
                customer_id: 1,
                items: [
                    { product_id: 1, quantity: 5, unit_price: 45.00, discount: 0, sales_tax: 0 }
                ]
            },
            response: {
                status: true,
                message: 'Order updated successfully'
            }
        }]
    },
    {
        path: '/orders/dummy',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => salesController.getDummyOrders(req, res),
        description: 'Get all dummy (pending) orders awaiting approval',
        database: {
            tables: ['orders'],
            mainTable: 'orders',
            fields: { orders: ['id', 'status'] }
        },
        queryParams: {
            page: 'Page number',
            limit: 'Items per page',
            search: 'Search term',
            customer_id: 'Filter by customer'
        },
        sampleResponse: {
            success: true,
            message: 'Dummy (Pending) orders retrieved successfully',
            data: [{ id: 1, status: 'pending' }]
        },
        examples: [{
            title: 'List Dummy Orders',
            description: 'Get all orders that are pending approval',
            url: '/api/sales/orders/dummy',
            method: 'GET',
            response: { success: true, data: [{ id: 1, status: 'pending' }] }
        }]
    },
    {
        path: '/orders/approved',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => salesController.getApprovedOrders(req, res),
        description: 'Get all approved (confirmed) orders',
        database: {
            tables: ['orders'],
            mainTable: 'orders',
            fields: { orders: ['id', 'status'] }
        },
        queryParams: {
            page: 'Page number',
            limit: 'Items per page',
            search: 'Search term',
            customer_id: 'Filter by customer'
        },
        sampleResponse: {
            success: true,
            message: 'Approved (Confirmed) orders retrieved successfully',
            data: [{ id: 1, status: 'confirmed' }]
        },
        examples: [{
            title: 'List Approved Orders',
            description: 'Get all confirm orders',
            url: '/api/sales/orders/approved',
            method: 'GET',
            response: { success: true, data: [{ id: 1, status: 'confirmed' }] }
        }]
    },
    {
        path: '/orders/:id/approve',
        method: 'PUT',
        middlewares: [],
        handler: (req, res) => salesController.approveOrder(req, res),
        description: 'Approve a dummy (pending) order',
        database: {
            tables: ['orders'],
            mainTable: 'orders',
            sideEffects: ['Updates status to confirmed']
        },
        sampleResponse: { success: true, message: 'Order approved successfully' },
        examples: [{
            title: 'Approve Order',
            description: 'Approve a pending order',
            url: '/api/sales/orders/1/approve',
            method: 'PUT',
            response: { success: true, message: 'Order approved successfully' }
        }]
    },
    {
        path: '/orders/:id/cancel',
        method: 'PUT',
        middlewares: [],
        handler: (req, res) => salesController.cancelOrder(req, res),
        description: 'Cancel (Reject) an order and restore stock',
        database: {
            tables: ['orders', 'products', 'stock_movements'],
            mainTable: 'orders',
            sideEffects: ['Updates status to cancelled', 'Restores product stock', 'Creates stock movement record']
        },
        sampleResponse: { success: true, message: 'Order cancelled successfully' },
        examples: [{
            title: 'Cancel Order',
            description: 'Cancel an order and return items to stock',
            url: '/api/sales/orders/1/cancel',
            method: 'PUT',
            response: { success: true, message: 'Order cancelled successfully' }
        }]
    },
    {
        path: '/orders/stats',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => salesController.getOrderStats(req, res),
        description: 'Get order statistics (Total, Pending, Delivered, Total Value)',
        database: {
            tables: ['orders'],
            mainTable: 'orders',
            fields: {
                calculated: ['totalOrders', 'pendingOrders', 'deliveredOrders', 'totalValue']
            }
        },
        sampleResponse: {
            status: true,
            message: 'Order stats retrieved successfully',
            data: {
                total_orders: 25,
                pending_orders: 5,
                delivered_orders: 6,
                total_value: "12,345.00"
            }
        },
        examples: [
            {
                title: 'Get order statistics',
                description: 'Retrieve current order statistics including totals and values',
                url: '/api/sales/orders/stats',
                method: 'GET',
                response: {
                    status: true,
                    message: 'Order stats retrieved successfully',
                    data: {
                        total_orders: 25,
                        pending_orders: 5,
                        delivered_orders: 6,
                        total_value: "12,345.00"
                    }
                }
            }
        ]
    },
    {
        path: '/orders/by-route',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => salesController.getOrdersBySalesRoute(req, res),
        description: 'Get sales orders grouped by route, supporting pagination and filters.',
        database: {
            tables: ['orders', 'customers', 'sales_routes'],
            mainTable: 'sales_routes',
            relationships: [
                'sales_routes.id -> customers.sales_route_id',
                'customers.id -> orders.customer_id'
            ]
        },
        queryParams: {
            page: 'Page number (default: 1)',
            limit: 'Items per page (default: 10)',
            sales_route_id: 'Filter by specific sales route ID (Optional)',
            status: 'Filter orders by status',
            date: 'Filter orders by date (YYYY-MM-DD)',
            search: 'Search route name'
        },
        sampleResponse: {
            success: true,
            message: 'Route-wise orders retrieved successfully',
            pagination: {
                total: 5,
                page: '1',
                limit: '10',
                totalPage: 1
            },
            data: [
                {
                    id: 1,
                    name: 'Dhaka North Route',
                    region: 'Dhaka',
                    orders: [
                        {
                            id: 1001,
                            order_number: 'ORD-1733130000000',
                            customer: 'Customer 1',
                            customer_image: 'https://example.com/customer1.jpg',
                            amount: 8500,
                            status: 'Delivered',
                            date: '2024-03-20'
                        }
                    ]
                }
            ]
        },
        examples: [
            {
                title: 'Get orders grouped by route',
                description: 'Retrieve all routes with their corresponding orders',
                url: '/api/sales/orders/by-route',
                method: 'GET',
                response: {
                    success: true,
                    pagination: { total: 4, page: '1', limit: '10', totalPage: 1 },
                    data: [
                        {
                            id: 1,
                            name: 'Dhaka North Route',
                            region: 'Dhaka',
                            orders: [{ id: 1001, order_number: 'ORD-1733130000000', customer: 'Customer 1', customer_image: 'https://example.com/customer1.jpg', amount: 8500, status: 'Delivered', date: '2024-03-20' }]
                        }
                    ]
                }
            },
            {
                title: 'Filter by route and order status',
                description: 'Get specific route orders filtered by status',
                url: '/api/sales/orders/by-route?sales_route_id=1&status=Pending',
                method: 'GET',
                response: {
                    success: true,
                    data: [
                        {
                            id: 1,
                            name: 'Dhaka North Route',
                            orders: [{ id: 1002, status: 'Pending' }]
                        }
                    ]
                }
            }
        ]
    },
    // --- Invoices ---
    {
        path: '/orders/invoices',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => salesController.getAllInvoices(req, res),
        description: 'Get all invoices with pagination. Returns paid_amount and remaining_balance for each invoice.',
        database: {
            tables: ['invoices', 'orders', 'customers', 'payments', 'order_items', 'products'],
            mainTable: 'invoices',
            fields: {
                invoices: ['id', 'invoice_number', 'order_id', 'invoice_date', 'due_date', 'total_amount', 'status', 'created_at'],
                orders: ['id', 'order_number', 'customer_id', 'total_amount', 'status'],
                customers: ['id', 'name', 'email', 'phone', 'company'],
                payments: ['id', 'amount', 'payment_date', 'payment_method', 'status'],
                calculated: ['paid_amount', 'remaining_balance']
            },
            relationships: [
                'invoices.order_id -> orders.id (FK)',
                'orders.customer_id -> customers.id (FK)',
                'invoices.id -> payments.invoice_id (HasMany)'
            ]
        },
        queryParams: {
            page: 'Page number (default: 1)',
            limit: 'Items per page (default: 10)',
            status: 'Filter by invoice status',
            customer_id: 'Filter by customer ID',
            search: 'Search by invoice number, customer name, or customer ID'
        },
        sampleResponse: {
            success: true,
            message: 'Invoices retrieved successfully',
            pagination: {
                total: 5,
                page: '1',
                limit: '10',
                totalPage: 1
            },
            data: [
                {
                    id: 1,
                    invoice_number: 'INV-1733130000000',
                    order_id: 1,
                    total_amount: '150.00',
                    paid_amount: 50.00,
                    remaining_balance: 100.00,
                    status: 'sent',
                    created_at: '2025-12-03T05:00:00.000Z',
                    order: {
                        id: 1,
                        order_number: 'ORD-1733130000000-123',
                        customer_id: 1,
                        total_amount: '150.00',
                        status: 'pending',
                        customer: {
                            id: 1,
                            name: 'John Doe',
                            email: 'john@example.com',
                            phone: '+1234567890',
                            company: 'ABC Corp'
                        },
                        items: [
                            {
                                id: 1,
                                product_id: 1,
                                quantity: 2,
                                unit_price: 50.00,
                                discount: 5.00,
                                line_total: 95.00,
                                product: {
                                    id: 1,
                                    name: 'Wireless Mouse',
                                    sku: 'MOU-001',
                                    price: 29.99,
                                    image_url: 'http://example.com/thumb.jpg'
                                }
                            }
                        ]
                    },
                    payments: [
                        {
                            id: 1,
                            amount: '50.00',
                            payment_date: '2025-12-10T10:00:00.000Z',
                            payment_method: 'credit_card',
                            status: 'completed'
                        }
                    ]
                }
            ]
        },
        examples: [
            {
                title: 'Get all invoices',
                description: 'Retrieve all invoices with pagination',
                url: '/api/sales/orders/invoices',
                method: 'GET',
                response: {
                    success: true,
                    message: 'Invoices retrieved successfully',
                    pagination: { total: 5, page: '1', limit: '10', totalPage: 1 },
                    data: [
                        {
                            id: 1,
                            invoice_number: 'INV-1733130000000',
                            total_amount: '150.00',
                            paid_amount: 50.00,
                            remaining_balance: 100.00,
                            status: 'sent',
                            order: { id: 1, order_number: 'ORD-1733130000000' }
                        }
                    ]
                }
            },
            {
                title: 'Filter unpaid invoices',
                description: 'Get only unpaid invoices',
                url: '/api/sales/orders/invoices?status=sent',
                method: 'GET',
                response: {
                    success: true,
                    message: 'Invoices retrieved successfully',
                    pagination: { total: 2, page: '1', limit: '10', totalPage: 1 },
                    data: [
                        {
                            id: 2,
                            invoice_number: 'INV-1733140000000',
                            total_amount: '200.00',
                            paid_amount: 0,
                            remaining_balance: 200.00,
                            status: 'sent'
                        }
                    ]
                }
            }
        ]
    },
    {
        path: '/orders/invoices/unpaid',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => salesController.getUnpaidInvoices(req, res),
        description: 'Get all unpaid invoices (not paid and not cancelled) with pagination',
        database: {
            tables: ['invoices', 'orders', 'customers', 'payments'],
            mainTable: 'invoices',
            fields: {
                invoices: ['id', 'invoice_number', 'order_id', 'invoice_date', 'due_date', 'total_amount', 'status', 'created_at'],
                orders: ['id', 'order_number', 'customer_id', 'total_amount', 'status'],
                customers: ['id', 'name', 'email', 'phone', 'company']
            },
            relationships: [
                'invoices.order_id -> orders.id (FK)',
                'orders.customer_id -> customers.id (FK)'
            ]
        },
        queryParams: {
            page: 'Page number (default: 1)',
            limit: 'Items per page (default: 10)',
            customer_id: 'Filter by customer ID',
            search: 'Search by invoice number, customer name, or customer ID'
        },
        sampleResponse: {
            success: true,
            message: 'Invoices retrieved successfully',
            pagination: {
                total: 5,
                page: '1',
                limit: '10',
                totalPage: 1
            },
            data: [
                {
                    id: 1,
                    invoice_number: 'INV-1733130000000',
                    total_amount: '150.00',
                    paid_amount: 50.00,
                    remaining_balance: 100.00,
                    status: 'sent'
                }
            ]
        },
        examples: [
            {
                title: 'Get all unpaid invoices',
                description: 'Retrieve list of all invoices with status not paid or cancelled',
                url: '/api/sales/orders/invoices/unpaid',
                method: 'GET',
                response: {
                    success: true,
                    message: 'Invoices retrieved successfully',
                    pagination: { total: 5, page: '1', limit: '10', totalPage: 1 },
                    data: [
                        {
                            id: 1,
                            invoice_number: 'INV-1733130000000',
                            total_amount: '150.00',
                            paid_amount: 50.00,
                            remaining_balance: 100.00,
                            status: 'sent'
                        }
                    ]
                }
            }
        ]
    },
    {
        path: '/orders/invoices/unpaid/customer/:customerId',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => salesController.getUnpaidInvoicesByCustomer(req, res),
        description: 'Get all unpaid invoices for a specific customer',
        database: {
            tables: ['invoices', 'orders', 'customers'],
            mainTable: 'invoices',
            fields: {
                invoices: ['id', 'invoice_number', 'order_id', 'total_amount', 'status'],
                orders: ['id', 'order_number', 'customer_id'],
                customers: ['id', 'name']
            },
            relationships: [
                'invoices.order_id -> orders.id (FK)',
                'orders.customer_id -> customers.id (FK)'
            ]
        },
        queryParams: {
            page: 'Page number (default: 1)',
            limit: 'Items per page (default: 10)',
            search: 'Search by invoice number'
        },
        sampleResponse: {
            success: true,
            message: 'Invoices retrieved successfully',
            data: []
        },
        examples: [
            {
                title: 'Get unpaid invoices for customer',
                description: 'Retrieve unpaid invoices for a specific customer (ID 1)',
                url: '/api/sales/orders/invoices/unpaid/customer/1',
                method: 'GET',
                response: {
                    success: true,
                    message: 'Invoices retrieved successfully',
                    data: [
                        {
                            id: 1,
                            invoice_number: 'INV-1733130000000',
                            total_amount: '150.00',
                            status: 'sent',
                            order: { id: 1, order_number: 'ORD-1733130000000' }
                        }
                    ]
                }
            }
        ]
    },
    {
        path: '/orders/invoices',
        method: 'POST',
        middlewares: [validate(createInvoice)],
        handler: handlerWithFields((req, res) => salesController.createInvoice(req, res), createInvoice),
        description: 'Create an invoice from an order. `invoice_number` and `total_amount` are auto-generated from the order.',
        database: {
            tables: ['invoices', 'orders'],
            mainTable: 'invoices',
            requiredFields: ['order_id'],
            optionalFields: ['due_date'],
            autoGeneratedFields: ['id', 'invoice_number', 'total_amount', 'invoice_date', 'created_at'],
            relationships: ['invoices.order_id -> orders.id (FK)']
        },
        sampleRequest: {
            order_id: 1,
            due_date: '2025-01-01'
        },
        sampleResponse: {
            status: true,
            message: 'Invoice created successfully'
        },
        examples: [
            {
                title: 'Create invoice for order',
                description: 'Generate invoice from existing order',
                url: '/api/sales/orders/invoices',
                method: 'POST',
                request: { order_id: 1, due_date: '2025-12-31' },
                response: {
                    status: true,
                    message: 'Invoice created successfully'
                }
            }
        ]
    },
    {
        path: '/orders/invoices/:id/status',
        method: 'PATCH',
        middlewares: [validate(require('./sales.validation').updateInvoiceStatus)],
        handler: (req, res) => salesController.updateInvoiceStatus(req, res),
        description: 'Update invoice status (e.g., mark as paid)',
        database: {
            tables: ['invoices', 'orders'],
            mainTable: 'invoices',
            requiredFields: ['status'],
            relationships: ['invoices.order_id -> orders.id (FK)'],
            sideEffects: [
                'Updates invoices.status',
                'Updates invoices.updated_at',
                'If status is paid, updates orders.payment_status to paid'
            ]
        },
        sampleRequest: {
            status: 'paid'
        },
        sampleResponse: {
            status: true,
            message: 'Invoice status updated successfully'
        },
        examples: [
            {
                title: 'Mark invoice as paid',
                description: 'Update invoice status to paid',
                url: '/api/sales/orders/invoices/1/status',
                method: 'PATCH',
                request: { status: 'paid' },
                response: {
                    status: true,
                    message: 'Invoice status updated successfully'
                }
            }
        ]
    },
    {
        path: '/orders/invoices/customer/:customerId',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => salesController.getInvoicesByCustomer(req, res),
        description: 'Get all invoices for a specific customer',
        database: {
            tables: ['invoices', 'customers'],
            mainTable: 'invoices',
            fields: {
                invoices: ['id', 'invoice_number', 'order_id', 'total_amount', 'status', 'created_at'],
                customers: ['id', 'name']
            },
            relationships: [
                'invoices.order_id -> orders.id (FK)',
                'orders.customer_id -> customers.id (FK)'
            ]
        },
        queryParams: {
            page: 'Page number (default: 1)',
            limit: 'Items per page (default: 10)',
            status: 'Filter by invoice status',
            search: 'Search by invoice number'
        },
        sampleResponse: {
            success: true,
            message: 'Customer invoices retrieved successfully',
            pagination: {
                total: 3,
                page: '1',
                limit: '10',
                totalPage: 1
            },
            data: [
                {
                    id: 1,
                    invoice_number: 'INV-1733130000000',
                    order_id: 1,
                    total_amount: '150.00',
                    status: 'sent',
                    created_at: '2025-12-03T05:00:00.000Z'
                }
            ]
        },
        examples: [
            {
                title: 'Get invoices by customer',
                description: 'Retrieve all invoices for a specific customer',
                url: '/api/sales/orders/invoices/customer/1',
                method: 'GET',
                response: {
                    success: true,
                    message: 'Customer invoices retrieved successfully',
                    pagination: { total: 3, page: '1', limit: '10', totalPage: 1 },
                    data: [
                        {
                            id: 1,
                            invoice_number: 'INV-1733130000000',
                            total_amount: '150.00',
                            status: 'sent',
                            order_id: 1
                        }
                    ]
                }
            }
        ]
    },
    {
        path: '/orders/invoices/:id/einvoice/generate',
        method: 'POST',
        middlewares: [],
        handler: (req, res) => salesController.generateEInvoice(req, res),
        description: 'Generate e-invoice draft and validate data locally.',
        database: {
            tables: ['invoices'],
            mainTable: 'invoices',
            sideEffects: ['Updates e_invoice_status to GENERATED']
        },
        sampleResponse: { success: true, message: 'E-Invoice generated successfully' }
    },
    {
        path: '/orders/invoices/:id/einvoice/submit',
        method: 'POST',
        middlewares: [],
        handler: (req, res) => salesController.submitEInvoice(req, res),
        description: 'Submit e-invoice to LHDN Authority.',
        database: {
            tables: ['invoices'],
            mainTable: 'invoices',
            sideEffects: ['Updates e_invoice_status to SUBMITTED/VALID', 'Sets e_invoice_uuid and e_invoice_qr_url']
        },
        sampleResponse: { success: true, message: 'E-Invoice submitted to LHDN successfully' }
    },
    {
        path: '/orders/invoices/:id',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => salesController.getInvoiceById(req, res),
        description: 'Get invoice details by ID. Returns paid_amount and remaining_balance.',
        database: {
            tables: ['invoices', 'orders', 'customers', 'payments'],
            mainTable: 'invoices',
            fields: {
                invoices: ['id', 'invoice_number', 'order_id', 'invoice_date', 'due_date', 'total_amount', 'status', 'created_at', 'created_by'],
                orders: ['id', 'order_number', 'customer_id', 'total_amount', 'status'],
                customers: ['id', 'name', 'email', 'phone', 'company', 'address', 'city', 'state', 'country', 'postal_code', 'tax_id'],
                payments: ['id', 'amount', 'payment_date', 'payment_method', 'status'],
                calculated: ['paid_amount', 'remaining_balance']
            },
            relationships: [
                'invoices.order_id -> orders.id (FK)',
                'orders.customer_id -> customers.id (FK)',
                'invoices.id -> payments.invoice_id (HasMany)'
            ]
        },
        sampleResponse: {
            status: true,
            message: 'Invoice retrieved successfully',
            data: {
                id: 1,
                invoice_number: 'INV-1733130000000-123',
                order_id: 1,
                invoice_date: '2025-12-08T10:00:00.000Z',
                due_date: '2025-12-15',
                total_amount: '100.00',
                paid_amount: 30.00,
                remaining_balance: 70.00,
                status: 'sent',
                created_by: 1,
                created_at: '2025-12-08T10:00:00.000Z',
                order: {
                    id: 1,
                    order_number: 'ORD-1733130000000-123',
                    customer_id: 1,
                    total_amount: 100.00,
                    status: 'pending',
                    items: [
                        {
                            id: 1,
                            order_id: 1,
                            product_id: 1,
                            quantity: 2,
                            unit_price: 50.00,
                            discount: 5.00,
                            line_total: 95.00,
                            product: {
                                id: 1,
                                name: 'Wireless Mouse',
                                sku: 'MOU-001',
                                price: 29.99,
                                image_url: 'http://example.com/thumb.jpg'
                            }
                        }
                    ]
                },
                payments: [
                    {
                        id: 1,
                        amount: '30.00',
                        payment_date: '2025-12-10T10:00:00.000Z',
                        payment_method: 'credit_card',
                        status: 'completed'
                    }
                ]
            }
        },
        examples: [
            {
                title: 'Get invoice by ID',
                description: 'Retrieve detailed invoice information',
                url: '/api/sales/orders/invoices/1',
                method: 'GET',
                response: {
                    status: true,
                    message: 'Invoice retrieved successfully',
                    data: {
                        id: 1,
                        invoice_number: 'INV-1733130000000',
                        total_amount: '100.00',
                        paid_amount: 30.00,
                        remaining_balance: 70.00,
                        status: 'sent',
                        order: { id: 1, order_number: 'ORD-123' },
                        payments: [{ id: 1, amount: '30.00', status: 'completed' }]
                    }
                }
            }
        ]
    },

    // --- Payments ---
    {
        path: '/orders/payments',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => salesController.getAllPayments(req, res),
        description: 'Get all payments with pagination and search',
        database: {
            tables: ['payments', 'orders', 'invoices', 'customers'],
            mainTable: 'payments',
            fields: {
                payments: ['id', 'order_id', 'invoice_id', 'amount', 'payment_date', 'payment_method', 'reference_number', 'status', 'created_at'],
                orders: ['id', 'order_number', 'customer_id'],
                customers: ['id', 'name', 'email', 'phone', 'company'],
                invoices: ['id', 'invoice_number']
            },
            relationships: [
                'payments.order_id -> orders.id (FK)',
                'payments.invoice_id -> invoices.id (FK)',
                'orders.customer_id -> customers.id (FK)'
            ]
        },
        actions: ['View Invoice', 'Receipt Print'],
        queryParams: {
            page: 'Page number (default: 1)',
            limit: 'Items per page (default: 10)',
            order_id: 'Filter by order ID',
            payment_method: 'Filter by payment method',
            search: 'Search by reference number'
        },
        sampleResponse: {
            success: true,
            message: 'Payments retrieved successfully',
            pagination: {
                total: 25,
                page: '1',
                limit: '10',
                totalPage: 3
            },
            data: [
                {
                    id: 1,
                    order_id: 1,
                    invoice_id: 1,
                    amount: '100.00',
                    payment_method: 'credit_card',
                    reference_number: 'REF-123456',
                    payment_date: '2025-12-08T10:00:00.000Z',
                    created_at: '2025-12-08T10:00:00.000Z',
                    order: {
                        id: 1,
                        order_number: 'ORD-1733130000000-123',
                        total_amount: '100.00',
                        customer: {
                            id: 1,
                            name: 'John Doe',
                            email: 'john@example.com',
                            phone: '+1234567890',
                            company: 'ABC Corp'
                        }
                    },
                    invoice: {
                        id: 1,
                        invoice_number: 'INV-1733130000000-123'
                    }
                }
            ]
        },
        examples: [
            {
                title: 'Get all payments',
                description: 'Retrieve all payment records',
                url: '/api/sales/orders/payments',
                method: 'GET',
                response: {
                    success: true,
                    message: 'Payments retrieved successfully',
                    pagination: { total: 25, page: '1', limit: '10', totalPage: 3 },
                    data: [
                        {
                            id: 1,
                            amount: '100.00',
                            payment_method: 'credit_card',
                            payment_date: '2025-12-08T10:00:00.000Z',
                            order: { id: 1, order_number: 'ORD-123' },
                            invoice: { id: 1, invoice_number: 'INV-123' }
                        }
                    ]
                }
            },
            {
                title: 'Filter payments by order',
                description: 'Get payments for specific order',
                url: '/api/sales/orders/payments?order_id=1',
                method: 'GET',
                response: {
                    success: true,
                    message: 'Payments retrieved successfully',
                    pagination: { total: 2, page: '1', limit: '10', totalPage: 1 },
                    data: [
                        {
                            id: 1,
                            order_id: 1,
                            amount: '100.00',
                            payment_method: 'credit_card',
                            payment_date: '2025-12-08T10:00:00.000Z'
                        }
                    ]
                }
            }
        ]
    },
    {
        path: '/orders/payments',
        method: 'POST',
        middlewares: [validate(createPayment)],
        handler: handlerWithFields((req, res) => salesController.createPayment(req, res), createPayment),
        description: 'Record a payment for an order. Validates that payment amount does not exceed remaining balance.',
        database: {
            tables: ['payments', 'orders', 'invoices'],
            mainTable: 'payments',
            requiredFields: ['order_id', 'amount', 'payment_method'],
            optionalFields: ['invoice_id', 'reference_number', 'status'],
            autoGeneratedFields: ['id', 'payment_date', 'created_at'],
            relationships: [
                'payments.order_id -> orders.id (FK)',
                'payments.invoice_id -> invoices.id (FK)'
            ],
            validations: [
                'Payment amount must not exceed invoice remaining balance',
                'Cannot create payment if invoice is already fully paid',
                'Status defaults to "completed" if not provided'
            ]
        },
        sampleRequest: {
            order_id: 1,
            amount: 100.00,
            payment_method: 'credit_card'
        },
        sampleResponse: {
            status: true,
            message: 'Payment recorded successfully'
        },
        examples: [
            {
                title: 'Record payment',
                description: 'Record payment for an invoice',
                url: '/api/sales/orders/payments',
                method: 'POST',
                request: {
                    order_id: 1,
                    amount: 100.00,
                    payment_method: 'credit_card'
                },
                response: {
                    status: true,
                    message: 'Payment recorded successfully'
                }
            }
        ]
    },
    {
        path: '/orders/payments/:id',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => salesController.getPaymentById(req, res),
        description: 'Get payment details by ID',
        database: {
            tables: ['payments', 'orders', 'invoices'],
            mainTable: 'payments',
            fields: {
                payments: ['id', 'order_id', 'invoice_id', 'amount', 'payment_method', 'reference_number', 'payment_date', 'created_at'],
                orders: ['id', 'order_number'],
                invoices: ['id', 'invoice_number']
            },
            relationships: [
                'payments.order_id -> orders.id (FK)',
                'payments.invoice_id -> invoices.id (FK)'
            ]
        },
        sampleResponse: {
            status: true,
            message: 'Payment retrieved successfully',
            data: {
                id: 1,
                order_id: 1,
                invoice_id: 1,
                amount: '100.00',
                payment_method: 'credit_card',
                reference_number: 'REF-123456',
                payment_date: '2025-12-08T10:00:00.000Z',
                created_at: '2025-12-08T10:00:00.000Z',
                order: {
                    id: 1,
                    order_number: 'ORD-1733130000000-123'
                },
                invoice: {
                    id: 1,
                    invoice_number: 'INV-1733130000000-123'
                }
            }
        },
        examples: [
            {
                title: 'Get payment by ID',
                description: 'Retrieve detailed payment information',
                url: '/api/sales/orders/payments/1',
                method: 'GET',
                response: {
                    status: true,
                    message: 'Payment retrieved successfully',
                    data: {
                        id: 1,
                        amount: '100.00',
                        payment_method: 'credit_card',
                        payment_date: '2025-12-08T10:00:00.000Z',
                        order: { id: 1, order_number: 'ORD-123' },
                        invoice: { id: 1, invoice_number: 'INV-123' }
                    }
                }
            }
        ]
    },

    {
        path: '/orders/:id',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => salesController.getOrderById(req, res),
        description: 'Get order details with populated customer and product information',
        database: {
            tables: ['orders', 'customers', 'order_items', 'products', 'invoices', 'payments', 'deliveries'],
            mainTable: 'orders',
            fields: {
                orders: ['id', 'order_number', 'customer_id', 'order_date', 'status', 'total_amount', 'shipping_address', 'billing_address', 'notes', 'due_date'],
                customers: ['id', 'name', 'email', 'phone', 'company'],
                order_items: ['id', 'order_id', 'product_id', 'quantity', 'unit_price', 'discount', 'line_total', 'total_price'],
                products: ['id', 'name', 'sku', 'price', 'image_url'],
                invoices: ['id', 'invoice_number', 'status', 'total_amount'],
                payments: ['id', 'amount', 'payment_date', 'payment_method'],
                deliveries: ['id', 'delivery_number', 'delivery_date', 'status', 'notes'],
                calculated: ['delivery_status', 'total_invoice_amount', 'total_discount', 'total_payable_amount', 'total_paid_amount']
            },
            relationships: [
                'orders.customer_id -> customers.id (FK)',
                'order_items.order_id -> orders.id (FK)',
                'order_items.product_id -> products.id (FK)',
                'invoices.order_id -> orders.id (HasOne)',
                'payments.order_id -> orders.id (HasMany)',
                'orders.id -> deliveries.order_id (HasMany)'
            ]
        },
        sampleResponse: {
            status: true,
            data: {
                id: 1,
                order_number: 'ORD-1733130000000-123',
                customer_id: 1,
                order_date: '2025-12-08T10:00:00.000Z',
                status: 'pending',
                delivery_status: 'delivered',
                total_amount: 100.00,
                total_invoice_amount: 100.00,
                total_discount: 10.00,
                total_payable_amount: 90.00,
                total_paid_amount: 20.00,
                shipping_address: '123 Main St, New York, NY',
                billing_address: '123 Main St, New York, NY',
                notes: 'Please deliver between 9 AM and 5 PM',
                due_date: '2025-12-15',
                customer: {
                    id: 1,
                    name: 'John Doe',
                    email: 'john@example.com',
                    phone: '+1234567890',
                    company: 'ABC Corp'
                },
                items: [
                    {
                        id: 1,
                        order_id: 1,
                        product_id: 1,
                        quantity: 2,
                        unit_price: 50.00,
                        discount: 5.00,
                        line_total: 95.00,
                        total_price: 95.00,
                        product: {
                            id: 1,
                            name: 'Wireless Mouse',
                            sku: 'MOU-001',
                            price: '29.99',
                            image_url: 'http://example.com/thumb.jpg'
                        }
                    }
                ],
                invoice: null,
                payments: [],
                deliveries: []
            }
        },
        examples: [
            {
                title: 'Get order by ID',
                description: 'Retrieve complete order details',
                url: '/api/sales/orders/1',
                method: 'GET',
                response: {
                    status: true,
                    data: {
                        id: 1,
                        order_number: 'ORD-1733130000000',
                        status: 'pending',
                        total_amount: 150.00
                    }
                }
            }
        ]
    },
    {
        path: '/orders/:id/deliver',
        method: 'POST',
        middlewares: [validate(createDelivery)],
        handler: handlerWithFields((req, res) => salesController.createDelivery(req, res), createDelivery),
        description: 'Record order delivery',
        database: {
            tables: ['deliveries', 'orders'],
            mainTable: 'deliveries',
            requiredFields: ['status'],
            optionalFields: ['delivery_date', 'delivery_address', 'delivery_person_name', 'delivery_person_phone', 'tracking_number', 'notes'],
            autoGeneratedFields: ['id', 'delivery_number', 'delivered_at', 'created_at'],
            relationships: ['deliveries.order_id -> orders.id (FK)'],
            sideEffects: [
                'Updates orders.status to delivered (if status=delivered)',
                'Updates orders.status to in_transit (if status=in_transit)',
                'Updates orders.status to confirmed (if status=confirmed)',
                'Updates orders.status to returned (if status=returned)',
                'Updates orders.status to failed (if status=failed)',
                'Sets deliveries.delivered_at timestamp when status is delivered',
                'Allowed status values: pending, confirmed, in_transit, delivered, failed, returned'
            ]
        },
        sampleRequest: {
            status: 'confirmed',
            delivery_date: '2025-12-09',
            notes: 'Delivery confirmed by customer'
        },
        sampleResponse: {
            status: true,
            message: 'Delivery recorded successfully'
        },
        examples: [
            {
                title: 'Mark order as delivered',
                description: 'Record delivery for an order',
                url: '/api/sales/orders/1/deliver',
                method: 'POST',
                request: { status: 'delivered', delivery_date: '2025-12-10' },
                response: {
                    status: true,
                    message: 'Delivery recorded successfully'
                }
            }
        ]
    },

    // --- Order Items ---
    {
        path: '/orders/:orderId/items',
        method: 'POST',
        middlewares: [],
        handler: (req, res) => salesController.addOrderItem(req, res),
        description: 'Add a new item to an existing order. Only works for pending orders. Automatically deducts stock.',
        database: {
            tables: ['orders', 'order_items', 'products', 'stock_movements'],
            mainTable: 'order_items',
            requiredFields: ['product_id', 'quantity'],
            optionalFields: ['unit_price', 'discount', 'sales_tax', 'remark'],
            relationships: [
                'order_items.order_id -> orders.id (FK)',
                'order_items.product_id -> products.id (FK)',
                'stock_movements.product_id -> products.id (FK)',
                'stock_movements.reference_id -> orders.id (when reference_type="order")'
            ],
            sideEffects: [
                'Creates new order item record',
                'Deducts product stock by quantity (stock movement type: "sale", negative quantity)',
                'Creates stock_movement record with reference_type="order" and reference_id=order_id',
                'Recalculates order totals (total_amount, discount_amount, tax_amount)',
                'Validates stock availability before adding item',
                'Only works for orders with status="pending"'
            ]
        },
        sampleRequest: {
            product_id: 102,
            quantity: 10,
            unit_price: 0.68,
            discount: 2.00,
            sales_tax: 10,
            remark: 'Added to order'
        },
        sampleResponse: {
            status: true,
            message: 'Order item added successfully',
            data: {
                id: 46,
                order_id: 22,
                product_id: 102,
                quantity: 10,
                unit_price: '0.68',
                discount: 2.00,
                sales_tax: 10,
                sales_tax_percent: 10,
                tax_amount: '0.50',
                line_total: 5.62,
                remark: 'Added to order',
                product: {
                    id: 102,
                    name: 'ISPAHANI POTATO CRACKERS',
                    sku: 'FZ-0178',
                    price: '0.68',
                    specification: '200g pack',
                    stock_quantity: 27,
                    unit: {
                        id: 1,
                        name: 'Pieces',
                        symbol: 'PCS'
                    }
                }
            }
        },
        examples: [{
            title: 'Add New Item to Order',
            description: 'Add a product to an existing pending order',
            url: '/api/sales/orders/22/items',
            method: 'POST',
            request: {
                product_id: 102,
                quantity: 10,
                unit_price: 0.68,
                discount: 2.00,
                sales_tax: 10,
                remark: 'Customer requested this item'
            },
            response: {
                status: true,
                message: 'Order item added successfully',
                data: {
                    id: 46,
                    quantity: 10,
                    line_total: 5.62
                }
            }
        }]
    },
    {
        path: '/orders/:orderId/items/:itemId',
        method: 'PUT',
        middlewares: [],
        handler: (req, res) => salesController.updateOrderItem(req, res),
        description: 'Update a single order item (quantity, price, discount, tax, remark). Only works for pending orders. Automatically adjusts stock when quantity changes.',
        database: {
            tables: ['orders', 'order_items', 'products', 'stock_movements'],
            mainTable: 'order_items',
            requiredFields: [],
            optionalFields: ['quantity', 'unit_price', 'discount', 'sales_tax', 'remark'],
            relationships: [
                'order_items.order_id -> orders.id (FK)',
                'order_items.product_id -> products.id (FK)',
                'stock_movements.product_id -> products.id (FK)',
                'stock_movements.reference_id -> orders.id (when reference_type="order")'
            ],
            sideEffects: [
                'Updates order item values (quantity, unit_price, discount, sales_tax, remark)',
                'Recalculates order totals (total_amount, discount_amount, tax_amount)',
                'Adjusts product stock when quantity changes:',
                '  - If quantity INCREASES: stock decreases (stock movement type: "sale", negative quantity)',
                '  - If quantity DECREASES: stock increases (stock movement type: "return", positive quantity)',
                '  - Creates stock_movement record with reference_type="order" and reference_id=order_id',
                '  - Validates stock availability before increasing quantity',
                'Only works for orders with status="pending"'
            ]
        },
        sampleRequest: {
            quantity: 15,
            unit_price: 0.68,
            discount: 2.00,
            sales_tax: 10,
            remark: 'Updated via edit modal'
        },
        sampleResponse: {
            status: true,
            message: 'Order item updated successfully',
            data: {
                id: 45,
                order_id: 22,
                product_id: 102,
                quantity: 15,
                unit_price: '0.68',
                discount: 2.00,
                sales_tax: 10,
                sales_tax_percent: 10,
                tax_amount: '0.75',
                line_total: 8.43,
                remark: 'Updated via edit modal',
                product: {
                    id: 102,
                    name: 'ISPAHANI POTATO CRACKERS',
                    sku: 'FZ-0178',
                    price: '0.68',
                    specification: '200g pack',
                    stock_quantity: 37,
                    unit: {
                        id: 1,
                        name: 'Pieces',
                        symbol: 'PCS'
                    }
                }
            }
        },
        examples: [{
            title: 'Update Item Quantity',
            description: 'Change quantity of a single item',
            url: '/api/sales/orders/22/items/45',
            method: 'PUT',
            request: {
                quantity: 15,
                unit_price: 0.68,
                discount: 2.00,
                sales_tax: 10
            },
            response: {
                status: true,
                message: 'Order item updated successfully',
                data: {
                    id: 45,
                    quantity: 15,
                    line_total: 8.43
                }
            }
        }]
    },
    {
        path: '/orders/:orderId/items/:itemId',
        method: 'DELETE',
        middlewares: [],
        handler: (req, res) => salesController.deleteOrderItem(req, res),
        description: 'Delete a single order item. Only works for pending orders. Automatically restores stock.',
        database: {
            tables: ['orders', 'order_items', 'products', 'stock_movements'],
            mainTable: 'order_items',
            requiredFields: [],
            optionalFields: [],
            relationships: [
                'order_items.order_id -> orders.id (FK)',
                'order_items.product_id -> products.id (FK)',
                'stock_movements.product_id -> products.id (FK)',
                'stock_movements.reference_id -> orders.id (when reference_type="order")'
            ],
            sideEffects: [
                'Deletes order item record from database',
                'Restores product stock by item quantity (stock movement type: "return", positive quantity)',
                'Creates stock_movement record with reference_type="order" and reference_id=order_id',
                'Recalculates order totals (total_amount, discount_amount, tax_amount)',
                'Only works for orders with status="pending"',
                'Stock is increased by the deleted item\'s quantity'
            ]
        },
        sampleResponse: {
            status: true,
            message: 'Order item deleted successfully',
            data: {
                itemId: 45,
                quantity: 10,
                stockRestored: 10
            }
        },
        examples: [
            {
                title: 'Delete Order Item',
                description: 'Remove an item from an order and restore stock',
                url: '/api/sales/orders/22/items/45',
                method: 'DELETE',
                response: {
                    status: true,
                    message: 'Order item deleted successfully',
                    data: {
                        itemId: 45,
                        quantity: 10,
                        stockRestored: 10
                    }
                }
            }
        ]
    },

    // --- Warehouses ---
    {
        path: '/warehouses',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => salesController.getWarehouses(req, res),
        description: 'List all warehouses',
        database: {
            tables: ['warehouses'],
            mainTable: 'warehouses',
            fields: {
                warehouses: ['id', 'name', 'location']
            }
        },
        sampleResponse: {
            status: true,
            data: [
                {
                    id: 1,
                    name: 'Main Warehouse',
                    location: 'New York'
                }
            ]
        },
        examples: [
            {
                title: 'Get all warehouses',
                description: 'Retrieve list of all warehouses',
                url: '/api/sales/warehouses',
                method: 'GET',
                response: {
                    status: true,
                    data: [
                        { id: 1, name: 'Main Warehouse', location: 'New York' }
                    ]
                }
            }
        ]
    },
    {
        path: '/warehouses',
        method: 'POST',
        middlewares: [validate(createWarehouse)],
        handler: handlerWithFields((req, res) => salesController.createWarehouse(req, res), createWarehouse),
        description: 'Add a new warehouse',
        database: {
            tables: ['warehouses'],
            mainTable: 'warehouses',
            requiredFields: ['name', 'location'],
            optionalFields: ['capacity', 'is_active'],
            autoGeneratedFields: ['id', 'created_at', 'updated_at']
        },
        sampleRequest: {
            name: 'West Coast Hub',
            location: 'Los Angeles',
            capacity: 10000
        },
        sampleResponse: {
            status: true,
            message: 'Warehouse created successfully'
        },
        examples: [
            {
                title: 'Create new warehouse',
                description: 'Register a new warehouse location',
                url: '/api/sales/warehouses',
                method: 'POST',
                request: {
                    name: 'West Coast Hub',
                    location: 'Los Angeles',
                    capacity: 10000
                },
                response: {
                    status: true,
                    message: 'Warehouse created successfully'
                }
            }
        ]
    },

    // --- Sales Routes ---
    {
        path: '/routes',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => salesController.getSalesRoutes(req, res),
        description: 'List all sales routes',
        database: {
            tables: ['sales_routes'],
            mainTable: 'sales_routes',
            fields: {
                sales_routes: ['id', 'route_name', 'description', 'start_location', 'end_location', 'is_active', 'zoom_level', 'country', 'state', 'city', 'postal_code', 'center_lat', 'center_lng', 'coverage_radius']
            }
        },
        sampleResponse: {
            status: true,
            data: []
        },
        examples: [
            {
                title: 'Get all sales routes',
                description: 'Retrieve all configured sales routes',
                url: '/api/sales/routes',
                method: 'GET',
                response: {
                    status: true,
                    data: [
                        {
                            id: 1,
                            route_name: 'Downtown Route',
                            center_lat: 40.7128,
                            center_lng: -74.0060
                        }
                    ]
                }
            }
        ]
    },
    {
        path: '/sales-route',
        method: 'POST',
        middlewares: [validate(createSalesRoute)],
        handler: handlerWithFields((req, res) => salesController.createSalesRoute(req, res), createSalesRoute),
        description: 'Create a new sales route with map details',
        database: {
            tables: ['sales_routes'],
            mainTable: 'sales_routes',
            requiredFields: ['route_name'],
            optionalFields: ['description', 'assigned_sales_rep_id', 'start_location', 'end_location', 'is_active', 'zoom_level', 'country', 'state', 'city', 'postal_code', 'center_lat', 'center_lng', 'coverage_radius', 'end_lat', 'end_lng', 'end_city', 'end_state', 'end_country', 'end_postal_code'],
            autoGeneratedFields: ['id', 'created_at', 'updated_at']
        },
        sampleRequest: {
            routeName: 'Downtown Route',
            description: 'Main downtown delivery area',
            zoomLevel: 12,
            country: 'USA',
            state: 'NY',
            city: 'New York',
            postalCode: '10001',
            centerLat: 40.7128,
            centerLng: -74.0060,
            endLat: 40.8100,
            endLng: -73.9600,
            endCity: 'New York',
            endState: 'NY',
            endCountry: 'USA',
            endPostalCode: '10027',
            coverageRadius: 5.5
        },
        sampleResponse: {
            status: true,
            message: 'Sales route created successfully',
            data: {
                id: 1,
                route_name: 'Downtown Route',
                zoom_level: 12,
                country: 'USA'
            }
        },
        examples: [
            {
                title: 'Create sales route',
                description: 'Create a new delivery route definition',
                url: '/api/sales/sales-route',
                method: 'POST',
                request: {
                    routeName: 'Uptown Route',
                    description: 'Northern city delivery area',
                    zoomLevel: 12,
                    centerLat: 40.8000,
                    centerLng: -73.9500,
                    endLat: 40.8100,
                    endLng: -73.9600,
                    endCity: 'New York',
                    endState: 'NY',
                    endCountry: 'USA',
                    endPostalCode: '10027'
                },
                response: {
                    status: true,
                    message: 'Sales route created successfully',
                    data: { id: 2, route_name: 'Uptown Route' }
                }
            }
        ]
    },
    {
        path: '/sales-route/:id',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => salesController.getSalesRouteById(req, res),
        description: 'Get sales route details by ID',
        database: {
            tables: ['sales_routes', 'customers', 'orders'],
            mainTable: 'sales_routes',
            fields: {
                sales_routes: ['id', 'route_name', 'description', 'zoom_level', 'center_lat', 'center_lng', 'end_lat', 'end_lng', 'end_city', 'end_state', 'end_country', 'end_postal_code']
            }
        },
        sampleResponse: {
            status: true,
            message: 'Sales route retrieved successfully',
            data: { id: 1, route_name: 'Downtown' }
        },
        examples: [
            {
                title: 'Get sales route details',
                description: 'Retrieve details for a specific sales route',
                url: '/api/sales/sales-route/1',
                method: 'GET',
                response: {
                    status: true,
                    message: 'Sales route retrieved successfully',
                    data: {
                        id: 1,
                        route_name: 'Downtown Route',
                        zoom_level: 12,
                        center_lat: 40.7128,
                        center_lng: -74.0060,
                        end_lat: 40.8100,
                        end_lng: -73.9600,
                        end_city: 'New York',
                        end_state: 'NY',
                        end_country: 'USA',
                        customers: []
                    }
                }
            }
        ]
    },
    {
        path: '/sales-route/:id',
        method: 'PUT',
        middlewares: [],
        handler: (req, res) => salesController.updateSalesRoute(req, res),
        description: 'Update sales route details',
        database: {
            tables: ['sales_routes'],
            mainTable: 'sales_routes',
            requiredFields: [],
            optionalFields: ['route_name', 'description', 'zoom_level', 'center_lat', 'center_lng', 'end_lat', 'end_lng', 'end_city', 'end_state', 'end_country', 'end_postal_code']
        },
        sampleRequest: {
            routeName: 'Updated Downtown Route',
            zoomLevel: 14,
            endCity: 'Chicago'
        },
        sampleResponse: {
            status: true,
            message: 'Sales route updated successfully',
            data: { id: 1, route_name: 'Updated Downtown Route' }
        },
        examples: [
            {
                title: 'Update sales route',
                description: 'Update the name and zoom level of a sales route',
                url: '/api/sales/sales-route/1',
                method: 'PUT',
                request: { routeName: 'New Downtown Route', zoomLevel: 14 },
                response: {
                    status: true,
                    message: 'Sales route updated successfully',
                    data: { id: 1, route_name: 'New Downtown Route', zoom_level: 14 }
                }
            }
        ]
    },
    {
        path: '/sales-route/:id',
        method: 'DELETE',
        middlewares: [],
        handler: (req, res) => salesController.deleteSalesRoute(req, res),
        description: 'Delete a sales route',
        database: {
            tables: ['sales_routes'],
            mainTable: 'sales_routes',
            sideEffects: ['Deletes sales route record', 'Sets customer.sales_route_id to null (if constraints allow)']
        },
        sampleResponse: {
            status: true,
            message: 'Sales route deleted successfully'
        },
        examples: [
            {
                title: 'Delete sales route',
                description: 'Remove a sales route from the system',
                url: '/api/sales/sales-route/1',
                method: 'DELETE',
                response: {
                    status: true,
                    message: 'Sales route deleted successfully'
                }
            }
        ]
    },
    {
        path: '/staff-routes',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => salesController.getStaffRoutes(req, res),
        description: 'Get all staff members with their assigned sales routes and statistics',
        database: {
            tables: ['staffs', 'sales_routes', 'orders', 'sales_route_assignments'],
            fields: {
                staffs: ['id', 'first_name', 'last_name', 'email', 'phone', 'position', 'is_active'],
                sales_routes: ['id', 'route_name', 'is_active'],
                orders: ['status']
            }
        },
        queryParams: {
            page: 'Page number',
            limit: 'Items per page',
            search: 'Search by staff name or email'
        },
        sampleResponse: {
            success: true,
            message: 'Staff routes retrieved successfully',
            data: [
                {
                    id: 1,
                    name: 'Staff Member 1',
                    role: 'Sales Representative',
                    email: 'staff1@example.com',
                    phone: '+8801700000001',
                    active: true,
                    routes: [
                        { id: 1, name: 'Dhaka North - Sector 1', status: 'Active', orders: 22 }
                    ],
                    stats: { completedOrders: 420, rating: 4.5 }
                }
            ]
        },
        examples: [
            {
                title: 'List Stats Routes',
                description: 'Get list of staff with their assigned routes',
                url: '/api/sales/staff-routes',
                method: 'GET',
                response: {
                    success: true,
                    message: "Staff routes retrieved successfully",
                    data: [{ id: 1, name: "John Doe", routes: [] }]
                }
            }
        ]
    },

    // Order Management - Staff Assignment
    {
        path: '/orders/management',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => salesController.getOrdersWithStaff(req, res),
        description: 'Get all orders with assigned staff for order management',
        database: {
            tables: ['orders', 'customers', 'staffs', 'order_staff'],
            fields: {
                orders: ['id', 'order_number', 'customer_id', 'order_date', 'status', 'total_amount'],
                customers: ['id', 'name', 'company'],
                staffs: ['id', 'first_name', 'last_name', 'email', 'position'],
                order_staff: ['assigned_at', 'role']
            }
        },
        queryParams: {
            page: 'Page number',
            limit: 'Items per page',
            status: 'Filter by order status',
            search: 'Search by order number'
        },
        sampleResponse: {
            success: true,
            message: 'Orders with staff retrieved successfully',
            data: [
                {
                    id: 101,
                    order_number: 'ORD-101',
                    customer: 'Tech Solutions',
                    order_date: '2023-10-25',
                    status: 'Pending',
                    total_amount: 1500.00,
                    assigned_staff: []
                },
                {
                    id: 102,
                    order_number: 'ORD-102',
                    customer: 'Global Traders',
                    order_date: '2023-10-24',
                    status: 'Shipped',
                    total_amount: 8500.00,
                    assigned_staff: [
                        { id: 1, name: 'John Doe', email: 'john@example.com', position: 'Sales Rep' }
                    ]
                }
            ]
        },
        examples: [
            {
                title: 'Get Orders for Management',
                description: 'Retrieve orders with staff assignments',
                url: '/api/sales/orders/management',
                method: 'GET',
                response: {
                    success: true,
                    message: 'Orders with staff retrieved successfully',
                    data: [{ id: 101, order_number: 'ORD-101', assigned_staff: [] }]
                }
            }
        ]
    },
    {
        path: '/orders/:id/assign-staff',
        method: 'POST',
        middlewares: [],
        handler: (req, res) => salesController.assignStaffToOrder(req, res),
        description: 'Assign multiple staff members to an order',
        database: {
            tables: ['order_staff'],
            requiredFields: ['staff_ids'],
            sideEffects: ['Replaces all existing staff assignments for the order']
        },
        sampleRequest: {
            staff_ids: [1, 2, 3]
        },
        sampleResponse: {
            status: true,
            message: 'Staff assigned to order successfully',
            data: {
                id: 101,
                order_number: 'ORD-101',
                assignedStaff: [
                    { id: 1, first_name: 'John', last_name: 'Doe' },
                    { id: 2, first_name: 'Jane', last_name: 'Smith' }
                ]
            }
        },
        examples: [
            {
                title: 'Assign Staff to Order',
                description: 'Assign one or more staff members to handle an order',
                url: '/api/sales/orders/101/assign-staff',
                method: 'POST',
                request: { staff_ids: [1, 2] },
                response: {
                    status: true,
                    message: 'Staff assigned to order successfully'
                }
            }
        ]
    },
    {
        path: '/sales-route/:id/assign',
        method: 'PATCH',
        middlewares: [],
        handler: (req, res) => salesController.assignSalesRoute(req, res),
        description: 'Assign a sales rep (staff) to a sales route',
        database: {
            tables: ['sales_routes', 'users'],
            mainTable: 'sales_routes',
            requiredFields: ['staff_id'],
            relationships: ['sales_routes.assigned_sales_rep_id -> users.id (FK)']
        },
        sampleRequest: {
            staff_id: 5
        },
        sampleResponse: {
            status: true,
            message: 'Sales route assigned successfully'
        },
        examples: [
            {
                title: 'Assign staff to route',
                description: 'Assign a staff member to manage this sales route',
                url: '/api/sales/sales-route/1/assign',
                method: 'PATCH',
                request: { staff_id: 5 },
                response: {
                    status: true,
                    message: 'Sales route assigned successfully',
                    data: { id: 1, assigned_sales_rep_id: 5 }
                }
            }
        ]
    },
    {
        path: '/sales-route/:id/assign',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => salesController.getSalesRouteAssignment(req, res),
        description: 'Get current staff assignment for a sales route',
        database: {
            tables: ['sales_routes', 'users'],
            mainTable: 'sales_routes',
            fields: {
                sales_routes: ['id', 'route_name', 'assigned_sales_rep_id']
            }
        },
        sampleResponse: {
            status: true,
            message: 'Sales route assignment retrieved successfully',
            data: { id: 1, assigned_sales_rep_id: 5 }
        },
        examples: [
            {
                title: 'Get route assignment',
                description: 'Check which staff member is assigned to the route',
                url: '/api/sales/sales-route/1/assign',
                method: 'GET',
                response: {
                    status: true,
                    message: 'Sales route assignment retrieved successfully',
                    data: {
                        id: 1,
                        route_name: 'Downtown Route',
                        assigned_sales_rep_id: 5
                    }
                }
            }
        ]
    },

    // --- Reports & Charts ---
    {
        path: '/reports/sales/summary',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => salesController.getSalesSummary(req, res),
        description: 'Get sales summary with datewise filter',
        database: {
            tables: ['orders'],
            mainTable: 'orders',
            fields: {
                orders: ['id', 'order_date', 'total_amount', 'tax_amount', 'discount_amount', 'status', 'payment_status'],
                calculated: ['total_orders', 'total_sales', 'average_order_value', 'total_tax', 'total_discount']
            }
        },
        queryParams: {
            start_date: 'Start date for filtering (YYYY-MM-DD) - Required',
            end_date: 'End date for filtering (YYYY-MM-DD) - Required'
        },
        sampleResponse: {
            status: true,
            message: 'Sales summary retrieved successfully',
            data: {
                start_date: '2025-01-01',
                end_date: '2025-12-31',
                summary: {
                    total_orders: 150,
                    total_sales: 320000,
                    average_order_value: 2133.33,
                    total_tax: 25600,
                    total_discount: 15000
                },
                status_breakdown: [
                    { status: 'pending', count: 30, amount: 64000 },
                    { status: 'confirmed', count: 50, amount: 106666.67 },
                    { status: 'delivered', count: 70, amount: 149333.33 }
                ],
                payment_status_breakdown: [
                    { payment_status: 'paid', count: 100, amount: 213333.33 },
                    { payment_status: 'pending', count: 50, amount: 106666.67 }
                ]
            }
        },
        examples: [
            {
                title: 'Get sales summary for 2025',
                url: '/api/reports/sales/summary?start_date=2025-01-01&end_date=2025-12-31',
                response: {
                    status: true,
                    message: 'Sales summary retrieved successfully',
                    data: {
                        start_date: '2025-01-01',
                        end_date: '2025-12-31',
                        summary: {
                            total_orders: 150,
                            total_sales: 320000,
                            average_order_value: 2133.33
                        }
                    }
                }
            },
            {
                title: 'Get sales summary for December 2025',
                url: '/api/reports/sales/summary?start_date=2025-12-01&end_date=2025-12-31',
                response: {
                    status: true,
                    message: 'Sales summary retrieved successfully',
                    data: {
                        start_date: '2025-12-01',
                        end_date: '2025-12-31',
                        summary: {
                            total_orders: 15,
                            total_sales: 32000
                        }
                    }
                }
            }
        ]
    },
    {
        path: '/reports/charts',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => salesController.getReportsCharts(req, res),
        description: 'Get sales chart data with datewise filter',
        database: {
            tables: ['orders'],
            mainTable: 'orders',
            fields: {
                orders: ['id', 'order_date', 'total_amount'],
                calculated: ['date', 'amount', 'order_count']
            }
        },
        queryParams: {
            start_date: 'Start date for filtering (YYYY-MM-DD) - Required',
            end_date: 'End date for filtering (YYYY-MM-DD) - Required'
        },
        sampleResponse: {
            status: true,
            message: 'Chart data retrieved successfully',
            data: {
                start_date: '2025-01-01',
                end_date: '2025-01-31',
                data: [
                    { date: '2025-01-01', amount: 5000, order_count: 15 },
                    { date: '2025-01-02', amount: 6000, order_count: 18 },
                    { date: '2025-01-03', amount: 4500, order_count: 13 },
                    { date: '2025-01-04', amount: 7200, order_count: 21 },
                    { date: '2025-01-05', amount: 8100, order_count: 24 }
                ]
            }
        },
        examples: [
            {
                title: 'Get daily data for January 2025',
                url: '/api/sales/reports/charts?start_date=2025-01-01&end_date=2025-01-31',
                response: {
                    data: [
                        { date: '2025-01-01', amount: 5000, order_count: 15 },
                        { date: '2025-01-02', amount: 6000, order_count: 18 }
                    ]
                }
            },
            {
                title: 'Get data for a specific week',
                url: '/api/sales/reports/charts?start_date=2025-12-01&end_date=2025-12-07',
                response: {
                    data: [
                        { date: '2025-12-01', amount: 5000, order_count: 15 },
                        { date: '2025-12-02', amount: 6000, order_count: 18 }
                    ]
                }
            },
            {
                title: 'Get data for entire year',
                url: '/api/sales/reports/charts?start_date=2025-01-01&end_date=2025-12-31',
                response: {
                    data: [
                        { date: '2025-01-01', amount: 5000, order_count: 15 },
                        { date: '2025-01-02', amount: 6000, order_count: 18 }
                    ]
                }
            }
        ]
    },
    {
        path: '/invoices/:id/pdf',
        method: 'POST',
        middlewares: [],
        handler: (req, res) => salesController.generateInvoicePdf(req, res),
        description: 'Generate Invoice PDF and upload it to local/DO storage. Returns download links.'
    }
];

// Register routes
router.routesMeta.forEach(r => {
    router[r.method.toLowerCase()](r.path, ...r.middlewares, r.handler);
});

module.exports = router;
