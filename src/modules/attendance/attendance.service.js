const AttendanceRepository = require('./attendance.repository');

class AttendanceService {
    async getAllAttendances(filters = {}, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const result = await AttendanceRepository.findAll(filters, limit, offset);
        return {
            data: result.rows,
            total: result.count
        };
    }

    async getCheckInList(filters = {}, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        // Ensure we are getting check-ins, maybe filter by present status or non-null check_in?
        // For now, listing attendance with existing filters is sufficient as per "checkin-list"
        const result = await AttendanceRepository.findAll(filters, limit, offset);
        return {
            data: result.rows,
            total: result.count
        };
    }

    async getAttendanceById(id) {
        const attendance = await AttendanceRepository.findById(id);
        if (!attendance) {
            throw new Error('Attendance record not found');
        }
        return attendance;
    }

    async recordAttendance(staffId, data, createdBy) {
        return await AttendanceRepository.create({
            staff_id: staffId,
            date: data.date,
            check_in: data.start_at,
            check_out: data.end_at,
            total_hours: data.total_hour,
            status: 'present', // Default status, logic could be improved if needed
            created_by: createdBy
        });
    }

    async recordFullDayLeave(staffId, data, createdBy) {
        return await AttendanceRepository.create({
            staff_id: staffId,
            date: data.date,
            check_in: null,
            check_out: null,
            total_hours: 0,
            status: 'on_leave',
            notes: data.reason,
            created_by: createdBy
        });
    }

    async recordShortLeave(staffId, data, createdBy) {
        return await AttendanceRepository.create({
            staff_id: staffId,
            date: data.date,
            check_in: data.start_time,
            check_out: data.end_time,
            status: 'half_day',
            notes: data.reason,
            created_by: createdBy
        });
    }

    async updateAttendance(id, data) {
        const attendance = await AttendanceRepository.update(id, data);
        if (!attendance) {
            throw new Error('Attendance record not found');
        }
        return attendance;
    }

    async deleteAttendance(id) {
        const attendance = await AttendanceRepository.delete(id);
        if (!attendance) {
            throw new Error('Attendance record not found');
        }
        return attendance;
    }

    async getStaffAttendanceStats(staffId, filters = {}) {
        return await AttendanceRepository.getStatsByStaffId(staffId, filters);
    }
}

module.exports = new AttendanceService();
