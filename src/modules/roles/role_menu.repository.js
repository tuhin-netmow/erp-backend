// role_menu.repository.js
const { RoleMenu } = require('./role_menu.model');

exports.create = async (data) => {
    return await RoleMenu.create(data);
};

exports.findAll = async () => {
    // Get hierarchy
    const menus = await RoleMenu.findAll({
        where: { parent_id: null },
        include: [
            {
                model: RoleMenu,
                as: 'children',
                include: [{ model: RoleMenu, as: 'children' }] // 2 levels deep
            }
        ],
        order: [['sort_order', 'ASC'], [{ model: RoleMenu, as: 'children' }, 'sort_order', 'ASC']]
    });
    return menus;
};

exports.findById = async (id) => {
    return await RoleMenu.findByPk(id, {
        include: [{ model: RoleMenu, as: 'children' }]
    });
};

exports.update = async (id, data) => {
    const menu = await RoleMenu.findByPk(id);
    if (!menu) return null;
    return await menu.update(data);
};

exports.delete = async (id) => {
    const menu = await RoleMenu.findByPk(id);
    if (!menu) return false;
    await menu.destroy();
    return true;
};
