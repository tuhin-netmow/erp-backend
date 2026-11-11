const express = require('express');
const router = express.Router();
const salesRouteController = require('./salesroute.controller');
const { verifyToken } = require('../../core/middleware/auth');
const { moduleCheck } = require('../../core/middleware/moduleCheck');
const validate = require('../../core/middleware/validate');
const { createRoute, updateRoute, assignStaff } = require('./salesroute.validation');

// Module name for routes-tree grouping
router.moduleName = 'Sales Routes';

// Define routes metadata
router.routesMeta = [

    {
        path: '/sales-route/:id',
        method: 'GET',
        middlewares: [verifyToken, moduleCheck('sales')],
        handler: salesRouteController.getRouteById,
        description: 'Get sales route details with customers and their orders',
        sampleResponse: {
            status: true,
            message: 'Sales route retrieved successfully',
            data: {
                id: 1,
                route_name: 'Kuala Lumpur Central',
                description: 'Coverage for KL city center',
                assigned_sales_rep_id: 5,
                start_location: 'KLCC',
                end_location: 'Bukit Bintang',
                zoom_level: 12,
                country: 'Malaysia',
                state: 'Selangor',
                city: 'Kuala Lumpur',
                postal_code: '50088',
                center_lat: 3.1570,
                center_lng: 101.7123,
                coverage_radius: 5,
                is_active: true,
                created_at: '2025-12-02T10:00:00.000Z',
                updated_at: '2025-12-02T10:00:00.000Z',
                customers: [
                    {
                        id: 1,
                        name: 'ABC Corporation',
                        sales_route_id: 1,
                        orders: [
                            {
                                id: 1,
                                order_number: 'ORD-001',
                                customer_id: 1,
                                order_date: '2025-12-20T10:00:00.000Z',
                                status: 'confirmed',
                                total_amount: 1500.00,
                                items: [
                                    {
                                        id: 1,
                                        order_id: 1,
                                        product_id: 1,
                                        quantity: 10,
                                        unit_price: 150.00,
                                        product: {
                                            id: 1,
                                            name: 'Product A',
                                            sku: 'PRD-A-001'
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        }
    },
    {
        path: '/sales-route/:id',
        method: 'PUT',
        middlewares: [verifyToken, moduleCheck('sales'), validate(updateRoute)],
        handler: salesRouteController.updateRoute,
        description: 'Update a sales route',
        sampleRequest: {
            route_name: 'Kuala Lumpur Downtown',
            description: 'Updated coverage area',
            is_active: true
        },
        sampleResponse: {
            status: true,
            message: 'Sales route updated successfully',
            data: {
                id: 1,
                route_name: 'Kuala Lumpur Downtown',
                updated_at: '2025-12-02T10:00:00.000Z'
            }
        }
    },
    {
        path: '/sales-route/:id',
        method: 'DELETE',
        middlewares: [verifyToken, moduleCheck('sales')],
        handler: salesRouteController.deleteRoute,
        description: 'Delete a sales route',
        sampleResponse: {
            status: true,
            message: 'Sales route deleted successfully',
            data: null
        }
    },
    {
        path: '/sales-route/:id/assign',
        method: 'PATCH',
        middlewares: [verifyToken, moduleCheck('sales'), validate(assignStaff)],
        handler: salesRouteController.assignStaff,
        description: 'Assign staff members to a sales route',
        sampleRequest: {
            staff_ids: [1, 2, 3]
        },
        sampleResponse: {
            status: true,
            message: 'Staff assigned to sales route successfully',
            data: {
                id: 1,
                route_name: 'Kuala Lumpur Central',
                description: 'Coverage for KL city center',
                is_active: true,
                assignedStaff: [
                    {
                        id: 1,
                        name: 'John Doe',
                        email: 'john@example.com',
                        SalesRouteStaff: {
                            assigned_at: '2025-12-25T05:14:18.000Z',
                            assigned_by: 1
                        }
                    },
                    {
                        id: 2,
                        name: 'Jane Smith',
                        email: 'jane@example.com',
                        SalesRouteStaff: {
                            assigned_at: '2025-12-25T05:14:18.000Z',
                            assigned_by: 1
                        }
                    }
                ]
            }
        }
    },
    {
        path: '/sales-route/:id/assign',
        method: 'GET',
        middlewares: [verifyToken, moduleCheck('sales')],
        handler: salesRouteController.getAssignedStaff,
        description: 'Get staff members assigned to a sales route',
        sampleResponse: {
            status: true,
            message: 'Assigned staff retrieved successfully',
            data: {
                id: 1,
                route_name: 'Kuala Lumpur Central',
                description: 'Coverage for KL city center',
                is_active: true,
                assignedStaff: [
                    {
                        id: 1,
                        name: 'John Doe',
                        email: 'john@example.com',
                        SalesRouteStaff: {
                            assigned_at: '2025-12-25T05:14:18.000Z',
                            assigned_by: 1
                        }
                    }
                ]
            }
        }
    },
    {
        path: '/my-routes',
        method: 'GET',
        middlewares: [verifyToken, moduleCheck('sales')],
        handler: salesRouteController.getMyRoutes,
        description: 'Get logged-in staff\'s assigned routes with customers',
        sampleResponse: {
            status: true,
            message: 'My routes retrieved successfully',
            data: [
                {
                    id: 1,
                    route_name: 'Kuala Lumpur Central',
                    description: 'Coverage for KL city center',
                    is_active: true,
                    customers: [
                        {
                            id: 1,
                            name: 'ABC Store',
                            company: 'ABC Corporation',
                            address: '123 Main St',
                            phone: '+60 12-345 6789',
                            latitude: 3.1570,
                            longitude: 101.7123,
                            thumb_url: 'https://example.com/thumb.jpg'
                        }
                    ]
                }
            ]
        }
    }
];

// Register routes from metadata
router.routesMeta.forEach(r => {
    router[r.method.toLowerCase()](r.path, ...r.middlewares, r.handler);
});

module.exports = router;
