const { DataTypes } = require('sequelize');
const { sequelize } = require('../../core/database/sequelize');

const RoleDashboard = sequelize.define('RoleDashboard', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    slug: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'stat' // stat, chart, list
    },
    size: {
        type: DataTypes.STRING(20),
        allowNull: true,
        defaultValue: '1x1' // Grid size or col-span
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
    tableName: 'role_dashboards',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = { RoleDashboard };
