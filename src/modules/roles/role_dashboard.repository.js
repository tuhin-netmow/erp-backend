// role_dashboard.repository.js
const { RoleDashboard } = require('./role_dashboard.model');

exports.create = async (data) => {
    return await RoleDashboard.create(data);
};

exports.findAll = async () => {
    return await RoleDashboard.findAll({
        order: [['name', 'ASC']]
    });
};

exports.findById = async (id) => {
    return await RoleDashboard.findByPk(id);
};

exports.update = async (id, data) => {
    const widget = await RoleDashboard.findByPk(id);
    if (!widget) return null;
    return await widget.update(data);
};

exports.delete = async (id) => {
    const widget = await RoleDashboard.findByPk(id);
    if (!widget) return false;
    await widget.destroy();
    return true;
};
