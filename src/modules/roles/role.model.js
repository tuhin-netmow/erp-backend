const { DataTypes } = require('sequelize');
const { sequelize } = require('../../core/database/sequelize');

// Role model
const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  display_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
  },
  permissions: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const val = this.getDataValue('permissions');
      return val ? JSON.parse(val) : [];
    },
    set(val) {
      this.setDataValue('permissions', JSON.stringify(val));
    },
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'roles',
  timestamps: false,
});

// RoleSettings model
const RoleSettings = sequelize.define('RoleSettings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  role_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  menu: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  dashboard: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  custom: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'role_settings',
  timestamps: false,
});

Role.hasOne(RoleSettings, { foreignKey: 'role_id', sourceKey: 'id' });
RoleSettings.belongsTo(Role, { foreignKey: 'role_id', targetKey: 'id' });

module.exports = { Role, RoleSettings };
