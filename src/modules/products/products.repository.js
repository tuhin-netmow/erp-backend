const { Product, Category, Unit, ProductImage } = require('./products.model');
const { Op, Sequelize } = require('sequelize');

class ProductRepository {
    async findAll(filters = {}, limit = 10, offset = 0) {
        const where = {};

        if (filters.category_id) {
            where.category_id = filters.category_id;
        }

        if (filters.is_active !== undefined) {
            where.is_active = filters.is_active;
        }

        if (filters.stock_status) {
            const status = String(filters.stock_status).toLowerCase().trim();
            if (status === 'available' || status === 'in_stock' || status === 'instock') {
                where.stock_quantity = { [Op.gt]: 0 };
            } else if (status === 'out_of_stock' || status === 'outofstock') {
                where.stock_quantity = { [Op.lte]: 0 };
            } else if (status === 'low_stock' || status === 'lowstock') {
                where.stock_quantity = {
                    [Op.and]: [
                        { [Op.lte]: Sequelize.col('min_stock_level') },
                        { [Op.gt]: 0 }
                    ]
                };
            }
        }

        if (filters.product_type) {
            where.product_type = filters.product_type;
        }

        if (filters.search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${filters.search}%` } },
                { sku: { [Op.like]: `%${filters.search}%` } },
                { barcode: { [Op.like]: `%${filters.search}%` } }
            ];
        }

        return await Product.findAndCountAll({
            where,
            include: [
                { model: Category, as: 'category' },
                { model: Unit, as: 'unit' },
                {
                    model: ProductImage,
                    as: 'images',
                    order: [['sort_order', 'ASC'], ['is_primary', 'DESC']]
                }
            ],
            limit,
            offset,
            order: [['created_at', 'DESC']],
            distinct: true
        });
    }

    async findById(id) {
        return await Product.findByPk(id, {
            include: [
                { model: Category, as: 'category' },
                { model: Unit, as: 'unit' },
                {
                    model: ProductImage,
                    as: 'images',
                    order: [['sort_order', 'ASC'], ['is_primary', 'DESC']]
                }
            ]
        });
    }

    async findByIds(ids = []) {
        if (!Array.isArray(ids) || ids.length === 0) {
            return [];
        }

        return Product.findAll({
            where: {
                id: {
                    [Op.in]: ids
                }
            },
            include: [
                { model: Category, as: 'category' },
                { model: Unit, as: 'unit' },
                {
                    model: ProductImage,
                    as: 'images',
                    separate: true, // important for correct ordering
                    order: [
                        ['sort_order', 'ASC'],
                        ['is_primary', 'DESC']
                    ]
                }
            ]
        });
    }


    async findBySku(sku) {
        return await Product.findOne({ where: { sku } });
    }

    async create(data) {
        return await Product.create(data);
    }

    async update(id, data) {
        const product = await Product.findByPk(id);
        if (!product) return null;
        return await product.update(data);
    }

    async delete(id) {
        const product = await Product.findByPk(id);
        if (!product) return null;
        await product.destroy();
        return product;
    }

    async getLowStockProducts() {
        return await Product.findAll({
            where: {
                stock_quantity: {
                    [Op.lte]: Sequelize.col('min_stock_level')
                },
                is_active: true
            },
            include: [
                { model: Category, as: 'category' },
                { model: Unit, as: 'unit' }
            ]
        });
    }

    async getStockDetails() {
        const totalProducts = await Product.count({ where: { is_active: true } });

        const lowStockProducts = await this.getLowStockProducts();

        const totalValueResult = await Product.findAll({
            attributes: [
                [Sequelize.fn('SUM', Sequelize.literal('stock_quantity * COALESCE(cost, 0)')), 'totalValue']
            ],
            where: { is_active: true },
            raw: true
        });

        const totalStockValue = totalValueResult[0].totalValue || 0;



        return {
            total_products: totalProducts,
            low_stock_count: lowStockProducts.length,
            total_stock_value: parseFloat(totalStockValue).toFixed(2),
            low_stock_products: lowStockProducts
        };
    }

    async getStats() {
        const [activeProducts, totalProducts, lowStockProducts, outOfStockProducts, financialResults] = await Promise.all([
            // Active Products
            Product.count({ where: { is_active: true } }),

            // Total Products
            Product.count(),

            // Low Stock Products
            Product.count({
                where: {
                    stock_quantity: {
                        [Op.and]: [
                            { [Op.lte]: Sequelize.col('min_stock_level') },
                            { [Op.gt]: 0 }
                        ]
                    },
                    is_active: true
                }
            }),

            // Out of Stock Products
            Product.count({
                where: {
                    stock_quantity: 0,
                    is_active: true
                }
            }),

            // Financial Calculations
            Product.findOne({
                attributes: [
                    [Sequelize.fn('SUM', Sequelize.literal('stock_quantity * COALESCE(cost, 0)')), 'totalCost'],
                    [Sequelize.fn('SUM', Sequelize.literal('stock_quantity * COALESCE(price, 0)')), 'totalPrice']
                ],
                where: { is_active: true },
                raw: true
            })
        ]);

        const totalCost = parseFloat(financialResults?.totalCost || 0);
        const totalPrice = parseFloat(financialResults?.totalPrice || 0);

        return {
            activeProducts,
            totalProducts,
            lowStockProducts,
            outOfStockProducts,
            totalCost,
            totalPrice,
            totalProfit: totalPrice - totalCost
        };
    }

    async getProductOrders(productId, filters = {}, limit = 10, offset = 0) {
        const { Order, OrderItem } = require('../sales/sales.models');
        const { Customer } = require('../customers/customers.model');

        const where = {};

        // Add status filter if provided
        if (filters.status) {
            where.status = filters.status;
        }

        // Add date range filters if provided
        if (filters.start_date || filters.end_date) {
            where.order_date = {};
            if (filters.start_date) {
                where.order_date[Op.gte] = new Date(filters.start_date);
            }
            if (filters.end_date) {
                where.order_date[Op.lte] = new Date(filters.end_date);
            }
        }

        return await Order.findAndCountAll({
            where,
            include: [
                {
                    model: OrderItem,
                    as: 'items',
                    where: { product_id: productId },
                    required: true,
                    include: [
                        {
                            model: Product,
                            as: 'product',
                            attributes: ['id', 'name', 'sku', 'image_url']
                        }
                    ]
                },
                {
                    model: Customer,
                    as: 'customer',
                    attributes: ['id', 'name', 'email', 'phone', 'company']
                }
            ],
            limit,
            offset,
            order: [['order_date', 'DESC']],
            distinct: true
        });
    }

    async getProductsExpiringSoon(months = 6) {
        const today = new Date();
        const expiryThreshold = new Date();
        expiryThreshold.setMonth(today.getMonth() + months);

        return await Product.findAll({
            where: {
                expiry_date: {
                    [Op.and]: [
                        { [Op.ne]: null },
                        { [Op.lte]: expiryThreshold },
                        { [Op.gte]: today }
                    ]
                },
                is_active: true
            },
            include: [
                { model: Category, as: 'category' },
                { model: Unit, as: 'unit' }
            ],
            order: [['expiry_date', 'ASC']]
        });
    }

    async getProductsExpiringInPeriod(startDate, endDate) {
        return await Product.findAll({
            where: {
                expiry_date: {
                    [Op.and]: [
                        { [Op.ne]: null },
                        { [Op.gte]: startDate },
                        { [Op.lte]: endDate }
                    ]
                },
                is_active: true
            },
            include: [
                { model: Category, as: 'category' },
                { model: Unit, as: 'unit' }
            ],
            order: [['expiry_date', 'ASC']]
        });
    }

    async getExpiredProducts() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return await Product.findAll({
            where: {
                expiry_date: {
                    [Op.and]: [
                        { [Op.ne]: null },
                        { [Op.lt]: today }
                    ]
                },
                is_active: true
            },
            include: [
                { model: Category, as: 'category' },
                { model: Unit, as: 'unit' }
            ],
            order: [['expiry_date', 'DESC']]
        });
    }

    async getExpiringProductsStats() {
        const today = new Date();
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(today.getMonth() + 6);

        const threeMonthsFromNow = new Date();
        threeMonthsFromNow.setMonth(today.getMonth() + 3);

        const oneMonthFromNow = new Date();
        oneMonthFromNow.setMonth(today.getMonth() + 1);

        const [
            expiringIn6Months,
            expiringIn3Months,
            expiringIn1Month,
            expiredProducts
        ] = await Promise.all([
            Product.count({
                where: {
                    expiry_date: {
                        [Op.and]: [
                            { [Op.ne]: null },
                            { [Op.lte]: sixMonthsFromNow },
                            { [Op.gte]: today }
                        ]
                    },
                    is_active: true
                }
            }),
            Product.count({
                where: {
                    expiry_date: {
                        [Op.and]: [
                            { [Op.ne]: null },
                            { [Op.lte]: threeMonthsFromNow },
                            { [Op.gte]: today }
                        ]
                    },
                    is_active: true
                }
            }),
            Product.count({
                where: {
                    expiry_date: {
                        [Op.and]: [
                            { [Op.ne]: null },
                            { [Op.lte]: oneMonthFromNow },
                            { [Op.gte]: today }
                        ]
                    },
                    is_active: true
                }
            }),
            Product.count({
                where: {
                    expiry_date: {
                        [Op.lt]: today
                    },
                    is_active: true
                }
            })
        ]);

        return {
            expiringIn6Months,
            expiringIn3Months,
            expiringIn1Month,
            expiredProducts
        };
    }
}

class CategoryRepository {
    async findAll(filters = {}, limit = 10, offset = 0) {
        const where = {};

        if (filters.search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${filters.search}%` } },
                { description: { [Op.like]: `%${filters.search}%` } }
            ];
        }

        return await Category.findAndCountAll({
            where,
            limit,
            offset,
            order: [['sort_order', 'ASC'], ['name', 'ASC']]
        });
    }

    async findById(id) {
        return await Category.findByPk(id);
    }

    async create(data) {
        return await Category.create(data);
    }

    async update(id, data) {
        const category = await Category.findByPk(id);
        if (!category) return null;
        return await category.update(data);
    }

    async delete(id) {
        const category = await Category.findByPk(id);
        if (!category) return null;
        await category.destroy();
        return category;
    }

    /**
     * Reorder categories in a single transaction using bulk update
     * @param {Array<number>} order - Array of category IDs in desired order
     * @returns {Promise<Array>} Updated categories
     */
    async reorder(order) {
        if (!Array.isArray(order) || order.length === 0) {
            throw new Error('Order must be a non-empty array of category IDs');
        }

        const { sequelize } = Category;

        // Validate that all IDs exist
        const categories = await Category.findAll({
            where: { id: { [Op.in]: order } },
            attributes: ['id']
        });

        if (categories.length !== order.length) {
            throw new Error('One or more category IDs are invalid');
        }

        // Build CASE statement for efficient single-query update
        // This avoids N+1 query problem while being database-agnostic
        const caseStatements = order.map((id, index) =>
            `WHEN ${id} THEN ${index}`
        ).join(' ');

        return await sequelize.transaction(async (t) => {
            // Single query to update all sort_order values
            await sequelize.query(
                `UPDATE categories
                 SET sort_order = CASE id ${caseStatements} END
                 WHERE id IN (${order.join(',')})`,
                { transaction: t }
            );

            // Return the updated categories
            return await Category.findAll({
                where: { id: { [Op.in]: order } },
                order: [['sort_order', 'ASC']],
                transaction: t
            });
        });
    }

    /**
     * Reset sort_order for all categories to 0
     * Use with caution - affects all categories
     */
    async resetOrder() {
        return await Category.update(
            { sort_order: 0 },
            { where: {} }
        );
    }

    async findWithProducts(filters = {}) {
        const where = {};

        if (filters.is_active !== undefined) {
            where.is_active = filters.is_active;
        }

        // Get all categories
        const categories = await Category.findAll({
            where: { is_active: true },
            order: [['sort_order', 'ASC'], ['name', 'ASC']]
        });

        // For each category, get its products
        const categoriesWithProducts = await Promise.all(
            categories.map(async (category) => {
                const productWhere = {
                    category_id: category.id,
                    ...where
                };

                // Add search filter if provided
                if (filters.search) {
                    productWhere[Op.or] = [
                        { name: { [Op.like]: `%${filters.search}%` } },
                        { sku: { [Op.like]: `%${filters.search}%` } },
                        { barcode: { [Op.like]: `%${filters.search}%` } }
                    ];
                }

                const products = await Product.findAll({
                    where: productWhere,
                    include: [
                        { model: Unit, as: 'unit' },
                        {
                            model: ProductImage,
                            as: 'images',
                            order: [['sort_order', 'ASC'], ['is_primary', 'DESC']]
                        }
                    ],
                    order: [['name', 'ASC']]
                });

                return {
                    ...category.toJSON(),
                    products
                };
            })
        );

        // Filter out categories with no products if needed
        const result = filters.only_with_products
            ? categoriesWithProducts.filter(cat => cat.products.length > 0)
            : categoriesWithProducts;

        return result;
    }
}

class UnitRepository {
    async findAll(filters = {}, limit = 10, offset = 0) {
        const where = {};

        if (filters.search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${filters.search}%` } },
                { symbol: { [Op.like]: `%${filters.search}%` } }
            ];
        }

        return await Unit.findAndCountAll({
            where,
            limit,
            offset,
            order: [['name', 'ASC']]
        });
    }

    async findById(id) {
        return await Unit.findByPk(id);
    }

    async create(data) {
        return await Unit.create(data);
    }

    async update(id, data) {
        const unit = await Unit.findByPk(id);
        if (!unit) return null;
        return await unit.update(data);
    }

    async delete(id) {
        const unit = await Unit.findByPk(id);
        if (!unit) return null;
        await unit.destroy();
        return unit;
    }
}

class ProductImageRepository {
    async findByProductId(productId) {
        return await ProductImage.findAll({
            where: { product_id: productId },
            order: [['is_primary', 'DESC'], ['sort_order', 'ASC']]
        });
    }

    async findById(id) {
        return await ProductImage.findByPk(id);
    }

    async create(data) {
        return await ProductImage.create(data);
    }

    async createMultiple(images) {
        return await ProductImage.bulkCreate(images);
    }

    async update(id, data) {
        const image = await ProductImage.findByPk(id);
        if (!image) return null;
        return await image.update(data);
    }

    async delete(id) {
        const image = await ProductImage.findByPk(id);
        if (!image) return null;
        await image.destroy();
        return image;
    }

    async deleteByProductId(productId) {
        return await ProductImage.destroy({
            where: { product_id: productId }
        });
    }

    async setPrimaryImage(productId, imageId) {
        // Remove primary flag from all images of this product
        await ProductImage.update(
            { is_primary: false },
            { where: { product_id: productId } }
        );

        // Set the specified image as primary
        const image = await ProductImage.findByPk(imageId);
        if (image && image.product_id === productId) {
            return await image.update({ is_primary: true });
        }
        return null;
    }
}

module.exports = {
    ProductRepository: new ProductRepository(),
    CategoryRepository: new CategoryRepository(),
    UnitRepository: new UnitRepository(),
    ProductImageRepository: new ProductImageRepository()
};
