const { DataTypes } = require('sequelize');
const { sequelize } = require('../../core/database/sequelize');
const { Product } = require('../products/products.model');

// Bill of Materials (BOM) Header
const BOM = sequelize.define('BOM', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Finished good product ID'
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
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
    tableName: 'boms',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Bill of Materials (BOM) Items
const BOMItem = sequelize.define('BOMItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    bom_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Raw material product ID'
    },
    quantity: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: false,
        defaultValue: 1.0000,
        comment: 'Quantity required per unit of finished good'
    },
    wastage_percent: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0.00,
        comment: 'Estimated wastage percentage'
    },
    notes: {
        type: DataTypes.STRING(255),
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
    tableName: 'bom_items',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Production Run
const ProductionRun = sequelize.define('ProductionRun', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    run_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Finished good to produce'
    },
    bom_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Snapshot of BOM used'
    },
    quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 1.00,
        get() {
            const value = this.getDataValue('quantity');
            return value === null ? null : parseFloat(value);
        }
    },
    start_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    end_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('scheduled', 'in_progress', 'completed', 'cancelled'),
        defaultValue: 'scheduled'
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
    tableName: 'production_runs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Associations
BOM.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
BOM.hasMany(BOMItem, { foreignKey: 'bom_id', as: 'items', onDelete: 'CASCADE' });

BOMItem.belongsTo(BOM, { foreignKey: 'bom_id', as: 'bom' });
BOMItem.belongsTo(Product, { foreignKey: 'product_id', as: 'raw_material' });

ProductionRun.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
ProductionRun.belongsTo(BOM, { foreignKey: 'bom_id', as: 'bom' });

// Add relationships to Product (optional but helpful)
Product.hasMany(BOM, { foreignKey: 'product_id', as: 'boms' });
Product.hasMany(ProductionRun, { foreignKey: 'product_id', as: 'production_runs' });

module.exports = { BOM, BOMItem, ProductionRun };
