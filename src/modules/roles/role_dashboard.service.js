const repo = require('./role_dashboard.repository');

exports.create = (data) => repo.create(data);
exports.list = () => repo.findAll();
exports.get = (id) => repo.findById(id);
exports.update = (id, data) => repo.update(id, data);
exports.remove = (id) => repo.delete(id);
