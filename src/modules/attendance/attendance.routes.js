const express = require('express');
const router = express.Router();
const attendanceController = require('./attendance.controller');
const { verifyToken } = require('../../core/middleware/auth');
const { moduleCheck } = require('../../core/middleware/moduleCheck');
const { handlerWithFields } = require('../../core/utils/zodTypeView');
const validate = require('../../core/middleware/validate');
const { updateAttendance, recordAttendance, recordFullLeave, recordShortLeave } = require('./attendance.validation');

// Module name for routes-tree grouping
router.moduleName = 'Attendance';

router.use(verifyToken);
router.use(moduleCheck('attendance'));

// Define routes metadata
router.routesMeta = [
    {
        path: '/checkin-list',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => attendanceController.getCheckInList(req, res),
        description: 'Get check-in list with filters for staff and date',
        database: {
            tables: ['attendance', 'staffs'],
            mainTable: 'attendance',
            fields: {
                attendance: ['id', 'staff_id', 'date', 'check_in', 'check_out', 'status', 'created_at'],
                staffs: ['id', 'first_name', 'last_name']
            },
            relationships: ['attendance.staff_id -> staffs.id (FK)']
        },
        queryParams: {
            page: 'Page number (default: 1)',
            limit: 'Items per page (default: 10)',
            staff_id: 'Filter by staff ID',
            date: 'Filter by date (YYYY-MM-DD)'
        },
        sampleResponse: {
            success: true,
            message: 'Check-in list retrieved successfully',
            pagination: {
                total: 5,
                page: '1',
                limit: '10',
                totalPage: 1
            },
            data: [
                {
                    id: 1,
                    staff_id: 2,
                    date: '2025-01-08',
                    check_in: '09:00:00',
                    status: 'present'
                }
            ]
        },
        examples: [
            {
                title: 'Get Check-in List',
                description: 'Get check-ins filtered by staff and date',
                url: '/api/attendance/checkin-list?staff_id=2&date=2025-01-08',
                method: 'GET',
                response: {
                    success: true,
                    data: [{ id: 1, staff_id: 2, date: '2025-01-08', check_in: '09:00:00' }]
                }
            }
        ]
    },
    {
        path: '/daily',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => attendanceController.getAttendances(req, res),
        description: 'List attendance records',
        database: {
            tables: ['attendance', 'staffs'],
            mainTable: 'attendance',
            fields: {
                attendance: ['id', 'staff_id', 'date', 'check_in', 'check_out', 'status', 'notes', 'created_at', 'updated_at'],
                staffs: ['id', 'first_name', 'last_name']
            },
            relationships: ['attendance.staff_id -> staffs.id (FK)']
        },
        queryParams: {
            staff_id: 'Filter by staff ID',
            date: 'Filter by date',
            status: 'Filter by status',
            page: 'Page number (default: 1)',
            limit: 'Items per page (default: 10)'
        },
        sampleResponse: {
            success: true,
            message: 'Attendance records retrieved successfully',
            pagination: {
                total: 50,
                page: '1',
                limit: '10',
                totalPage: 5
            },
            data: [
                {
                    id: 1,
                    staff_id: 5,
                    date: '2025-12-02',
                    check_in: '09:00:00',
                    check_out: '18:00:00',
                    status: 'present'
                }
            ]
        },
        examples: [
            {
                title: 'List Attendance',
                description: 'Get list of attendance records with optional filtering',
                url: '/api/attendance?date=2025-12-02&status=present',
                method: 'GET',
                response: {
                    success: true,
                    message: 'Attendance records retrieved successfully',
                    pagination: { total: 10, page: '1', limit: '10', totalPage: 1 },
                    data: [{ id: 1, staff_id: 5, date: '2025-12-02', check_in: '09:00:00', check_out: '18:00:00', status: 'present' }]
                }
            }
        ]
    },

    {
        path: '/staff/:id',
        method: 'POST',
        middlewares: [validate(recordAttendance)],
        handler: handlerWithFields((req, res) => attendanceController.recordAttendance(req, res), recordAttendance),
        description: 'Record staff attendance (multiple times per date allowed)',
        database: {
            tables: ['attendance'],
            mainTable: 'attendance',
            requiredFields: ['staff_id', 'date', 'check_in', 'check_out'],
            optionalFields: ['total_hours'],
            autoGeneratedFields: ['id', 'created_at', 'updated_at']
        },
        sampleRequest: {
            date: '2025-12-02',
            start_at: '09:00:00',
            end_at: '12:00:00',
            total_hour: 3
        },
        sampleResponse: {
            status: true,
            message: 'Attendance recorded successfully',
            data: {
                id: 10,
                staff_id: 5,
                date: '2025-12-02',
                check_in: '09:00:00',
                check_out: '12:00:00',
                total_hours: 3.00,
                status: 'present'
            }
        },
        examples: [
            {
                title: 'Record Attendance',
                description: 'Log check-in and check-out times for a staff member',
                url: '/api/attendance/staff/5',
                method: 'POST',
                request: {
                    date: '2025-12-02',
                    start_at: '09:00:00',
                    end_at: '18:00:00',
                    total_hour: 9
                },
                response: {
                    status: true,
                    message: 'Attendance recorded successfully',
                    data: { id: 10, staff_id: 5, date: '2025-12-02', check_in: '09:00:00', check_out: '18:00:00', status: 'present' }
                }
            }
        ]
    },

    {
        path: '/staff/:id/leave/full-day',
        method: 'POST',
        middlewares: [validate(recordFullLeave)],
        handler: handlerWithFields((req, res) => attendanceController.recordFullDayLeave(req, res), recordFullLeave),
        description: 'Record full day leave for a staff member',
        database: {
            tables: ['attendance'],
            mainTable: 'attendance',
            requiredFields: ['staff_id', 'date'],
            optionalFields: ['reason'],
            autoGeneratedFields: ['id', 'created_at', 'updated_at']
        },
        sampleRequest: {
            date: '2025-12-02',
            reason: 'Sick leave'
        },
        sampleResponse: {
            status: true,
            message: 'Full day leave recorded successfully',
            data: {
                id: 11,
                staff_id: 5,
                date: '2025-12-02',
                status: 'on_leave',
                notes: 'Sick leave'
            }
        },
        examples: [
            {
                title: 'Record Full Day Leave',
                description: 'Mark a staff member as on leave for a specific date',
                url: '/api/attendance/staff/5/leave/full-day',
                method: 'POST',
                request: { date: '2025-12-05', reason: 'Annual Leave' },
                response: {
                    status: true,
                    message: 'Full day leave recorded successfully',
                    data: { id: 11, staff_id: 5, date: '2025-12-05', status: 'on_leave', notes: 'Annual Leave' }
                }
            }
        ]
    },
    {
        path: '/staff/:id/leave/short',
        method: 'POST',
        middlewares: [validate(recordShortLeave)],
        handler: handlerWithFields((req, res) => attendanceController.recordShortLeave(req, res), recordShortLeave),
        description: 'Record short leave for a staff member',
        database: {
            tables: ['attendance'],
            mainTable: 'attendance',
            requiredFields: ['staff_id', 'date', 'start_time', 'end_time'],
            optionalFields: ['reason'],
            autoGeneratedFields: ['id', 'created_at', 'updated_at']
        },
        sampleRequest: {
            date: '2025-12-02',
            start_time: '10:00:00',
            end_time: '12:00:00',
            reason: 'Doctor appointment'
        },
        sampleResponse: {
            status: true,
            message: 'Short leave recorded successfully',
            data: {
                id: 12,
                staff_id: 5,
                date: '2025-12-02',
                check_in: '10:00:00',
                check_out: '12:00:00',
                status: 'half_day',
                notes: 'Doctor appointment'
            }
        },
        examples: [
            {
                title: 'Record Short Leave',
                description: 'Log a short leave duration for a staff member',
                url: '/api/attendance/staff/5/leave/short',
                method: 'POST',
                request: {
                    date: '2025-12-02',
                    start_time: '14:00:00',
                    end_time: '16:00:00',
                    reason: 'Personal errand'
                },
                response: {
                    status: true,
                    message: 'Short leave recorded successfully',
                    data: { id: 12, staff_id: 5, date: '2025-12-02', check_in: '14:00:00', check_out: '16:00:00', status: 'half_day', notes: 'Personal errand' }
                }
            }
        ]
    },

    {
        path: '/staff/:id/stats',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => attendanceController.getStaffAttendanceStats(req, res),
        description: 'Get aggregated attendance statistics for a staff member',
        database: {
            tables: ['attendance'],
            mainTable: 'attendance',
            fields: {
                attendance: ['status']
            }
        },
        sampleResponse: {
            status: true,
            message: 'Attendance stats retrieved successfully',
            data: {
                total: 211,
                present: 180,
                late: 10,
                absent: 5,
                on_leave: 16
            }
        },
        examples: [
            {
                title: 'Get Staff Stats',
                description: 'Retrieve grouped attendance statistics for a specific staff member',
                url: '/api/attendance/staff/5/stats',
                method: 'GET',
                response: {
                    status: true,
                    message: 'Attendance stats retrieved successfully',
                    data: { total: 10, present: 8, late: 1, absent: 0, on_leave: 1 }
                }
            }
        ]
    },

    {
        path: '/staff/:id',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => attendanceController.getStaffAttendance(req, res),
        description: 'Get attendance records for a staff member',
        database: {
            tables: ['attendance', 'staffs'],
            mainTable: 'attendance',
            fields: {
                attendance: ['id', 'staff_id', 'date', 'check_in', 'check_out', 'status', 'notes', 'total_hours', 'created_at', 'updated_at'],
                staffs: ['id', 'first_name', 'last_name']
            },
            relationships: ['attendance.staff_id -> staffs.id (FK)']
        },
        sampleResponse: {
            status: true,
            message: 'Attendance records retrieved successfully',
            pagination: {
                total: 50,
                page: '1',
                limit: '10',
                totalPage: 5
            },
            data: [
                {
                    id: 1,
                    staff_id: 5,
                    date: '2025-12-02',
                    check_in: '09:00:00',
                    check_out: '18:00:00',
                    total_hours: 9.00,
                    status: 'present'
                }
            ]
        },
        examples: [
            {
                title: 'Get Staff Attendance',
                description: 'Retrieve attendance history for a specific staff member',
                url: '/api/attendance/staff/5',
                method: 'GET',
                response: {
                    status: true,
                    message: 'Attendance records retrieved successfully',
                    pagination: { total: 20, page: '1', limit: '10', totalPage: 2 },
                    data: [{ id: 1, staff_id: 5, date: '2025-12-01', status: 'present' }]
                }
            }
        ]
    },
    {
        path: '/:id',
        method: 'PUT',
        middlewares: [validate(updateAttendance)],
        handler: handlerWithFields((req, res) => attendanceController.updateAttendance(req, res), updateAttendance),
        description: 'Update attendance record',
        database: {
            tables: ['attendance'],
            mainTable: 'attendance',
            updatableFields: ['check_in', 'check_out', 'status', 'notes', 'total_hours'],
            readOnlyFields: ['id', 'staff_id', 'date', 'created_at'],
            autoUpdatedFields: ['updated_at']
        },
        sampleRequest: {
            status: 'late',
            notes: 'Traffic delay'
        },
        sampleResponse: {
            status: true,
            message: 'Attendance updated successfully'
        },
        examples: [
            {
                title: 'Update Attendance',
                description: 'Modify an existing attendance record',
                url: '/api/attendance/10',
                method: 'PUT',
                request: { status: 'late', notes: 'Arrived late due to traffic' },
                response: {
                    status: true,
                    message: 'Attendance updated successfully'
                }
            }
        ]
    },
    {
        path: '/:id',
        method: 'DELETE',
        middlewares: [],
        handler: (req, res) => attendanceController.deleteAttendance(req, res),
        description: 'Delete attendance record',
        database: {
            tables: ['attendance'],
            mainTable: 'attendance'
        },
        sampleResponse: {
            status: true,
            message: 'Attendance deleted successfully'
        },
        examples: [
            {
                title: 'Delete Attendance',
                description: 'Remove an attendance record',
                url: '/api/attendance/12',
                method: 'DELETE',
                response: {
                    status: true,
                    message: 'Attendance deleted successfully'
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
