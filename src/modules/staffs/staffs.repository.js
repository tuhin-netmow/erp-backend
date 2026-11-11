const { User: Staff } = require('../users/user.model');
const { Department } = require('../departments/departments.model');
const { Role } = require('../roles/role.model');
const { PayrollStructure } = require('../payroll/payroll.structure.model');
const { Op } = require('sequelize');
const { sequelize } = require('../../core/database/sequelize');

class StaffRepository {
    async findAll(filters = {}, limit = 10, offset = 0) {
        const where = {};

        if (filters.department_id) {
            where.department_id = filters.department_id;
        }

        if (filters.role_id) {
            where.role_id = filters.role_id;
        }

        if (filters.status) {
            where.status = filters.status;
        }

        if (filters.search) {
            where[Op.or] = [
                { first_name: { [Op.like]: `%${filters.search}%` } },
                { last_name: { [Op.like]: `%${filters.search}%` } },
                { name: { [Op.like]: `%${filters.search}%` } },
                { email: { [Op.like]: `%${filters.search}%` } },
                { position: { [Op.like]: `%${filters.search}%` } }
            ];
        }

        return await Staff.findAndCountAll({
            where,
            attributes: {
                include: [
                    [
                        sequelize.literal(`(
                            SELECT COALESCE(SUM(amount), 0)
                            FROM payroll_advances
                            WHERE payroll_advances.staff_id = User.id
                        )`),
                        'total_advance'
                    ],
                    [
                        sequelize.literal(`(
                            SELECT COALESCE(SUM(returned_amount), 0)
                            FROM payroll_advances
                            WHERE payroll_advances.staff_id = User.id
                        )`),
                        'total_returned'
                    ]
                ]
            },
            limit,
            offset,
            order: [['created_at', 'DESC']],
            include: [
                {
                    model: Department,
                    as: 'department',
                    attributes: ['id', 'name', 'description']
                },
                {
                    model: Role,
                    as: 'role',
                    attributes: ['id', 'name', 'display_name']
                },
                {
                    model: PayrollStructure,
                    as: 'payrollStructure',
                    attributes: ['basic_salary', 'allowances', 'deductions', 'bank_details'],
                    required: false // LEFT JOIN to include staff even without payroll structure
                }
            ]
        });
    }

    async findById(id) {
        return await Staff.findByPk(id, {
            attributes: {
                include: [
                    [
                        sequelize.literal(`(
                            SELECT COALESCE(SUM(amount), 0)
                            FROM payroll_advances
                            WHERE payroll_advances.staff_id = User.id
                        )`),
                        'total_advance'
                    ],
                    [
                        sequelize.literal(`(
                            SELECT COALESCE(SUM(returned_amount), 0)
                            FROM payroll_advances
                            WHERE payroll_advances.staff_id = User.id
                        )`),
                        'total_returned'
                    ]
                ]
            },
            include: [
                {
                    model: Department,
                    as: 'department',
                    attributes: ['id', 'name', 'description']
                },
                {
                    model: Role,
                    as: 'role',
                    attributes: ['id', 'name', 'display_name']
                },
                {
                    model: PayrollStructure,
                    as: 'payrollStructure',
                    attributes: ['basic_salary', 'allowances', 'deductions', 'bank_details'],
                    required: false // LEFT JOIN to include staff even without payroll structure
                }
            ]
        });
    }

    async findByEmail(email) {
        return await Staff.findOne({ where: { email } });
    }

    async create(data) {
        return await Staff.create(data);
    }

    async update(id, data) {
        const staff = await Staff.findByPk(id);
        if (!staff) return null;
        return await staff.update(data);
    }

    async delete(id) {
        const staff = await Staff.findByPk(id);
        if (!staff) return null;
        await staff.destroy();
        return staff;
    }
}

module.exports = new StaffRepository();
