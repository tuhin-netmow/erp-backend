const { DataTypes } = require('sequelize');
const { sequelize } = require('../../core/database/sequelize');

const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'NULL means notification for all users'
    },
    type: {
        type: DataTypes.ENUM('order', 'stock', 'payment', 'customer', 'system', 'return', 'delivery'),
        allowNull: false
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    link: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    reference_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Entity type: order, product, customer, etc.'
    },
    reference_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Entity ID for reference'
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium'
    },
    read_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
        { fields: ['user_id'] },
        { fields: ['is_read'] },
        { fields: ['type'] },
        { fields: ['created_at'] }
    ]
});

const { User } = require('../users/user.model');
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = { Notification };
