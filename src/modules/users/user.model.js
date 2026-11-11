const { DataTypes } = require('sequelize');
const { sequelize } = require('../../core/database/sequelize');

// Define User model
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  role_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  thumb_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  // --- Fields merged from Staff ---
  position: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  hire_date: {
    type: DataTypes.DATEONLY, // Changed to DATEONLY to match Staff
    allowNull: true
  },
  salary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    get() {
      const value = this.getDataValue('salary');
      return value === null ? null : parseFloat(value);
    }
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  postal_code: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'terminated', 'on_leave'),
    defaultValue: 'active'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  gallery_items: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null
  },
  // --------------------------------
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeValidate: (user) => {
      // Sync name <-> first/last
      if (user.first_name && user.last_name && !user.name) {
        user.name = `${user.first_name} ${user.last_name}`;
      } else if (user.name && (!user.first_name || !user.last_name)) {
        const parts = user.name.split(' ');
        if (!user.first_name) user.first_name = parts[0];
        if (!user.last_name) user.last_name = parts.slice(1).join(' ') || '';
      }
    }
  }
});

const { Role } = require('../roles/role.model');
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

const { Department } = require('../departments/departments.model');
User.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

module.exports = { User };
