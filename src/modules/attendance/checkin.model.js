const { DataTypes } = require('sequelize');
const { sequelize } = require('../../core/database/sequelize');

const StaffCheckIn = sequelize.define('StaffCheckIn', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Customer being visited'
    },
    staff_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Staff member checking in'
    },
    check_in_time: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true,
        get() {
            const value = this.getDataValue('latitude');
            return value === null ? null : parseFloat(value);
        }
    },
    longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
        get() {
            const value = this.getDataValue('longitude');
            return value === null ? null : parseFloat(value);
        }
    },
    distance_meters: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Distance from customer location in meters',
        get() {
            const value = this.getDataValue('distance_meters');
            return value === null ? null : parseFloat(value);
        }
    },
    note: {
        type: DataTypes.TEXT,
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
    tableName: 'staff_checkins',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = { StaffCheckIn };
