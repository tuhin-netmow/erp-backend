const express = require('express');
const router = express.Router();
const reportController = require('./reports.controller');
const { verifyToken } = require('../../core/middleware/auth');
const { moduleCheck } = require('../../core/middleware/moduleCheck');
const { handlerWithFields } = require('../../core/utils/zodTypeView');
const validate = require('../../core/middleware/validate');
const { dateRangeSchema, monthYearSchema, yearSchema, dashboardFilterSchema } = require('./reports.validation');

// Module name for routes-tree grouping
router.moduleName = 'Reports';

router.use(verifyToken);
// router.use(moduleCheck('reports')); // Optional: Enable if you add a 'reports' toggle in settings

// Define routes metadata
router.routesMeta = [
    // --- Sales ---
    {
        path: '/sales/summary',
        method: 'GET',
        middlewares: [validate(dateRangeSchema, 'query')],
        handler: (req, res) => reportController.getSalesSummary(req, res),
        description: 'Get sales summary (revenue, orders)',
        queryParams: { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' },
        sampleResponse: {
            status: true,
            data: {
                total_orders: 150,
                total_revenue: 45000.00,
                average_order_value: 300.00
            }
        },
        examples: [
            {
                title: 'Sales Summary',
                description: 'Get sales summary within date range',
                url: '/api/reports/sales/summary?startDate=2025-01-01&endDate=2025-01-31',
                method: 'GET',
                response: {
                    status: true,
                    data: {
                        total_orders: 150,
                        total_revenue: 45000.00,
                        average_order_value: 300.00
                    }
                }
            }
        ]
    },
    {
        path: '/sales/top-customers',
        method: 'GET',
        middlewares: [validate(dateRangeSchema, 'query')],
        handler: (req, res) => reportController.getTopCustomers(req, res),
        description: 'Get top customers by revenue',
        queryParams: { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD', limit: 'Number' },
        sampleResponse: {
            success: true,
            message: 'Top customers retrieved',
            pagination: {
                total: 2,
                page: '1',
                limit: '5',
                totalPage: 1
            },
            data: [
                {
                    id: 1,
                    name: 'Acme Corp',
                    email: 'contact@acme.com',
                    order_count: 12,
                    total_spent: 15000.00
                },
                {
                    id: 5,
                    name: 'Global Tech',
                    email: 'info@globaltech.com',
                    order_count: 8,
                    total_spent: 9500.00
                }
            ]
        },
        examples: [
            {
                title: 'Top Customers',
                description: 'Get top 5 customers by revenue',
                url: '/api/reports/sales/top-customers?limit=5',
                method: 'GET',
                response: {
                    success: true,
                    message: 'Top customers retrieved',
                    data: [{ id: 1, name: 'Acme Corp', total_spent: 15000.00 }]
                }
            }
        ]
    },
    {
        path: '/sales/top-products',
        method: 'GET',
        middlewares: [validate(dateRangeSchema, 'query')],
        handler: (req, res) => reportController.getTopProducts(req, res),
        description: 'Get top selling products',
        queryParams: { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD', limit: 'Number' },
        sampleResponse: {
            success: true,
            message: 'Top products retrieved',
            pagination: {
                total: 2,
                page: '1',
                limit: '5',
                totalPage: 1
            },
            data: [
                {
                    id: 101,
                    name: 'Wireless Mouse',
                    sku: 'WM-001',
                    total_quantity_sold: 500,
                    total_revenue: 12500.00
                },
                {
                    id: 102,
                    name: 'Mechanical Keyboard',
                    sku: 'MK-002',
                    total_quantity_sold: 300,
                    total_revenue: 24000.00
                }
            ]
        },
        examples: [
            {
                title: 'Top Products',
                description: 'Get top 5 selling products',
                url: '/api/reports/sales/top-products?limit=5',
                method: 'GET',
                response: {
                    success: true,
                    message: 'Top products retrieved',
                    data: [{ id: 101, name: 'Wireless Mouse', total_revenue: 12500.00 }]
                }
            }
        ]
    },
    {
        path: '/sales/by-customer',
        method: 'GET',
        middlewares: [validate(dateRangeSchema, 'query')],
        handler: (req, res) => reportController.getSalesByCustomer(req, res),
        description: 'Get sales grouped by customer',
        queryParams: { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD', page: 'Number', limit: 'Number' },
        sampleResponse: {
            success: true,
            message: 'Sales by customer retrieved',
            pagination: {
                total: 2,
                page: 1,
                limit: 10,
                totalPage: 1
            },
            data: [
                { customer: "Tech Solutions Sdn Bhd", orders: 12, sales: 15000.00 },
                { customer: "Global Trading Co", orders: 5, sales: 8000.00 }
            ]
        },
        examples: [
            {
                title: 'Sales by Customer',
                description: 'Group sales by customer',
                url: '/api/reports/sales/by-customer?page=1&limit=10',
                method: 'GET',
                response: {
                    success: true,
                    message: 'Sales by customer retrieved',
                    data: [{ customer: "Tech Solutions Sdn Bhd", orders: 12, sales: 15000.00 }]
                }
            }
        ]
    },
    {
        path: '/customers',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => reportController.getCustomerStatistics(req, res),
        description: 'Get total customer statistics (count, sales, outstanding)',
        sampleResponse: {
            success: true,
            message: 'Customer statistics retrieved',
            data: {
                total_customers: 4,
                total_sales: 10000,
                total_outstanding_balance: 5000
            }
        },
        examples: [
            {
                title: 'Customer Statistics',
                description: 'Get overall customer stats',
                url: '/api/reports/customers',
                method: 'GET',
                response: {
                    success: true,
                    message: 'Customer statistics retrieved',
                    data: {
                        total_customers: 4,
                        total_sales: 10000,
                        total_outstanding_balance: 5000
                    }
                }
            }
        ]
    },
    {
        path: '/customers/account-receivables',
        method: 'GET',
        middlewares: [validate(dateRangeSchema, 'query')],
        handler: (req, res) => reportController.getAccountReceivables(req, res),
        description: 'Get account receivables (unpaid invoices)',
        queryParams: { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD', page: 'Number', limit: 'Number' },
        sampleResponse: {
            success: true,
            message: 'Account receivables retrieved',
            pagination: {
                total: 6,
                page: 1,
                limit: 10,
                totalPage: 1
            },
            data: [
                {
                    invoiceNumber: "INV-20251012-D72F5C",
                    customer: "Modern Enterprises",
                    date: "2025-10-12",
                    due: "2025-10-19",
                    total: 1325,
                    paid: 0,
                    balance: 1325
                },
                {
                    invoiceNumber: "INV2025003",
                    customer: "Innovative Systems",
                    date: "2025-10-03",
                    due: "2025-11-02",
                    total: 715.5,
                    paid: 0,
                    balance: 715.5
                }
            ]
        },
        examples: [
            {
                title: 'Account Receivables',
                description: 'Get pending customer payments',
                url: '/api/reports/customers/account-receivables?page=1',
                method: 'GET',
                response: {
                    success: true,
                    message: 'Account receivables retrieved',
                    data: [{ invoiceNumber: "INV-20251012-D72F5C", balance: 1325 }]
                }
            }
        ]
    },

    // --- Purchase ---
    {
        path: '/purchase/summary',
        method: 'GET',
        middlewares: [validate(dateRangeSchema, 'query')],
        handler: (req, res) => reportController.getPurchaseSummary(req, res),
        description: 'Get purchase summary',
        queryParams: { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' },
        sampleResponse: {
            status: true,
            data: {
                total_orders: 45,
                total_spent: 32000.00
            }
        },
        examples: [
            {
                title: 'Purchase Summary',
                description: 'Get purchase summary metrics',
                url: '/api/reports/purchase/summary?startDate=2025-01-01&endDate=2025-01-31',
                method: 'GET',
                response: {
                    status: true,
                    data: { total_orders: 45, total_spent: 32000.00 }
                }
            }
        ]
    },
    {
        path: '/purchase/by-supplier',
        method: 'GET',
        middlewares: [validate(dateRangeSchema, 'query')],
        handler: (req, res) => reportController.getSpendingBySupplier(req, res),
        description: 'Get spending breakdown by supplier',
        queryParams: { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD', limit: 'Number (default: 10)' },
        sampleResponse: {
            success: true,
            message: 'Supplier spending retrieved',
            pagination: {
                total: 2,
                page: '1',
                limit: '10',
                totalPage: 1
            },
            data: [
                {
                    id: 3,
                    name: 'Tech Supplies Inc',
                    po_count: 15,
                    total_spent: 18000.00
                },
                {
                    id: 7,
                    name: 'Office Depot',
                    po_count: 10,
                    total_spent: 5000.00
                }
            ]
        },
        examples: [
            {
                title: 'Spending by Supplier',
                description: 'Get spending breakdown',
                url: '/api/reports/purchase/by-supplier?limit=10',
                method: 'GET',
                response: {
                    success: true,
                    message: 'Supplier spending retrieved',
                    data: [{ name: 'Tech Supplies Inc', total_spent: 18000.00 }]
                }
            }
        ]
    },

    // --- Inventory ---
    {
        path: '/inventory/status',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => reportController.getInventoryStatus(req, res),
        description: 'Get current inventory status (low stock, out of stock)',
        sampleResponse: {
            status: true,
            data: {
                total_products: 500,
                low_stock_count: 12,
                out_of_stock_count: 3
            }
        },
        examples: [
            {
                title: 'Inventory Status',
                description: 'Get current stock status',
                url: '/api/reports/inventory/status',
                method: 'GET',
                response: {
                    status: true,
                    data: { total_products: 500, low_stock_count: 12 }
                }
            }
        ]
    },
    {
        path: '/inventory/valuation',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => reportController.getInventoryValuation(req, res),
        description: 'Get total inventory valuation, units and potential sales',
        sampleResponse: {
            status: true,
            data: {
                total_units: 1500,
                total_Valuation: 95000.00,
                potential_Sales_Value: 150000.00
            }
        },
        examples: [
            {
                title: 'Inventory Valuation',
                description: 'Get inventory financial value',
                url: '/api/reports/inventory/valuation',
                method: 'GET',
                response: {
                    status: true,
                    data: { total_Valuation: 95000.00 }
                }
            }
        ]
    },
    {
        path: '/inventory/low-stock-list',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => reportController.getLowStockList(req, res),
        description: 'Get list of products with low stock',
        queryParams: {
            page: 'Page number (default: 1)',
            limit: 'Items per page (default: 10)'
        },
        sampleResponse: {
            status: true,
            pagination: {
                total: 2,
                page: 1,
                limit: 10,
                totalPage: 1
            },
            data: [
                { sku: "SKU004", product: "Laptop Computer", stock: -16, minLevel: 5 },
                { sku: "SKU010", product: "Cable Management", stock: 1, minLevel: 10 }
            ]
        },
        examples: [
            {
                title: 'Low Stock List',
                description: 'Get items below minimum level',
                url: '/api/reports/inventory/low-stock-list',
                method: 'GET',
                response: {
                    status: true,
                    data: [{ sku: "SKU004", stock: -16 }]
                }
            }
        ]
    },

    // --- HR ---
    {
        path: '/hr/attendance',
        method: 'GET',
        middlewares: [validate(monthYearSchema, 'query')],
        handler: (req, res) => reportController.getAttendanceSummary(req, res),
        description: 'Get monthly attendance summary with pagination',
        queryParams: {
            month: '1-12',
            year: 'YYYY',
            page: 'Page number (default: 1)',
            limit: 'Items per page (default: 10)'
        },
        sampleResponse: {
            success: true,
            message: 'Attendance summary retrieved',
            pagination: {
                total: 20,
                page: '1',
                limit: '10',
                totalPage: 2
            },
            data: [
                {
                    id: 1,
                    first_name: 'John',
                    last_name: 'Doe',
                    present_days: 20,
                    late_days: 2,
                    absent_days: 0,
                    half_days: 0
                }
            ]
        },
        examples: [
            {
                title: 'Attendance Summary',
                description: 'Get monthly attendance summary',
                url: '/api/reports/hr/attendance?month=1&year=2025',
                method: 'GET',
                response: {
                    success: true,
                    message: 'Attendance summary retrieved',
                    data: [{ first_name: 'John', present_days: 20 }]
                }
            }
        ]
    },
    {
        path: '/hr/payroll',
        method: 'GET',
        middlewares: [validate(yearSchema, 'query')],
        handler: (req, res) => reportController.getPayrollSummary(req, res),
        description: 'Get annual payroll summary',
        queryParams: { year: 'YYYY' },
        sampleResponse: {
            success: true,
            message: 'Payroll summary retrieved',
            pagination: {
                total: 2,
                page: '1',
                limit: '12',
                totalPage: 1
            },
            data: [
                {
                    month: 'January',
                    staff_paid: 15,
                    total_basic: 75000.00,
                    total_net_payout: 72000.00
                },
                {
                    month: 'February',
                    staff_paid: 16,
                    total_basic: 80000.00,
                    total_net_payout: 76500.00
                }
            ]
        },
        examples: [
            {
                title: 'Payroll Summary',
                description: 'Get payroll summary for year',
                url: '/api/reports/hr/payroll?year=2025',
                method: 'GET',
                response: {
                    success: true,
                    message: 'Payroll summary retrieved',
                    data: [{ month: 'January', total_net_payout: 72000.00 }]
                }
            }
        ]
    },

    // --- Finance ---
    {
        path: '/finance/profit-loss',
        method: 'GET',
        middlewares: [validate(dateRangeSchema, 'query')],
        handler: (req, res) => reportController.getProfitLoss(req, res),
        description: 'Get Profit & Loss statement',
        queryParams: { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' },
        sampleResponse: {
            status: true,
            data: {
                revenue: 120000.00,
                cogs: 80000.00,
                gross_profit: 40000.00,
                expenses: 15000.00,
                net_profit: 25000.00
            }
        },
        examples: [
            {
                title: 'Profit & Loss',
                description: 'Get financial P&L statement',
                url: '/api/reports/finance/profit-loss?startDate=2025-01-01&endDate=2025-01-31',
                method: 'GET',
                response: {
                    status: true,
                    data: { net_profit: 25000.00 }
                }
            }
        ]
    },
    {
        path: '/sales/staff-wise',
        method: 'GET',
        middlewares: [validate(dateRangeSchema, 'query')],
        handler: (req, res) => reportController.getStaffWiseSales(req, res),
        description: 'Get sales grouped by staff member',
        queryParams: { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD', page: 'Number', limit: 'Number', search: 'String' },
        sampleResponse: {
            success: true,
            message: 'Staff wise sales retrieved',
            pagination: {
                total: 5,
                page: 1,
                limit: 10,
                totalPage: 1
            },
            data: [
                { id: 1, staff_name: "Ahmad Hassan", order_count: 15, total_sales: 4500.00 },
                { id: 2, staff_name: "Siti Nurhaliza", order_count: 12, total_sales: 3800.00 }
            ]
        }
    },
    {
        path: '/sales/staff-wise/orders',
        method: 'GET',
        middlewares: [validate(dateRangeSchema, 'query')],
        handler: (req, res) => reportController.getStaffWiseOrderHistory(req, res),
        description: 'Get detailed order history grouped by staff member with order items',
        queryParams: { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD', page: 'Number', limit: 'Number', search: 'String', staff_id: 'Number' },
        sampleResponse: {
            success: true,
            message: 'Staff order history retrieved',
            pagination: {
                total: 2,
                page: 1,
                limit: 10,
                totalPage: 1
            },
            data: [
                {
                    staff_id: 1,
                    staff_name: "Ahmad Hassan",
                    orders: [
                        {
                            order_id: 101,
                            order_number: "ORD-2024-001",
                            order_date: "2024-06-01",
                            customer: { id: 5, name: "Acme Corp", company: "Acme Corp" },
                            total_amount: 1500.00,
                            payment_status: "paid",
                            status: "delivered",
                            items: [
                                {
                                    item_id: 1,
                                    product_id: 10,
                                    product_name: "Wireless Mouse",
                                    product_image_url: "https://example.com/images/wireless-mouse.jpg",
                                    sku: "WM-001",
                                    quantity: 2,
                                    unit_price: 45.00,
                                    total_price: 90.00
                                },
                                {
                                    item_id: 2,
                                    product_id: 15,
                                    product_name: "USB Keyboard",
                                    product_image_url: null,
                                    sku: "UK-002",
                                    quantity: 1,
                                    unit_price: 75.00,
                                    total_price: 75.00
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    },
    {
        path: '/sales/staff-wise/products',
        method: 'GET',
        middlewares: [validate(dateRangeSchema, 'query')],
        handler: (req, res) => reportController.getStaffWiseProductHistory(req, res),
        description: 'Get detailed product sales grouped by staff member',
        queryParams: { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD', page: 'Number', limit: 'Number', search: 'String', staff_id: 'Number' },
        sampleResponse: {
            success: true,
            message: 'Staff product sales retrieved',
            pagination: {
                total: 2,
                page: 1,
                limit: 10,
                totalPage: 1
            },
            data: [
                {
                    staff_id: 1,
                    staff_name: "Ahmad Hassan",
                    products: [
                        {
                            product_id: 10,
                            product_name: "Wireless Mouse",
                            sku: "WM-001",
                            quantity_sold: 25,
                            unit_price: 45.00,
                            total_revenue: 1125.00,
                            orders_count: 15
                        }
                    ]
                }
            ]
        }
    },
    {
        path: '/invoices/staff-wise',
        method: 'GET',
        middlewares: [validate(dateRangeSchema, 'query')],
        handler: (req, res) => reportController.getStaffWiseInvoices(req, res),
        description: 'Get invoices grouped by staff member',
        queryParams: { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD', page: 'Number', limit: 'Number', search: 'String', staff_id: 'Number' },
        sampleResponse: {
            success: true,
            message: 'Staff wise invoices retrieved',
            pagination: {
                total: 5,
                page: 1,
                limit: 10,
                totalPage: 1
            },
            data: [
                {
                    staff_id: 1,
                    staff_name: "Ahmad Hassan",
                    total_invoices: 15,
                    total_amount: 4500.00,
                    paid_amount: 4000.00,
                    unpaid_amount: 500.00
                },
                {
                    staff_id: 2,
                    staff_name: "Siti Nurhaliza",
                    total_invoices: 12,
                    total_amount: 3800.00,
                    paid_amount: 3500.00,
                    unpaid_amount: 300.00
                }
            ]
        }
    },

    // --- My Reports (for logged-in staff member) ---
    {
        path: '/my/sales',
        method: 'GET',
        middlewares: [validate(dateRangeSchema, 'query')],
        handler: (req, res) => reportController.getMySales(req, res),
        description: 'Get my sales (for logged-in staff member)',
        queryParams: { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD', page: 'Number', limit: 'Number', search: 'String' },
        sampleResponse: {
            success: true,
            message: 'My sales retrieved',
            pagination: {
                total: 5,
                page: 1,
                limit: 10,
                totalPage: 1
            },
            data: [
                { customer_id: 1, customer_name: "Acme Corp", order_count: 15, total_sales: 4500.00 },
                { customer_id: 2, customer_name: "Global Tech", order_count: 12, total_sales: 3800.00 }
            ]
        }
    },
    {
        path: '/my/invoices',
        method: 'GET',
        middlewares: [validate(dateRangeSchema, 'query')],
        handler: (req, res) => reportController.getMyInvoices(req, res),
        description: 'Get my invoices (for logged-in staff member)',
        queryParams: { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD', page: 'Number', limit: 'Number', search: 'String' },
        sampleResponse: {
            success: true,
            message: 'My invoices retrieved',
            pagination: {
                total: 15,
                page: 1,
                limit: 10,
                totalPage: 2
            },
            data: [
                {
                    id: 1,
                    invoice_number: "INV-20251012-D72F5C",
                    customer_name: "Modern Enterprises",
                    invoice_date: "2025-10-12",
                    due_date: "2025-10-19",
                    total_amount: 1325,
                    paid_amount: 0,
                    payment_status: "unpaid",
                    balance_due: 1325
                }
            ]
        }
    },
    {
        path: '/my/customer-wise-sales',
        method: 'GET',
        middlewares: [validate(dateRangeSchema, 'query')],
        handler: (req, res) => reportController.getMyCustomerWiseSales(req, res),
        description: 'Get my customer-wise sales (for logged-in staff member)',
        queryParams: { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD', page: 'Number', limit: 'Number', search: 'String' },
        sampleResponse: {
            success: true,
            message: 'My customer wise sales retrieved',
            pagination: {
                total: 5,
                page: 1,
                limit: 10,
                totalPage: 1
            },
            data: [
                { customer_id: 1, customer_name: "Acme Corp", order_count: 15, total_sales: 4500.00 }
            ]
        }
    },
    {
        path: '/my/customer-wise-invoices',
        method: 'GET',
        middlewares: [validate(dateRangeSchema, 'query')],
        handler: (req, res) => reportController.getMyCustomerWiseInvoices(req, res),
        description: 'Get my customer-wise invoices (for logged-in staff member)',
        queryParams: { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD', page: 'Number', limit: 'Number', search: 'String' },
        sampleResponse: {
            success: true,
            message: 'My customer wise invoices retrieved',
            pagination: {
                total: 5,
                page: 1,
                limit: 10,
                totalPage: 1
            },
            data: [
                {
                    customer_id: 1,
                    customer_name: "Acme Corp",
                    invoice_count: 5,
                    total_amount: 4500.00,
                    paid_amount: 3000.00,
                    unpaid_amount: 1500.00
                }
            ]
        }
    },
    {
        path: '/customer-wise-invoices',
        method: 'GET',
        middlewares: [verifyToken, moduleCheck('reports')],
        handler: (req, res) => reportController.getCustomerWiseInvoices(req, res),
        description: 'Get all invoices for a specific customer within a date range',
        queryParams: { customer_id: 'Number (required)', startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD', page: 'Number', limit: 'Number', search: 'String' },
        sampleResponse: {
            success: true,
            message: 'Customer wise invoices retrieved',
            pagination: {
                total: 10,
                page: 1,
                limit: 10,
                totalPage: 1
            },
            data: [
                {
                    id: 1,
                    invoice_number: "INV-0001",
                    order_id: 1,
                    total_amount: 1500.00,
                    paid_amount: 1000.00,
                    status: "partial",
                    created_at: "2026-03-01T10:00:00.000Z",
                    due_date: "2026-03-15"
                }
            ]
        }
    },
    {
        path: '/my/customers',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => reportController.getMyCustomers(req, res),
        description: 'Get my customers (customers for whom logged-in staff has created orders)',
        queryParams: { search: 'String', limit: 'Number' },
        sampleResponse: {
            success: true,
            message: 'My customers retrieved successfully',
            data: {
                data: [
                    {
                        id: 1,
                        company: "Acme Corp",
                        name: "John Doe",
                        email: "john@acme.com",
                        phone: "1234567890",
                        address: "123 Main St",
                        status: "active"
                    }
                ],
                pagination: {
                    total: 10,
                    limit: 100
                }
            }
        }
    },
    {
        path: '/my/dashboard-statistics',
        method: 'GET',
        middlewares: [validate(dashboardFilterSchema, 'query')],
        handler: (req, res) => reportController.getDashboardStatistics(req, res),
        description: 'Get dashboard statistics for logged-in staff member',
        queryParams: { filter: 'Enum: thisWeek, thisMonth, lastMonth, thisYear (default: thisMonth)' },
        sampleResponse: {
            success: true,
            message: 'Dashboard statistics retrieved',
            data: {
                total_sales: 15000.00,
                total_orders: 25,
                total_invoices: 20,
                total_collections: 12000.00,
                period: {
                    filter: 'thisMonth',
                    start_date: '2026-03-01',
                    end_date: '2026-03-10'
                }
            }
        },
        examples: [
            {
                title: 'This Month Statistics',
                description: 'Get dashboard statistics for current month',
                url: '/api/reports/my/dashboard-statistics?filter=thisMonth',
                method: 'GET',
                response: {
                    success: true,
                    message: 'Dashboard statistics retrieved',
                    data: {
                        total_sales: 15000.00,
                        total_orders: 25,
                        total_invoices: 20,
                        total_collections: 12000.00
                    }
                }
            },
            {
                title: 'This Week Statistics',
                description: 'Get dashboard statistics for current week',
                url: '/api/reports/my/dashboard-statistics?filter=thisWeek',
                method: 'GET',
                response: {
                    success: true,
                    message: 'Dashboard statistics retrieved',
                    data: {
                        total_sales: 3500.00,
                        total_orders: 8,
                        total_invoices: 6,
                        total_collections: 2800.00
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
