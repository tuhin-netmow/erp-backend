const { DataTypes } = require('sequelize');
const { sequelize } = require('../../core/database/sequelize');

const RoleMenu = sequelize.define('RoleMenu', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    icon: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    path: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    parent_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    sort_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'role_menus',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Self-join for hierarchy
RoleMenu.hasMany(RoleMenu, { foreignKey: 'parent_id', as: 'children' });
RoleMenu.belongsTo(RoleMenu, { foreignKey: 'parent_id', as: 'parent' });

module.exports = { RoleMenu };
