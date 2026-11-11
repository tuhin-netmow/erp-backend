const { ProductRepository, CategoryRepository, UnitRepository, ProductImageRepository } = require('./products.repository');

class ProductService {
    // Helper method to transform product data
    _transformProduct(product) {
        const productData = product.toJSON ? product.toJSON() : product;

        // Transform image_url to thumb_url
        const transformed = {
            ...productData,
            thumb_url: productData.image_url || null,
            // Convert numeric fields to proper numbers
            price: (productData.price !== null && productData.price !== undefined) ? parseFloat(productData.price) : null,
            cost: (productData.cost !== null && productData.cost !== undefined) ? parseFloat(productData.cost) : null,
            purchase_tax: productData.purchase_tax ? parseFloat(productData.purchase_tax) : 0,
            sales_tax: productData.sales_tax ? parseFloat(productData.sales_tax) : 0,
            stock_quantity: (productData.stock_quantity !== null && productData.stock_quantity !== undefined) ? parseFloat(productData.stock_quantity) : 0,
            min_stock_level: (productData.min_stock_level !== null && productData.min_stock_level !== undefined) ? parseFloat(productData.min_stock_level) : null,
            max_stock_level: (productData.max_stock_level !== null && productData.max_stock_level !== undefined) ? parseFloat(productData.max_stock_level) : null,
            weight: productData.weight ? parseFloat(productData.weight) : null,
            length: productData.length ? parseFloat(productData.length) : null,
            width: productData.width ? parseFloat(productData.width) : null,
            height: productData.height ? parseFloat(productData.height) : null
        };

        // Remove image_url from response
        delete transformed.image_url;

        // Transform images array to gallery_items (array of URLs)
        if (productData.images && Array.isArray(productData.images)) {
            transformed.gallery_items = productData.images.map(img => img.image_url);
            delete transformed.images;
        }

        // Add expiry information if expiry_date exists
        if (productData.expiry_date) {
            const today = new Date();
            const expiryDate = new Date(productData.expiry_date);
            const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

            transformed.days_until_expiry = daysUntilExpiry;
            transformed.expiry_status = this._getExpiryStatus(daysUntilExpiry);
            transformed.expired = daysUntilExpiry <= 0; // Visual indicator for expired products
        }

        return transformed;
    }

    // Product methods
    async getAllProducts(filters = {}, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const result = await ProductRepository.findAll(filters, limit, offset);

        // Transform each product
        const transformedData = result.rows.map(product => this._transformProduct(product));

        return {
            data: transformedData,
            total: result.count
        };
    }

    async getProductById(id) {
        const product = await ProductRepository.findById(id);
        if (!product) {
            throw new Error('Product not found');
        }
        return this._transformProduct(product);
    }

    async createProduct(data, userId) {
        // Check if SKU already exists if provided
        if (data.sku) {
            const existing = await ProductRepository.findBySku(data.sku);
            if (existing) {
                throw new Error('Product with this SKU already exists');
            }
        }

        const { thumb_url, gallery_items, ...productData } = data;

        // Map thumb_url to image_url if image_url is not provided
        if (thumb_url && !productData.image_url) {
            productData.image_url = thumb_url;
        }

        // Set initial_stock if not provided (use stock_quantity)
        if (productData.initial_stock === undefined || productData.initial_stock === null) {
            productData.initial_stock = productData.stock_quantity || 0;
        }

        // Handle automatic SKU generation if not provided
        if (!productData.sku) {
            try {
                const { generateNumber } = require('../settings/numbering.helper');
                productData.sku = await generateNumber('product');
            } catch (err) {
                console.error('Error generating automatic SKU:', err);
                // Fallback to timestamp if settings fetch fails
                productData.sku = `PROD-${Date.now()}`;
            }
        }

        const product = await ProductRepository.create({ ...productData, created_by: userId });

        // Handle gallery items
        if (gallery_items && Array.isArray(gallery_items) && gallery_items.length > 0) {
            const images = gallery_items.map((url, index) => ({
                product_id: product.id,
                image_url: url,
                sort_order: index
            }));
            await ProductImageRepository.createMultiple(images);
        }

        return product;
    }

    async updateProduct(id, data) {
        // If SKU is being updated, check for duplicates
        if (data.sku) {
            const existing = await ProductRepository.findBySku(data.sku);
            if (existing && existing.id !== parseInt(id)) {
                throw new Error('Product with this SKU already exists');
            }
        }

        const { thumb_url, gallery_items, ...productData } = data;

        // Map thumb_url to image_url if provided
        if (thumb_url && !productData.image_url) {
            productData.image_url = thumb_url;
        }

        const product = await ProductRepository.update(id, productData);
        if (!product) {
            throw new Error('Product not found');
        }

        const transformed = this._transformProduct(product);

        // Handle gallery items if provided
        if (gallery_items && Array.isArray(gallery_items)) {
            // Delete existing images for this product using bulk delete (single query)
            await ProductImageRepository.deleteByProductId(id);

            // Add new images using bulk create (single query)
            if (gallery_items.length > 0) {
                const images = gallery_items.map((url, index) => ({
                    product_id: id,
                    image_url: url,
                    sort_order: index
                }));
                await ProductImageRepository.createMultiple(images);
            }
        }

        return transformed;
    }

    async deleteProduct(id) {
        const product = await ProductRepository.delete(id);
        if (!product) {
            throw new Error('Product not found');
        }
        return product;
    }

    async updateStock(id, data) {
        const product = await ProductRepository.findById(id);
        if (!product) {
            throw new Error('Product not found');
        }

        const { operation, quantity, notes, userId } = data;
        let newStockQuantity = product.stock_quantity;
        let movementQuantity = 0;
        let movementType = 'adjustment';

        if (operation === 'add') {
            newStockQuantity += quantity;
            movementQuantity = quantity; // Positive for stock in
            movementType = 'purchase';
        } else if (operation === 'subtract') {
            newStockQuantity -= quantity;
            if (newStockQuantity < 0) {
                throw new Error('Insufficient stock quantity');
            }
            movementQuantity = -quantity; // Negative for stock out
            movementType = 'adjustment';
        } else if (operation === 'set') {
            movementQuantity = quantity - product.stock_quantity;
            newStockQuantity = quantity;
            movementType = 'adjustment';
        } else {
            throw new Error('Invalid operation. Use "add", "subtract", or "set"');
        }

        // Update stock and create movement record
        const StockMovement = require('./stock-movement.model');
        const updated = await ProductRepository.update(id, { stock_quantity: newStockQuantity });

        // Allow overriding movement type if provided, otherwise stick to defaults
        if (data.movement_type) {
            movementType = data.movement_type;
        }

        // Record the stock movement
        await StockMovement.create({
            product_id: id,
            movement_type: movementType,
            quantity: movementQuantity,
            reference_type: 'manual_adjustment',
            reference_id: null,
            notes: notes || `Stock ${operation} operation`,
            created_by: userId,
            created_at: data.date ? new Date(data.date) : new Date()
        });

        return this._transformProduct(updated);
    }

    async getStockMovements(productId, page = 1, limit = 10) {
        const product = await ProductRepository.findById(productId);
        if (!product) {
            throw new Error('Product not found');
        }

        const StockMovement = require('./stock-movement.model');
        const offset = (page - 1) * limit;

        const result = await StockMovement.findAndCountAll({
            where: { product_id: productId },
            limit,
            offset,
            order: [['created_at', 'DESC']]
        });

        return {
            product: {
                id: product.id,
                name: product.name,
                sku: product.sku,
                current_stock: product.stock_quantity
            },
            movements: result.rows.map(row => ({
                ...row.toJSON(),
                date: row.created_at
            })),
            total: result.count
        };
    }

    async getStockManagement() {
        const allProducts = await ProductRepository.findAll({ is_active: true }, 1000, 0);
        const lowStockProducts = await ProductRepository.getLowStockProducts();

        const totalValue = allProducts.rows.reduce((sum, product) => {
            return sum + (parseFloat(product.price) * product.stock_quantity);
        }, 0);

        return {
            total_products: allProducts.count,
            low_stock_count: lowStockProducts.length,
            total_stock_value: totalValue.toFixed(2),
            low_stock_products: lowStockProducts
        };
    }

    // Product Image methods
    async getProductImages(productId) {
        return await ProductImageRepository.findByProductId(productId);
    }

    async addProductImage(productId, imageData) {
        // Verify product exists
        const product = await ProductRepository.findById(productId);
        if (!product) {
            throw new Error('Product not found');
        }

        return await ProductImageRepository.create({
            product_id: productId,
            ...imageData
        });
    }

    async addMultipleProductImages(productId, images) {
        // Verify product exists
        const product = await ProductRepository.findById(productId);
        if (!product) {
            throw new Error('Product not found');
        }

        const imageData = images.map((img, index) => ({
            product_id: productId,
            image_url: img.image_url,
            is_primary: img.is_primary || false,
            sort_order: img.sort_order || index,
            caption: img.caption || null
        }));

        return await ProductImageRepository.createMultiple(imageData);
    }

    async updateProductImage(imageId, data) {
        const image = await ProductImageRepository.update(imageId, data);
        if (!image) {
            throw new Error('Product image not found');
        }
        return image;
    }

    async deleteProductImage(imageId) {
        const image = await ProductImageRepository.delete(imageId);
        if (!image) {
            throw new Error('Product image not found');
        }
        return image;
    }

    async setPrimaryProductImage(productId, imageId) {
        const image = await ProductImageRepository.setPrimaryImage(productId, imageId);
        if (!image) {
            throw new Error('Product image not found or does not belong to this product');
        }
        return image;
    }

    // Category methods
    async getAllCategories(search, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const filters = { search };
        const result = await CategoryRepository.findAll(filters, limit, offset);
        return {
            data: result.rows,
            total: result.count
        };
    }

    async getCategoriesWithProducts(filters = {}) {
        const categoriesWithProducts = await CategoryRepository.findWithProducts(filters);

        // Transform each category's products
        return categoriesWithProducts.map(category => ({
            id: category.id,
            name: category.name,
            description: category.description,
            parent_id: category.parent_id,
            is_active: category.is_active,
            created_at: category.created_at,
            updated_at: category.updated_at,
            products: category.products.map(product => this._transformProduct(product))
        }));
    }

    async getCategoryById(id) {
        const category = await CategoryRepository.findById(id);
        if (!category) {
            throw new Error('Category not found');
        }
        return category;
    }

    async createCategory(data, userId) {
        return await CategoryRepository.create({ ...data, created_by: userId });
    }

    async updateCategory(id, data) {
        const category = await CategoryRepository.update(id, data);
        if (!category) {
            throw new Error('Category not found');
        }
        return category;
    }

    async deleteCategory(id) {
        const category = await CategoryRepository.delete(id);
        if (!category) {
            throw new Error('Category not found');
        }
        return category;
    }

    async reorderCategories(order) {
        if (!Array.isArray(order)) {
            throw new Error('Order must be an array of category IDs');
        }
        await CategoryRepository.reorder(order);
        // Return updated categories sorted by new order
        const result = await CategoryRepository.findAll({}, 1000, 0);
        return result.rows;
    }

    async resetCategoriesOrder() {
        await CategoryRepository.resetOrder();
        // Return categories after reset (sorted alphabetically by name)
        const result = await CategoryRepository.findAll({}, 1000, 0);
        return result.rows;
    }

    // Unit methods
    async getAllUnits(filters = {}, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const result = await UnitRepository.findAll(filters, limit, offset);
        return {
            data: result.rows,
            total: result.count
        };
    }

    async getUnitById(id) {
        const unit = await UnitRepository.findById(id);
        if (!unit) {
            throw new Error('Unit not found');
        }
        return unit;
    }

    async createUnit(data, userId) {
        return await UnitRepository.create({ ...data, created_by: userId });
    }

    async updateUnit(id, data) {
        const unit = await UnitRepository.update(id, data);
        if (!unit) {
            throw new Error('Unit not found');
        }
        return unit;
    }

    async deleteUnit(id) {
        const unit = await UnitRepository.delete(id);
        if (!unit) {
            throw new Error('Unit not found');
        }
        return unit;
    }

    async getStockDetails() {
        return await ProductRepository.getStockDetails();
    }

    async getProductStats() {
        const stats = await ProductRepository.getStats();

        // Format to match user request for stock and general stats
        return [
            {
                label: "Total Products",
                value: stats.totalProducts,
                color: "bg-blue-600"
            },
            {
                label: "Low Stocks",
                value: stats.lowStockProducts,
                color: "bg-orange-500"
            },
            {
                label: "Out of Stocks",
                value: stats.outOfStockProducts,
                color: "bg-red-600"
            },
            {
                label: "Total Purchase Amount",
                value: stats.totalCost,
                isCurrency: true
            },
            {
                label: "Total Salable Amount",
                value: stats.totalPrice,
                isCurrency: true
            },
            {
                label: "Total Profitable Amount",
                value: stats.totalProfit,
                isCurrency: true
            }
        ];
    }

    async getProductOrders(productId, filters = {}, page = 1, limit = 10) {
        // Verify product exists
        const product = await ProductRepository.findById(productId);
        if (!product) {
            throw new Error('Product not found');
        }

        const offset = (page - 1) * limit;
        const result = await ProductRepository.getProductOrders(productId, filters, limit, offset);

        return {
            data: result.rows,
            total: result.count
        };
    }

    // Product expiry tracking methods
    async getProductsExpiringSoon(months = 6) {
        const products = await ProductRepository.getProductsExpiringSoon(months);

        // Calculate days until expiry for each product
        const productsWithDaysLeft = products.map(product => {
            const productData = product.toJSON ? product.toJSON() : product;
            const today = new Date();
            const expiryDate = new Date(productData.expiry_date);
            const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

            return {
                ...this._transformProduct(productData),
                days_until_expiry: daysUntilExpiry,
                expiry_status: this._getExpiryStatus(daysUntilExpiry)
            };
        });

        return productsWithDaysLeft;
    }

    async getProductsExpiringInPeriod(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        const products = await ProductRepository.getProductsExpiringInPeriod(start, end);

        // Calculate days until expiry for each product
        const productsWithDaysLeft = products.map(product => {
            const productData = product.toJSON ? product.toJSON() : product;
            const today = new Date();
            const expiryDate = new Date(productData.expiry_date);
            const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

            return {
                ...this._transformProduct(productData),
                days_until_expiry: daysUntilExpiry,
                expiry_status: this._getExpiryStatus(daysUntilExpiry)
            };
        });

        return productsWithDaysLeft;
    }

    async getExpiredProducts() {
        const products = await ProductRepository.getExpiredProducts();

        // Calculate days expired for each product
        const productsWithDaysExpired = products.map(product => {
            const productData = product.toJSON ? product.toJSON() : product;
            const today = new Date();
            const expiryDate = new Date(productData.expiry_date);
            const daysExpired = Math.floor((today - expiryDate) / (1000 * 60 * 60 * 24));

            return {
                ...this._transformProduct(productData),
                days_expired: daysExpired,
                expiry_status: 'expired'
            };
        });

        return productsWithDaysExpired;
    }

    async getExpiringProductsStats() {
        const stats = await ProductRepository.getExpiringProductsStats();

        return [
            {
                label: "Expiring Within 6 Months",
                value: stats.expiringIn6Months,
                color: "bg-yellow-500"
            },
            {
                label: "Expiring Within 3 Months",
                value: stats.expiringIn3Months,
                color: "bg-orange-500"
            },
            {
                label: "Expiring Within 1 Month",
                value: stats.expiringIn1Month,
                color: "bg-red-500"
            },
            {
                label: "Already Expired",
                value: stats.expiredProducts,
                color: "bg-gray-700"
            }
        ];
    }

    async createExpiryNotification(productId, userId = null) {
        const product = await ProductRepository.findById(productId);
        if (!product || !product.expiry_date) {
            throw new Error('Product not found or has no expiry date');
        }

        const today = new Date();
        const expiryDate = new Date(product.expiry_date);
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry <= 0) {
            throw new Error('Product has already expired');
        }

        const { NotificationService } = require('../notifications/notifications.service');
        const monthsUntilExpiry = Math.floor(daysUntilExpiry / 30);

        let priority = 'low';
        let title = 'Product Expiry Notice';

        if (daysUntilExpiry <= 30) {
            priority = 'urgent';
            title = 'URGENT: Product Expiring Within 1 Month';
        } else if (daysUntilExpiry <= 90) {
            priority = 'high';
            title = 'Product Expiring Within 3 Months';
        } else if (daysUntilExpiry <= 180) {
            priority = 'medium';
            title = 'Product Expiring Within 6 Months';
        }

        const message = `Product "${product.name}" (SKU: ${product.sku}) will expire in ${daysUntilExpiry} days on ${product.expiry_date.toLocaleDateString()}. Current stock: ${product.stock_quantity} ${product.unit?.symbol || ''}`;

        await NotificationService.createNotification({
            user_id: userId,
            type: 'stock',
            title,
            message,
            link: `/products/${product.id}`,
            reference_type: 'product',
            reference_id: product.id,
            priority
        });

        return {
            success: true,
            message: 'Expiry notification created successfully',
            notification: {
                title,
                message,
                priority,
                days_until_expiry: daysUntilExpiry
            }
        };
    }

    async createBulkExpiryNotifications(months = 6, userId = null) {
        const products = await ProductRepository.getProductsExpiringSoon(months);

        if (!products || products.length === 0) {
            return {
                success: true,
                message: 'No products expiring soon',
                notifications_created: 0
            };
        }

        const notificationPromises = products.map(product =>
            this.createExpiryNotification(product.id, userId).catch(err => {
                console.error(`Failed to create notification for product ${product.id}:`, err);
                return null;
            })
        );

        const results = await Promise.all(notificationPromises);
        const successfulNotifications = results.filter(r => r !== null);

        return {
            success: true,
            message: `Created ${successfulNotifications.length} expiry notifications`,
            notifications_created: successfulNotifications.length,
            products: products.map(p => ({
                id: p.id,
                name: p.name,
                expiry_date: p.expiry_date
            }))
        };
    }


 // Get out of stock products
    async getOutOfStockProducts(filters = {}, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const result = await ProductRepository.findAll({
            ...filters,
            stock_status: 'out_of_stock'
        }, limit, offset);

        // Transform each product
        const transformedData = result.rows.map(product => this._transformProduct(product));

        return {
            data: transformedData,
            total: result.count
        };
    }

    // Get active products with stock (stock_quantity > 0)
    async getActiveProductsWithStock(filters = {}, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const result = await ProductRepository.findAll({
            ...filters,
            is_active: true,
            stock_status: 'available'
        }, limit, offset);

        // Transform each product
        const transformedData = result.rows.map(product => this._transformProduct(product));

        return {
            data: transformedData,
            total: result.count
        };
    }






    // Helper method to determine expiry status
    _getExpiryStatus(daysUntilExpiry) {
        if (daysUntilExpiry <= 0) return 'expired';
        if (daysUntilExpiry <= 30) return 'critical';
        if (daysUntilExpiry <= 90) return 'warning';
        if (daysUntilExpiry <= 180) return 'notice';
        return 'ok';
    }
}

module.exports = new ProductService();
