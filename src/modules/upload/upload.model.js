const { DataTypes } = require('sequelize');
const { sequelize } = require('../../core/database/sequelize');

const Gallery = sequelize.define('Gallery', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    filename: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    originalname: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    mimetype: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    size: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    url: {
        type: DataTypes.STRING(500),
        allowNull: false
    },
    path: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    caption: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    alt_text: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    uploaded_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    }
}, {
    tableName: 'gallery',
    underscored: true,
    timestamps: true
});

module.exports = { Gallery };
