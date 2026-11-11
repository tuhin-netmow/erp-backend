const { DataTypes } = require('sequelize');
const { sequelize } = require('../../core/database/sequelize');

const Attendance = sequelize.define('Attendance', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    staff_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    check_in: {
        type: DataTypes.TIME,
        allowNull: true
    },
    check_out: {
        type: DataTypes.TIME,
        allowNull: true
    },
    total_hours: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0,
        get() {
            const value = this.getDataValue('total_hours');
            return value === null ? null : parseFloat(value);
        }
    },
    status: {
        type: DataTypes.ENUM('present', 'absent', 'late', 'half_day', 'on_leave'),
        defaultValue: 'present'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true
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
    tableName: 'attendances',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = { Attendance };
