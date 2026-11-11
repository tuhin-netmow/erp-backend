const { Department } = require('./departments.model');
const { Op } = require('sequelize');

class DepartmentRepository {
    async findAll(filters = {}, limit = 10, offset = 0) {
        const where = {};
        if (filters.status) {
            where.status = filters.status;
        }

        if (filters.search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${filters.search}%` } },
                { description: { [Op.like]: `%${filters.search}%` } }
            ];
        }

        return await Department.findAndCountAll({
            where,
            order: [['name', 'ASC']],
            limit,
            offset
        });
    }

    async findById(id) {
        return await Department.findByPk(id);
    }

    async findByName(name) {
        return await Department.findOne({ where: { name } });
    }

    async create(data) {
        return await Department.create(data);
    }

    async update(id, data) {
        const department = await Department.findByPk(id);
        if (!department) return null;
        await department.update(data);
        return await this.findById(id);
    }

    async delete(id) {
        const department = await Department.findByPk(id);
        if (!department) return null;
        await department.destroy();
        return department;
    }
}

module.exports = new DepartmentRepository();
