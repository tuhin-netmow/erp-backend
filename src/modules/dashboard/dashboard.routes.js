const express = require('express');
const router = express.Router();
const dashboardController = require('./dashboard.controller');
const { verifyToken } = require('../../core/middleware/auth');

// Module name for routes-tree grouping
router.moduleName = 'Dashboard';

router.use(verifyToken);

// Define routes metadata
router.routesMeta = [
    {
        path: '/',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => dashboardController.getDashboardStats(req, res),
        description: 'Get dashboard statistics including total orders, pending orders, active customers, low stock, revenue (sum of all non-cancelled orders), and active staff.',
        database: {
            tables: ['orders', 'customers', 'products', 'staffs'],
            mainTable: null,
            fields: {
                calculated: ['totalOrders', 'pendingOrders', 'activeCustomers', 'lowStock', 'revenue', 'activeStaff']
            }
        },
        sampleResponse: {
            success: true,
            data: {
                totalOrders: 22,
                pendingOrders: 12,
                activeCustomers: 10,
                lowStock: 2,
                revenue: 81643.10,
                activeStaff: 15
            }
        },
        examples: [
            {
                title: 'Get Dashboard Stats',
                description: 'Retrieve aggregated statistics for the dashboard',
                url: '/api/dashboard',
                method: 'GET',
                response: {
                    success: true,
                    data: {
                        totalOrders: 22,
                        pendingOrders: 12,
                        activeCustomers: 10,
                        lowStock: 2,
                        revenue: 81643.10,
                        activeStaff: 15
                    }
                }
            }
        ]
    },
    {
        path: '/charts',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => dashboardController.getChartsData(req, res),
        description: 'Get monthly sales chart data for the previous year.',
        database: {
            tables: ['orders'],
            mainTable: 'orders',
            fields: {
                calculated: ['total']
            }
        },
        sampleResponse: [
            { name: "Jan", total: 1500 },
            { name: "Feb", total: 2300 }
        ],
        examples: [
            {
                title: 'Get Dashboard Charts',
                description: 'Retrieve monthly sales data for charts',
                url: '/api/dashboard/charts',
                method: 'GET',
                response: [
                    { name: "Jan", total: 1500 },
                    { name: "Feb", total: 2300 }
                ]
            }
        ]
    },
    {
        path: '/staffs/charts',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => dashboardController.getStaffsChartsData(req, res),
        description: 'Get staff\'s month-wise total sales for the current year. Requires staff_id query parameter.',
        queryParams: {
            staff_id: 'Staff member ID (required if not logged in as staff)'
        },
        database: {
            tables: ['orders', 'users'],
            mainTable: 'orders',
            fields: {
                calculated: ['total'],
                filtered: ['created_by', 'YEAR(order_date)', 'MONTH(order_date)']
            }
        },
        sampleResponse: [
            { name: "Jan", total: 0 },
            { name: "Feb", total: 1544 },
            { name: "Mar", total: 353.16 },
            { name: "Apr", total: 0 },
            { name: "May", total: 0 },
            { name: "Jun", total: 0 },
            { name: "Jul", total: 0 },
            { name: "Aug", total: 0 },
            { name: "Sep", total: 0 },
            { name: "Oct", total: 0 },
            { name: "Nov", total: 0 },
            { name: "Dec", total: 0 }
        ],
        examples: [
            {
                title: 'Get Staff Charts',
                description: 'Retrieve monthly sales data for a specific staff member',
                url: '/api/dashboard/staffs/charts?staff_id=1',
                method: 'GET',
                response: [
                    { name: "Jan", total: 0 },
                    { name: "Feb", total: 1544 },
                    { name: "Mar", total: 353.16 }
                ]
            }
        ]
    }
];

// Register routes
router.routesMeta.forEach(r => {
    router[r.method.toLowerCase()](r.path, ...r.middlewares, r.handler);
});

module.exports = router;
