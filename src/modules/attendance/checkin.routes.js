const express = require('express');
const router = express.Router();
const checkInController = require('./checkin.controller');
const { verifyToken } = require('../../core/middleware/auth');
const validate = require('../../core/middleware/validate');
const { createCheckIn, updateCheckIn } = require('./checkin.validation');

router.moduleName = 'Staff Attendance';

// Apply authentication
router.use(verifyToken);

router.routesMeta = [
    {
        path: '/',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => checkInController.getCheckIns(req, res),
        description: 'Get all staff check-ins with filters for staff, customer, and date',
        database: {
            tables: ['staff_checkins', 'users', 'customers'],
            mainTable: 'staff_checkins',
            fields: {
                staff_checkins: ['id', 'customer_id', 'staff_id', 'check_in_time', 'latitude', 'longitude', 'distance_meters', 'note', 'created_at'],
                users: ['id', 'first_name', 'last_name', 'email', 'phone', 'position', 'thumb_url'],
                customers: ['id', 'name', 'company', 'email', 'phone', 'address', 'city']
            },
            relationships: [
                'staff_checkins.staff_id -> users.id (FK)',
                'staff_checkins.customer_id -> customers.id (FK)'
            ]
        },
        queryParams: {
            page: 'Page number (default: 1)',
            limit: 'Items per page (default: 10)',
            staff_id: 'Filter by staff ID',
            customer_id: 'Filter by customer ID',
            date: 'Filter by date (YYYY-MM-DD)'
        },
        sampleResponse: {
            success: true,
            message: 'Check-ins retrieved successfully',
            pagination: {
                total: 25,
                page: '1',
                limit: '10',
                totalPage: 3
            },
            data: [
                {
                    id: 1,
                    customer_id: 1,
                    staff_id: 123,
                    check_in_time: '2026-01-08T10:25:30.123Z',
                    latitude: 3.07381,
                    longitude: 101.51829,
                    distance_meters: 42,
                    note: 'Checked in from mobile app',
                    staff: {
                        id: 123,
                        first_name: 'John',
                        last_name: 'Doe',
                        email: 'john@example.com',
                        phone: '1234567890',
                        position: 'Sales Representative',
                        thumb_url: 'http://example.com/profile.jpg'
                    },
                    customer: {
                        id: 1,
                        name: 'Jane Smith',
                        company: 'Acme Corp',
                        email: 'jane@acme.com',
                        phone: '0987654321',
                        address: '123 Business Rd',
                        city: 'Kuala Lumpur'
                    }
                }
            ]
        },
        examples: [
            {
                title: 'List Check-ins',
                description: 'Retrieve a list of staff check-ins with pagination and optional filters',
                url: '/api/staff-attendance/?page=1&limit=10&date=2026-01-08',
                method: 'GET',
                response: {
                    success: true,
                    message: 'Check-ins retrieved successfully',
                    pagination: {
                        total: 25,
                        page: '1',
                        limit: '10',
                        totalPage: 3
                    },
                    data: [
                        {
                            id: 1,
                            customer_id: 1,
                            staff_id: 123,
                            check_in_time: '2026-01-08T10:25:30.123Z',
                            latitude: 3.07381,
                            longitude: 101.51829,
                            distance_meters: 42,
                            note: 'Checked in from mobile app',
                            staff: {
                                id: 123,
                                first_name: 'John',
                                last_name: 'Doe',
                                position: 'Sales Representative'
                            },
                            customer: {
                                id: 1,
                                name: 'Jane Smith',
                                company: 'Acme Corp',
                                city: 'Kuala Lumpur'
                            }
                        }
                    ]
                }
            }
        ]
    },
    {
        path: '/',
        method: 'POST',
        middlewares: [validate(createCheckIn)],
        handler: (req, res) => checkInController.createCheckIn(req, res),
        description: 'Create a new staff check-in',
        database: {
            tables: ['staff_checkins'],
            mainTable: 'staff_checkins',
            requiredFields: ['customer_id', 'staff_id'],
            optionalFields: ['check_in_time', 'latitude', 'longitude', 'distance_meters', 'note']
        },
        sampleRequest: {
            customer_id: 1,
            staff_id: 123,
            check_in_time: '2026-01-08T10:25:30.123Z',
            latitude: 3.07381,
            longitude: 101.51829,
            distance_meters: 42,
            note: 'Checked in from mobile app'
        },
        sampleResponse: {
            success: true,
            message: 'Check-in created successfully',
            data: {
                id: 1,
                customer_id: 1,
                staff_id: 123,
                check_in_time: '2026-01-08T10:25:30.123Z',
                latitude: 3.07381,
                longitude: 101.51829,
                distance_meters: 42,
                note: 'Checked in from mobile app'
            }
        }
    },
    {
        path: '/customer-list/:date',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => checkInController.getCustomersWithCheckIns(req, res),
        description: 'Get all customers with staff check-ins for a specific date',
        database: {
            tables: ['customers', 'staff_checkins', 'staffs', 'sales_routes'],
            mainTable: 'customers',
            fields: {
                customers: ['id', 'name', 'company', 'email', 'phone', 'address', 'city', 'sales_route_id'],
                staff_checkins: ['id', 'customer_id', 'staff_id', 'check_in_time', 'latitude', 'longitude', 'distance_meters', 'note', 'created_at'],
                staffs: ['id', 'first_name', 'last_name', 'email', 'phone', 'position'],
                sales_routes: ['id', 'route_name', 'description', 'start_location', 'end_location']
            },
            relationships: [
                'customers.id -> staff_checkins.customer_id (One-to-Many)',
                'staff_checkins.staff_id -> staffs.id (FK)',
                'customers.sales_route_id -> sales_routes.id (FK)'
            ]
        },
        queryParams: {
            page: 'Page number (default: 1)',
            limit: 'Items per page (default: 10)'
        },
        sampleResponse: {
            success: true,
            message: 'Customer list with check-ins retrieved successfully',
            pagination: {
                total: 50,
                page: '1',
                limit: '10',
                totalPage: 5
            },
            data: [
                {
                    id: 1,
                    name: 'Jane Smith',
                    company: 'Acme Corp',
                    salesRoute: {
                        id: 5,
                        route_name: 'Downtown Route',
                        description: 'Main commercial district'
                    },
                    checkins: [
                        {
                            id: 10,
                            check_in_time: '2026-01-08T10:25:30.123Z',
                            staff: {
                                id: 123,
                                first_name: 'John',
                                last_name: 'Doe',
                                position: 'Sales Representative'
                            }
                        }
                    ]
                }
            ]
        },
        examples: [
            {
                title: 'Customer Check-in List',
                description: 'Get list of customers with check-ins for 2026-01-08 with pagination',
                url: '/api/staff-attendance/customer-list/2026-01-08?page=1&limit=10',
                method: 'GET',
                response: {
                    success: true,
                    message: 'Customer list with check-ins retrieved successfully',
                    pagination: { total: 50, page: '1', limit: '10', totalPage: 5 },
                    data: [
                        {
                            id: 1,
                            name: 'Jane Smith',
                            company: 'Acme Corp',
                            salesRoute: {
                                id: 5,
                                route_name: 'Downtown'
                            },
                            checkins: [{ id: 10, check_in_time: '2026-01-08T10:25:30.123Z', staff: { id: 123, first_name: 'John' } }]
                        }
                    ]
                }
            }
        ]
    },
    {
        path: '/:id',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => checkInController.getCheckInById(req, res),
        description: 'Get a specific check-in by ID',
        database: {
            tables: ['staff_checkins', 'staffs', 'customers'],
            mainTable: 'staff_checkins',
            fields: {
                staff_checkins: ['id', 'customer_id', 'staff_id', 'check_in_time', 'latitude', 'longitude', 'distance_meters', 'note', 'created_at'],
                staffs: ['id', 'first_name', 'last_name', 'email', 'phone', 'position'],
                customers: ['id', 'name', 'company', 'email', 'phone', 'address', 'city']
            },
            relationships: [
                'staff_checkins.staff_id -> staffs.id (FK)',
                'staff_checkins.customer_id -> customers.id (FK)'
            ]
        },
        sampleResponse: {
            success: true,
            message: 'Check-in retrieved successfully',
            data: {
                id: 1,
                customer_id: 1,
                staff_id: 123,
                check_in_time: '2026-01-08T10:25:30.123Z',
                latitude: 3.07381,
                longitude: 101.51829,
                distance_meters: 42,
                note: 'Checked in from mobile app',
                staff: {
                    id: 123,
                    first_name: 'John',
                    last_name: 'Doe',
                    email: 'john@example.com',
                    phone: '1234567890',
                    position: 'Sales Representative'
                },
                customer: {
                    id: 1,
                    name: 'Jane Smith',
                    company: 'Acme Corp',
                    email: 'jane@acme.com',
                    phone: '0987654321',
                    address: '123 Business Rd',
                    city: 'Kuala Lumpur'
                }
            }
        },
        examples: [
            {
                title: 'Get Check-in Details',
                description: 'Retrieve detailed information for a specific check-in record',
                url: '/api/staff-attendance/1',
                method: 'GET',
                response: {
                    success: true,
                    message: 'Check-in retrieved successfully',
                    data: {
                        id: 1,
                        customer_id: 1,
                        staff_id: 123,
                        check_in_time: '2026-01-08T10:25:30.123Z',
                        latitude: 3.07381,
                        longitude: 101.51829,
                        distance_meters: 42,
                        note: 'Checked in from mobile app',
                        staff: {
                            id: 123,
                            first_name: 'John',
                            last_name: 'Doe',
                            position: 'Sales Representative'
                        },
                        customer: {
                            id: 1,
                            name: 'Jane Smith',
                            company: 'Acme Corp',
                            city: 'Kuala Lumpur'
                        }
                    }
                }
            }
        ]
    },
    {
        path: '/:id',
        method: 'PUT',
        middlewares: [validate(updateCheckIn)],
        handler: (req, res) => checkInController.updateCheckIn(req, res),
        description: 'Update a check-in record',
        database: {
            tables: ['staff_checkins'],
            mainTable: 'staff_checkins'
        },
        sampleRequest: {
            note: 'Updated note'
        }
    },
    {
        path: '/:id',
        method: 'DELETE',
        middlewares: [],
        handler: (req, res) => checkInController.deleteCheckIn(req, res),
        description: 'Delete a check-in record',
        database: {
            tables: ['staff_checkins'],
            mainTable: 'staff_checkins'
        }
    }
];

// Register routes
router.routesMeta.forEach(r => {
    router[r.method.toLowerCase()](r.path, ...r.middlewares, r.handler);
});

// Alias for singular 'check-in' as requested
router.post('/check-in', validate(createCheckIn), (req, res) => checkInController.createCheckIn(req, res));
router.get('/check-in/:id', (req, res) => checkInController.getCheckInById(req, res));

// Add metadata for these aliases to routesMeta so they appear in docs
router.routesMeta.push(
    {
        path: '/check-in',
        method: 'POST',
        middlewares: [validate(createCheckIn)],
        handler: (req, res) => checkInController.createCheckIn(req, res),
        description: 'Create a new staff check-in (Alias)',
        database: {
            tables: ['staff_checkins'],
            mainTable: 'staff_checkins',
            requiredFields: ['customer_id', 'staff_id'],
            optionalFields: ['check_in_time', 'latitude', 'longitude', 'distance_meters', 'note']
        },
        sampleRequest: {
            customer_id: 1,
            staff_id: 123,
            check_in_time: '2026-01-08T10:25:30.123Z',
            latitude: 3.07381,
            longitude: 101.51829,
            distance_meters: 42,
            note: 'Checked in from mobile app'
        },
        sampleResponse: {
            success: true,
            message: 'Check-in created successfully',
            data: {
                id: 1,
                customer_id: 1,
                staff_id: 123,
                check_in_time: '2026-01-08T10:25:30.123Z',
                latitude: 3.07381,
                longitude: 101.51829,
                distance_meters: 42,
                note: 'Checked in from mobile app'
            }
        }
    },
    {
        path: '/check-in/:id',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => checkInController.getCheckInById(req, res),
        description: 'Get a specific check-in by ID (Alias)',
        database: {
            tables: ['staff_checkins'],
            mainTable: 'staff_checkins'
        },
        sampleResponse: {
            success: true,
            message: 'Check-in retrieved successfully',
            data: {
                id: 1,
                customer_id: 1,
                staff_id: 123,
                check_in_time: '2026-01-08T10:25:30.123Z',
                latitude: 3.07381,
                longitude: 101.51829,
                distance_meters: 42,
                note: 'Checked in from mobile app'
            }
        }
    }
);

module.exports = router;
