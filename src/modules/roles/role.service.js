const repo = require('./role.repository');

exports.list = (page, limit) => repo.findAll(page, limit);
exports.get = (id) => repo.findById(id);
exports.create = (data, userId) => repo.create({ ...data, created_by: userId });
exports.update = (id, data) => repo.update(id, data);
exports.remove = (id) => repo.delete(id);
