const AttendanceService = require('./attendance.service');
const { success, error, successWithPagination } = require('../../core/utils/response');

class AttendanceController {
    async getAttendances(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const filters = {
                staff_id: req.query.staff_id,
                date: req.query.date,
                status: req.query.status
            };

            const result = await AttendanceService.getAllAttendances(filters, page, limit);
            return successWithPagination(res, 'Attendance records retrieved successfully', result.data, {
                total: result.total,
                page,
                limit
            });
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getCheckInList(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const filters = {
                staff_id: req.query.staff_id,
                date: req.query.date
            };

            const result = await AttendanceService.getCheckInList(filters, page, limit);
            return successWithPagination(res, 'Check-in list retrieved successfully', result.data, {
                total: result.total,
                page,
                limit
            });
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getAttendanceById(req, res) {
        try {
            const attendance = await AttendanceService.getAttendanceById(req.params.id);
            return success(res, 'Attendance record retrieved successfully', attendance);
        } catch (err) {
            return error(res, err.message, 404);
        }
    }

    async recordAttendance(req, res) {
        try {
            const staffId = req.params.id;
            // Provide default creator ID is not present in req.user (e.g. system generated or no auth context)
            const createdBy = req.user ? req.user.id : null;
            const attendance = await AttendanceService.recordAttendance(staffId, req.body, createdBy);
            return success(res, 'Attendance recorded successfully', attendance, 201);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }

    async recordFullDayLeave(req, res) {
        try {
            const staffId = req.params.id;
            const createdBy = req.user ? req.user.id : null;
            const leave = await AttendanceService.recordFullDayLeave(staffId, req.body, createdBy);
            return success(res, 'Full day leave recorded successfully', leave, 201);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }

    async recordShortLeave(req, res) {
        try {
            const staffId = req.params.id;
            const createdBy = req.user ? req.user.id : null;
            const leave = await AttendanceService.recordShortLeave(staffId, req.body, createdBy);
            return success(res, 'Short leave recorded successfully', leave, 201);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }

    async getStaffAttendance(req, res) {
        try {
            const staffId = req.params.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const filters = {
                staff_id: staffId,
                date: req.query.date,
                status: req.query.status,
                month: req.query.month,
                start_date: req.query.start_date,
                end_date: req.query.end_date
            };

            const result = await AttendanceService.getAllAttendances(filters, page, limit);
            return successWithPagination(res, 'Attendance records retrieved successfully', result.data, {
                total: result.total,
                page,
                limit
            });
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async updateAttendance(req, res) {
        try {
            const attendance = await AttendanceService.updateAttendance(req.params.id, req.body);
            return success(res, 'Attendance updated successfully', attendance);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }

    async deleteAttendance(req, res) {
        try {
            await AttendanceService.deleteAttendance(req.params.id);
            return success(res, 'Attendance deleted successfully');
        } catch (err) {
            return error(res, err.message, 404);
        }
    }

    async getStaffAttendanceStats(req, res) {
        try {
            const filters = {
                month: req.query.month
            };
            const stats = await AttendanceService.getStaffAttendanceStats(req.params.id, filters);
            return success(res, 'Attendance stats retrieved successfully', stats);
        } catch (err) {
            return error(res, err.message, 500);
        }
    }
}

module.exports = new AttendanceController();
