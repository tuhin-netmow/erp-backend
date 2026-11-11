const { User } = require('../users/user.model');
const { Staff } = require('../staffs/staffs.model');
const { Role, RoleSettings } = require('../roles/role.model');
const { RoleMenu } = require('../roles/role_menu.model');
const { RoleDashboard } = require('../roles/role_dashboard.model');

exports.findByEmail = async (email) => {
  // First check User table
  let user = await User.findOne({ where: { email } });
  if (user) return user;

  // Then check Staff table
  return Staff.findOne({ where: { email } });
};

exports.findByEmailWithRole = async (email) => {
  // First check User table
  let user = await User.findOne({
    where: { email },
    include: [
      {
        model: Role,
        as: 'role',
        include: [
          {
            model: RoleSettings,
            required: false
          }
        ]
      }
    ]
  });

  if (user) return user;

  // Then check Staff table
  return Staff.findOne({
    where: { email },
    include: [
      {
        model: Role,
        as: 'role',
        include: [
          {
            model: RoleSettings,
            required: false
          }
        ]
      }
    ]
  });
};

exports.findById = async (id) => {
  // First check User table
  let user = await User.findByPk(id);
  if (user) return user;

  // Then check Staff table
  return Staff.findByPk(id);
};

exports.findByIdWithRole = async (id) => {
  // First check User table
  let user = await User.findByPk(id, {
    include: [
      {
        model: Role,
        as: 'role',
        include: [
          {
            model: RoleSettings,
            required: false
          }
        ]
      }
    ]
  });

  if (user) return user;

  // Then check Staff table
  return Staff.findByPk(id, {
    include: [
      {
        model: Role,
        as: 'role',
        include: [
          {
            model: RoleSettings,
            required: false
          }
        ]
      }
    ]
  });
};

exports.update = async (id, data) => {
  // Try to find and update in User table first
  let user = await User.findByPk(id);
  if (user) {
    return await user.update(data);
  }

  // If not found, try Staff table
  let staff = await Staff.findByPk(id);
  if (staff) {
    return await staff.update(data);
  }

  return null;
};

exports.create = async (data) => {
  return User.create(data);
};

exports.getRoleMenus = async () => {
  return RoleMenu.findAll({
    where: { is_active: true },
    order: [
      ['sort_order', 'ASC'],
      ['id', 'ASC']
    ]
  });
};

exports.getRoleDashboards = async () => {
  return RoleDashboard.findAll({
    where: { is_active: true },
    order: [['id', 'ASC']]
  });
};
