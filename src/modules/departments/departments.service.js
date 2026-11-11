const DepartmentRepository = require('./departments.repository');

class DepartmentService {
    async getAllDepartments(filters = {}, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const result = await DepartmentRepository.findAll(filters, limit, offset);
        return {
            data: result.rows,
            total: result.count
        };
    }

    async getDepartmentById(id) {
        const department = await DepartmentRepository.findById(id);
        if (!department) {
            throw new Error('Department not found');
        }
        return department;
    }

    async createDepartment(data, userId) {
        // Check duplicate name
        const existing = await DepartmentRepository.findByName(data.name);
        if (existing) {
            throw new Error('Department with this name already exists');
        }

        return await DepartmentRepository.create({ ...data, created_by: userId });
    }

    async updateDepartment(id, data) {
        if (data.name) {
            const existing = await DepartmentRepository.findByName(data.name);
            if (existing && existing.id !== parseInt(id)) {
                throw new Error('Department with this name already exists');
            }
        }

        const department = await DepartmentRepository.update(id, data);
        if (!department) {
            throw new Error('Department not found');
        }
        return department;
    }

    async deleteDepartment(id) {
        const department = await DepartmentRepository.delete(id);
        if (!department) {
            throw new Error('Department not found');
        }
        return department;
    }
}

module.exports = new DepartmentService();
