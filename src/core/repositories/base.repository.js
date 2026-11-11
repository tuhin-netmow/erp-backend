class BaseRepository {
    constructor(model) {
        this.model = model;
    }

    async findAll(options = {}) {
        return await this.model.findAll(options);
    }

    async findOne(options = {}) {
        return await this.model.findOne(options);
    }

    async findById(id, options = {}) {
        return await this.model.findByPk(id, options);
    }

    async create(data, options = {}) {
        return await this.model.create(data, options);
    }

    async update(id, data, options = {}) {
        const record = await this.findById(id);
        if (!record) return null;
        return await record.update(data, options);
    }

    async delete(id, options = {}) {
        const record = await this.findById(id);
        if (!record) return null;
        return await record.destroy(options);
    }

    async count(options = {}) {
        return await this.model.count(options);
    }

    async findAndCountAll(options = {}) {
        return await this.model.findAndCountAll(options);
    }
}

module.exports = BaseRepository;
