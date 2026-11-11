const { Op } = require('sequelize');
const { Attendance } = require('./attendance.model');
const { Staff } = require('../staffs/staffs.model');

class AttendanceRepository {
    async findAll(filters = {}, limit = 10, offset = 0) {
        const where = {};
        if (filters.staff_id) where.staff_id = filters.staff_id;

        // Date filter logic
        if (filters.date && typeof filters.date === 'string' && filters.date.trim() !== '') {
            where.date = filters.date.trim();
        } else {
            const dateFilter = {};
            let hasDateFilter = false;

            if (filters.start_date && typeof filters.start_date === 'string' && filters.start_date.trim() !== '') {
                dateFilter[Op.gte] = filters.start_date.trim();
                hasDateFilter = true;
            }
            if (filters.end_date && typeof filters.end_date === 'string' && filters.end_date.trim() !== '') {
                dateFilter[Op.lte] = filters.end_date.trim();
                hasDateFilter = true;
            }

            if (hasDateFilter) {
                where.date = dateFilter;
            } else if (filters.month && typeof filters.month === 'string' && filters.month.trim() !== '') {
                const [year, month] = filters.month.split('-');
                const lastDay = new Date(year, month, 0).getDate();
                const startDateStr = `${filters.month}-01`;
                const endDateStr = `${filters.month}-${lastDay}`;
                where.date = { [Op.between]: [startDateStr, endDateStr] };
            }
        }

        if (filters.status) where.status = filters.status;

        return await Attendance.findAndCountAll({
            where,
            include: [{
                model: Staff,
                as: 'staff',
                attributes: ['id', 'first_name', 'last_name', 'email']
            }],
            order: [['date', 'DESC'], ['check_in', 'ASC']],
            limit,
            offset
        });
    }

    async findById(id) {
        return await Attendance.findByPk(id, {
            include: [{
                model: Staff,
                as: 'staff',
                attributes: ['id', 'first_name', 'last_name', 'email']
            }]
        });
    }

    async findByStaffAndDate(staffId, date) {
        return await Attendance.findOne({
            where: { staff_id: staffId, date }
        });
    }

    async create(data) {
        return await Attendance.create(data);
    }

    async update(id, data) {
        const attendance = await Attendance.findByPk(id);
        if (!attendance) return null;
        await attendance.update(data);
        return await this.findById(id);
    }

    async delete(id) {
        const attendance = await Attendance.findByPk(id);
        if (!attendance) return null;
        await attendance.destroy();
        return attendance;
    }

    async getStatsByStaffId(staffId, filters = {}) {
        const where = { staff_id: staffId };

        const dateFilter = {};
        let hasDateFilter = false;

        if (filters.start_date && typeof filters.start_date === 'string' && filters.start_date.trim() !== '') {
            dateFilter[Op.gte] = filters.start_date.trim();
            hasDateFilter = true;
        }
        if (filters.end_date && typeof filters.end_date === 'string' && filters.end_date.trim() !== '') {
            dateFilter[Op.lte] = filters.end_date.trim();
            hasDateFilter = true;
        }

        if (hasDateFilter) {
            where.date = dateFilter;
        } else if (filters.month && typeof filters.month === 'string' && filters.month.trim() !== '') {
            const [year, month] = filters.month.split('-');
            const lastDay = new Date(year, month, 0).getDate();
            const startDateStr = `${filters.month}-01`;
            const endDateStr = `${filters.month}-${lastDay}`;
            where.date = { [Op.between]: [startDateStr, endDateStr] };
        }

        const present = await Attendance.count({ where: { ...where, status: 'present' } });
        const late = await Attendance.count({ where: { ...where, status: 'late' } });
        const absent = await Attendance.count({ where: { ...where, status: 'absent' } });
        const on_leave = await Attendance.count({ where: { ...where, status: 'on_leave' } });

        return {
            total: present + late + absent + on_leave,
            present,
            late,
            absent,
            on_leave
        };
    }
}

// Define association
Attendance.belongsTo(Staff, { foreignKey: 'staff_id', as: 'staff' });

module.exports = new AttendanceRepository();
