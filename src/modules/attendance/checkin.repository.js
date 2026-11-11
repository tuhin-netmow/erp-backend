const { StaffCheckIn } = require('./checkin.model');
const { User: Staff } = require('../../modules/users/user.model');
const { Customer } = require('../../modules/customers/customers.model');
const { SalesRoute } = require('../../modules/sales/sales.models');
const { Op } = require('sequelize');

class CheckInRepository {
    async findAll(filters = {}, limit = 10, offset = 0) {
        const where = {};
        if (filters.staff_id) where.staff_id = filters.staff_id;
        if (filters.customer_id) where.customer_id = filters.customer_id;
        if (filters.date) {
            const startOfDay = new Date(filters.date);
            if (!isNaN(startOfDay)) {
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(filters.date);
                endOfDay.setHours(23, 59, 59, 999);
                where.check_in_time = {
                    [Op.between]: [startOfDay, endOfDay]
                };
            }
        }

        if (filters.search) {
            where[Op.or] = [
                { '$staff.first_name$': { [Op.like]: `%${filters.search}%` } },
                { '$staff.last_name$': { [Op.like]: `%${filters.search}%` } },
                { '$staff.name$': { [Op.like]: `%${filters.search}%` } },
                { '$customer.name$': { [Op.like]: `%${filters.search}%` } },
                { '$customer.company$': { [Op.like]: `%${filters.search}%` } }
            ];
        }

        const queryOptions = {
            where,
            include: [
                {
                    model: Staff,
                    as: 'staff',
                    attributes: ['id', 'name', 'first_name', 'last_name', 'email', 'phone', 'position', 'thumb_url']
                },
                {
                    model: Customer,
                    as: 'customer',
                    attributes: ['id', 'name', 'company', 'email', 'phone', 'address', 'city']
                }
            ],
            order: [['check_in_time', 'DESC']],
            limit,
            offset
        };

        if (filters.search) {
            queryOptions.subQuery = false;
        }

        return await StaffCheckIn.findAndCountAll(queryOptions);
    }

    async findById(id) {
        return await StaffCheckIn.findByPk(id, {
            include: [
                {
                    model: Staff,
                    as: 'staff',
                    attributes: ['id', 'name', 'first_name', 'last_name', 'email', 'phone', 'position', 'thumb_url']
                },
                {
                    model: Customer,
                    as: 'customer',
                    attributes: ['id', 'name', 'company', 'email', 'phone', 'address', 'city']
                }
            ]
        });
    }

    async create(data) {
        return await StaffCheckIn.create(data);
    }

    async update(id, data) {
        const checkIn = await StaffCheckIn.findByPk(id);
        if (!checkIn) return null;
        return await checkIn.update(data);
    }

    async delete(id) {
        const checkIn = await StaffCheckIn.findByPk(id);
        if (!checkIn) return null;
        await checkIn.destroy();
        return checkIn;
    }

    async findCustomersWithCheckIns(date, limit = 10, offset = 0) {
        const startOfDay = new Date(date);
        if (isNaN(startOfDay)) {
            throw new Error('Invalid date format');
        }
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // Note: When using include with where on unrelated tables or required: false, 
        // findAndCountAll might count rows differently (result rows vs main table rows) if not careful with distinct:true
        return await Customer.findAndCountAll({
            distinct: true, // Important for correct count with includes
            include: [
                {
                    model: StaffCheckIn,
                    as: 'checkins',
                    required: false,
                    where: {
                        check_in_time: {
                            [Op.between]: [startOfDay, endOfDay]
                        }
                    },
                    include: [{
                        model: Staff,
                        as: 'staff',
                        attributes: ['id', 'first_name', 'last_name', 'email', 'position', 'thumb_url']
                    }]
                },
                {
                    model: SalesRoute,
                    as: 'salesRoute',
                    attributes: ['id', 'route_name', 'description', 'start_location', 'end_location']
                }
            ],
            order: [['name', 'ASC']],
            limit,
            offset
        });
    }
}

module.exports = new CheckInRepository();
