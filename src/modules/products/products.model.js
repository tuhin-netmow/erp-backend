const { DataTypes } = require('sequelize');
const { sequelize } = require('../../core/database/sequelize');

const Product = sequelize.define('Product', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    sku: {
        type: DataTypes.STRING(100),
        unique: true,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    specification: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    product_type: {
        type: DataTypes.ENUM('standard', 'raw_material', 'finished_good', 'service'),
        defaultValue: 'standard',
        allowNull: false
    },
    category_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    unit_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        get() {
            const value = this.getDataValue('price');
            return value === null ? null : parseFloat(value);
        }
    },
    cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        get() {
            const value = this.getDataValue('cost');
            return value === null ? null : parseFloat(value);
        }
    },
    purchase_tax: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0.00,
        comment: 'Purchase tax percentage',
        get() {
            const value = this.getDataValue('purchase_tax');
            return value === null ? null : parseFloat(value);
        }
    },
    sales_tax: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0.00,
        comment: 'Sales tax percentage',
        get() {
            const value = this.getDataValue('sales_tax');
            return value === null ? null : parseFloat(value);
        }
    },
    stock_quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        comment: 'Current stock quantity - supports decimals',
        get() {
            const value = this.getDataValue('stock_quantity');
            return value === null ? null : parseFloat(value);
        }
    },
    initial_stock: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Initial stock quantity when product was created - supports decimals',
        get() {
            const value = this.getDataValue('initial_stock');
            return value === null ? null : parseFloat(value);
        }
    },
    min_stock_level: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Minimum stock level alert threshold - supports decimals',
        get() {
            const value = this.getDataValue('min_stock_level');
            return value === null ? null : parseFloat(value);
        }
    },
    max_stock_level: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Maximum stock level - supports decimals',
        get() {
            const value = this.getDataValue('max_stock_level');
            return value === null ? null : parseFloat(value);
        }
    },
    barcode: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    image_url: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    // Logistics fields
    weight: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Weight in kilograms (kg)',
        get() {
            const value = this.getDataValue('weight');
            return value === null ? null : parseFloat(value);
        }
    },
    length: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Length in centimeters (cm)',
        get() {
            const value = this.getDataValue('length');
            return value === null ? null : parseFloat(value);
        }
    },
    width: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Width in centimeters (cm)',
        get() {
            const value = this.getDataValue('width');
            return value === null ? null : parseFloat(value);
        }
    },
    height: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Height in centimeters (cm)',
        get() {
            const value = this.getDataValue('height');
            return value === null ? null : parseFloat(value);
        }
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    is_commissionable: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    expiry_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: 'Product expiry date'
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
    tableName: 'products',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

const Category = sequelize.define('Category', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    parent_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    sort_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
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
    tableName: 'categories',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

const Unit = sequelize.define('Unit', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    symbol: {
        type: DataTypes.STRING(20),
        allowNull: false
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
    tableName: 'units',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Product Image Gallery Model
const ProductImage = sequelize.define('ProductImage', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    image_url: {
        type: DataTypes.STRING(500),
        allowNull: false
    },
    is_primary: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Main product image'
    },
    sort_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Display order in gallery'
    },
    caption: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Image caption or alt text'
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
    tableName: 'product_images',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Define associations
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Product.belongsTo(Unit, { foreignKey: 'unit_id', as: 'unit' });
Product.hasMany(ProductImage, { foreignKey: 'product_id', as: 'images' });

Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });
Unit.hasMany(Product, { foreignKey: 'unit_id', as: 'products' });

ProductImage.belongsTo(Product, { foreignKey: 'product_id' });

module.exports = { Product, Category, Unit, ProductImage };
