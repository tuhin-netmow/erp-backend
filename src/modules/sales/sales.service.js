const { OrderRepository, InvoiceRepository, WarehouseRepository, PaymentRepository, DeliveryRepository, OrderStatusHistoryRepository, SalesRouteRepository, DeletedHistoryRepository } = require('./sales.repository');
const AccountingService = require('../accounting/accounting.service');
const NotificationService = require('../notifications/notifications.service');


class SalesService {
    // Orders
    async getAllOrders(filters = {}, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const result = await OrderRepository.findAll(filters, limit, offset);

        // Transform deliveries array to single delivery object
        const transformedRows = result.rows.map(order => {
            const orderData = order.toJSON();
            // Convert deliveries array to single delivery object (latest one)
            orderData.delivery = orderData.deliveries && orderData.deliveries.length > 0
                ? orderData.deliveries[0]
                : null;

            // Add delivery_status field
            orderData.delivery_status = orderData.delivery ? orderData.delivery.status : null;

            delete orderData.deliveries;

            // Calculate Payment Totals
            const payments = orderData.payments || [];
            const grossPaid = payments.reduce((sum, p) => {
                const amt = parseFloat(p.amount);
                return amt > 0 ? sum + amt : sum;
            }, 0);
            const refunded = payments.reduce((sum, p) => {
                const amt = parseFloat(p.amount);
                return amt < 0 ? sum + Math.abs(amt) : sum;
            }, 0);
            const netPaid = grossPaid - refunded;

            orderData.gross_paid_amount = grossPaid;
            orderData.refunded_amount = refunded;
            orderData.total_paid_amount = netPaid;
            orderData.total_payable_amount = parseFloat(orderData.total_amount) - parseFloat(orderData.discount_amount || 0) + parseFloat(orderData.tax_amount || 0);

            return orderData;
        });

        return {
            data: transformedRows,
            total: result.count
        };
    }

    // Get multiple orders with items
    async getOrdersItems(orderIds) {
        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            throw new Error('Invalid or empty order IDs list');
        }
        return await OrderRepository.findOrdersWithItems(orderIds);
    }

    async getOrdersBySalesRoute(filters = {}, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const result = await SalesRouteRepository.findAllWithOrders(filters, limit, offset);

        // Transform: SalesRoute -> Customers -> Orders  ===>  SalesRoute -> Orders
        const transformedRows = result.rows.map(route => {

            const routeData = route.toJSON();


            const allOrders = [];
            if (routeData.customers) {
                routeData.customers.forEach(customer => {
                    if (customer.orders) {
                        customer.orders.forEach(order => {
                            allOrders.push({
                                id: order.id,
                                order_number: order.order_number,
                                customer: customer.name || customer.company,
                                customer_image: customer.image_url || null,
                                amount: parseFloat(order.total_amount),
                                status: order.status, // e.g., 'pending', 'delivered'
                                date: order.order_date ? new Date(order.order_date).toISOString().split('T')[0] : null // Format date YYYY-MM-DD
                            });
                        });
                    }
                });
            }

            // Sort orders by date/id descending
            allOrders.sort((a, b) => b.id - a.id);

            return {
                id: routeData.id,
                name: routeData.route_name,
                country: routeData.country || '',
                orders: allOrders
            };
        });

        return {
            data: transformedRows,
            total: result.count
        };
    }

    async getOrderById(id) {
        const order = await OrderRepository.findById(id);
        if (!order) {
            throw new Error('Order not found');
        }

        const orderData = order.toJSON();

        // Add delivery_status from the latest delivery
        if (orderData.deliveries && orderData.deliveries.length > 0) {
            orderData.delivery_status = orderData.deliveries[0].status;
        } else {
            orderData.delivery_status = null;
        }

        // Calculate totals
        orderData.total_invoice_amount = orderData.invoice ? parseFloat(orderData.invoice.total_amount) : 0;

        // Total Discount
        // discount_amount in DB is the sum of item discounts (populated in createOrder)
        // So we strictly use the DB value, or recalculate from items. Let's use DB value.
        orderData.total_discount = parseFloat(orderData.discount_amount) || 0;

        // Net Amount (after discount, before tax)
        // = total_amount - discount_amount OR sum of line_total
        const itemsLineTotal = orderData.items ? orderData.items.reduce((sum, item) => sum + (parseFloat(item.line_total) || 0), 0) : 0;
        orderData.net_amount = itemsLineTotal;

        // Total Payable Amount
        // This is the actual amount customer needs to pay
        // = Sum of line_total (after discount) + tax
        const tax = parseFloat(orderData.tax_amount) || 0;

        orderData.total_payable_amount = itemsLineTotal + tax;

        // Total Paid Amount (Net)
        const payments = orderData.payments || [];

        const grossPaid = payments.reduce((sum, p) => {
            const amt = parseFloat(p.amount);
            return amt > 0 ? sum + amt : sum;
        }, 0);

        const refunded = payments.reduce((sum, p) => {
            const amt = parseFloat(p.amount);
            return amt < 0 ? sum + Math.abs(amt) : sum;
        }, 0);

        orderData.total_paid_amount = grossPaid - refunded;
        orderData.gross_paid_amount = grossPaid;
        orderData.refunded_amount = refunded;

        return orderData;
    }

    async createOrder(data, userId) {
        let { items, sales_tax_percent, ...orderInfo } = data;

        // Generate a unique order number using prefix settings
        let order_number = data.order_number;
        if (!order_number) {
            try {
                const { generateNumber } = require('../settings/numbering.helper');
                order_number = await generateNumber('order');
            } catch (err) {
                console.error('Error generating order number:', err);
                order_number = `ORD-${Date.now()}`;
            }
        }

        // Calculate total amount, discount amount, and tax amount
        let total_amount = 0;
        let discount_amount = 0;
        let item_level_tax = 0; // Tax from individual products

        if (items && Array.isArray(items)) {
            const { ProductRepository } = require('../products/products.repository');

            // Use Promise.all to handle async product fetching
            items = await Promise.all(items.map(async (item) => {
                const quantity = Number(item.quantity) || 0;
                const unit_price = Number(item.unit_price) || 0;
                const discount = Number(item.discount) || 0;

                // Fetch product to get default sales_tax
                const product = await ProductRepository.findById(item.product_id);
                // Use provide tax rate from frontend (e.g. POS) or fallback to product's default
                const sales_tax_rate = item.sales_tax !== undefined ? Number(item.sales_tax) : (product && product.sales_tax ? Number(product.sales_tax) : 0);

                const total_price = quantity * unit_price; // Before discount
                const line_total = total_price - discount; // After discount

                // Calculate item tax (from product's sales_tax) on line_total
                const item_tax_amount = (line_total * sales_tax_rate) / 100;

                discount_amount += discount;
                total_amount += total_price; // Sum of total_price (before discount)
                item_level_tax += item_tax_amount;

                return {
                    ...item,
                    tax_amount: item_tax_amount,
                    sales_tax_percent: sales_tax_rate,  // Store the tax percentage
                    purchase_cost: product ? product.cost : 0 // Lock in the cost at time of sale
                };
            }));
        }

        // Calculate order-level tax if sales_tax_percent is provided
        let order_level_tax = 0;
        const tax_percent = sales_tax_percent ? Number(sales_tax_percent) : 0;

        if (tax_percent > 0) {
            // Apply order-level tax on total_amount (after item discounts)
            order_level_tax = (total_amount * tax_percent) / 100;
        }

        // Total tax is sum of item-level tax and order-level tax
        const tax_amount = item_level_tax + order_level_tax;

        const orderData = {
            ...orderInfo,
            order_number,
            total_amount,
            discount_amount,
            tax_amount,
            sales_tax_percent: tax_percent,
            status: 'pending', // Force status to pending (dummy order)
            created_by: userId
        };

        const order = await OrderRepository.create(orderData, items || []);

        // Record initial status in history
        await OrderStatusHistoryRepository.create({
            order_id: order.id,
            status: order.status || 'pending',
            changed_by: userId,
            notes: 'Initial order creation'
        });

        // Deduct stock and record movements for each item
        const StockMovement = require('../products/stock-movement.model');
        const { ProductRepository: ProductRepo } = require('../products/products.repository');

        if (items && Array.isArray(items)) {
            for (const item of items) {
                // Get current product stock
                const product = await ProductRepo.findById(item.product_id);
                if (!product) {
                    throw new Error(`Product with ID ${item.product_id} not found`);
                }

                // Check if sufficient stock
                if (product.stock_quantity < item.quantity) {
                    throw new Error(`Insufficient stock for product ${product.name}. Available: ${product.stock_quantity}, Required: ${item.quantity}`);
                }

                // Deduct stock
                const newStock = product.stock_quantity - item.quantity;
                await ProductRepo.update(item.product_id, { stock_quantity: newStock });

                // Record stock movement
                await StockMovement.create({
                    product_id: item.product_id,
                    movement_type: 'sale',
                    quantity: -item.quantity, // Negative for stock out
                    reference_type: 'order',
                    reference_id: order.id,
                    notes: `Stock deducted for order ${order_number}`,
                    created_by: userId
                });

                // Check if stock is low after deduction and create notification
                if (newStock <= product.min_stock_level) {
                    try {
                        await NotificationService.createLowStockNotification({
                            ...product.toJSON(),
                            stock_quantity: newStock
                        });
                    } catch (notifError) {
                        console.error('Failed to create low stock notification:', notifError);
                    }
                }
            }
        }

        // Create notification for new order
        try {
            await NotificationService.createOrderNotification({
                id: order.id,
                order_number: order.order_number,
                customer: order.customer
            }, 'new');
        } catch (notifError) {
            console.error('Failed to create order notification:', notifError);
        }

        return order;
    }

    async updateOrder(id, data, userId) {
        const oldOrder = await OrderRepository.findById(id);

        // Ensure oldOrder exists before proceeding
        if (!oldOrder) {
            throw new Error('Order not found');
        }

        // Handle items if provided in the update payload
        if (data.items && Array.isArray(data.items)) {
            const currentItems = oldOrder.items || [];

            // 1. Find items to delete
            const incomingIds = data.items.map(item => item.id).filter(Boolean);
            const itemsToDelete = currentItems.filter(item => !incomingIds.includes(item.id));

            for (const item of itemsToDelete) {
                await this.deleteOrderItem(id, item.id, userId);
            }

            // 2. Find items to update or add
            for (const item of data.items) {
                if (item.id) {
                    // Update existing item
                    await this.updateOrderItem(id, item.id, item, userId);
                } else {
                    // Add new item
                    await this.addOrderItem(id, item, userId);
                }
            }
        }

        const order = await OrderRepository.update(id, data);

        if (data.status && oldOrder.status !== data.status) {
            await OrderStatusHistoryRepository.create({
                order_id: id,
                status: data.status,
                changed_by: userId,
                notes: 'Order status updated via general update'
            });
        }
        return order;
    }

    async updateOrderItem(orderId, itemId, itemData, userId) {
        const { OrderItem } = require('./sales.models');
        const StockMovement = require('../products/stock-movement.model');
        const { ProductRepository: ProductRepo } = require('../products/products.repository');

        // Find the order and item
        const order = await OrderRepository.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        if (order.status !== 'pending') {
            throw new Error('Only pending orders can be edited');
        }

        const item = await OrderItem.findOne({ where: { id: itemId, order_id: orderId } });
        if (!item) {
            throw new Error('Order item not found');
        }

        // Store old quantity for stock calculation
        const oldQuantity = item.quantity;

        // Update the item
        const quantity = Number(itemData.quantity) || item.quantity;
        const unit_price = Number(itemData.unit_price) || item.unit_price;
        const discount = Number(itemData.discount) || 0;
        const sales_tax = Number(itemData.sales_tax) || 0;
        const remark = itemData.remark || '';

        // Calculate quantity difference
        const quantityDifference = quantity - oldQuantity;

        // Handle stock movement if quantity changed
        if (quantityDifference !== 0) {
            const product = await ProductRepo.findById(item.product_id);
            if (!product) {
                throw new Error(`Product with ID ${item.product_id} not found`);
            }

            // Calculate new stock level
            const newStock = product.stock_quantity - quantityDifference;

            // Validate stock availability (only when increasing quantity)
            if (quantityDifference > 0 && newStock < 0) {
                throw new Error(
                    `Insufficient stock for product ${product.name}. ` +
                    `Current: ${product.stock_quantity}, Required increase: ${quantityDifference}`
                );
            }

            // Update product stock
            await ProductRepo.update(item.product_id, { stock_quantity: newStock });

            // Create stock movement record
            const movementType = quantityDifference > 0 ? 'sale' : 'return';
            const movementQuantity = quantityDifference > 0 ? -quantityDifference : Math.abs(quantityDifference);
            const movementNotes = quantityDifference > 0
                ? `Stock adjusted for order ${order.order_number} (quantity increased from ${oldQuantity} to ${quantity})`
                : `Stock restored for order ${order.order_number} (quantity decreased from ${oldQuantity} to ${quantity})`;

            await StockMovement.create({
                product_id: item.product_id,
                movement_type: movementType,
                quantity: movementQuantity,
                reference_type: 'order',
                reference_id: order.id,
                notes: movementNotes,
                created_by: userId
            });
        }

        // Calculate new line total
        const total_price = quantity * unit_price;
        const taxable_amount = total_price - discount;
        const tax_amount = taxable_amount * (sales_tax / 100);
        const line_total = taxable_amount + tax_amount;

        // Update the item
        await item.update({
            quantity,
            unit_price: unit_price.toString(),
            discount,
            sales_tax,
            sales_tax_percent: sales_tax,
            tax_amount: tax_amount.toString(),
            line_total,
            total_price: total_price.toString(),
            remark
        });

        // Recalculate order totals
        const allItems = await OrderItem.findAll({ where: { order_id: orderId } });

        let new_total_amount = 0;
        let new_discount_amount = 0;
        let new_tax_amount = 0;

        allItems.forEach(item => {
            const itemTotal = Number(item.total_price) || 0;
            const itemDiscount = Number(item.discount) || 0;
            const itemTax = Number(item.tax_amount) || 0;

            new_total_amount += itemTotal;
            new_discount_amount += itemDiscount;
            new_tax_amount += itemTax;
        });

        // Update order totals
        await order.update({
            total_amount: new_total_amount.toString(),
            discount_amount: new_discount_amount.toString(),
            tax_amount: new_tax_amount.toString()
        });

        // Fetch and return the updated item with product details
        const { ProductRepository } = require('../products/products.repository');
        const product = await ProductRepository.findById(item.product_id);

        const updatedItem = await OrderItem.findOne({
            where: { id: itemId },
            include: [
                {
                    model: require('../products/products.model').Product,
                    as: 'product',
                    attributes: ['id', 'name', 'sku', 'price', 'image_url', 'specification', 'stock_quantity'],
                    include: [
                        {
                            model: require('../products/products.model').Unit,
                            as: 'unit',
                            attributes: ['id', 'name', 'symbol']
                        }
                    ]
                }
            ]
        });

        return updatedItem;
    }

    async deleteOrderItem(orderId, itemId, userId) {
        const { OrderItem } = require('./sales.models');
        const StockMovement = require('../products/stock-movement.model');
        const { ProductRepository: ProductRepo } = require('../products/products.repository');

        // Find the order
        const order = await OrderRepository.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        if (order.status !== 'pending') {
            throw new Error('Only pending orders can have items removed');
        }

        // Find the item
        const item = await OrderItem.findOne({ where: { id: itemId, order_id: orderId } });
        if (!item) {
            throw new Error('Order item not found');
        }

        // Store item details for stock restoration
        const itemQuantity = item.quantity;
        const itemProductId = item.product_id;

        // Restore stock - add back the quantity
        const product = await ProductRepo.findById(itemProductId);
        if (product) {
            const newStock = product.stock_quantity + itemQuantity;
            await ProductRepo.update(itemProductId, { stock_quantity: newStock });

            // Create stock movement record for stock restoration
            await StockMovement.create({
                product_id: itemProductId,
                movement_type: 'return',
                quantity: itemQuantity, // Positive for stock in
                reference_type: 'order',
                reference_id: order.id,
                notes: `Stock restored due to item deletion from order ${order.order_number}`,
                created_by: userId
            });
        }

        // Delete the item
        await item.destroy();

        // Recalculate order totals
        const allItems = await OrderItem.findAll({ where: { order_id: orderId } });

        let new_total_amount = 0;
        let new_discount_amount = 0;
        let new_tax_amount = 0;

        allItems.forEach(item => {
            const itemTotal = Number(item.total_price) || 0;
            const itemDiscount = Number(item.discount) || 0;
            const itemTax = Number(item.tax_amount) || 0;

            new_total_amount += itemTotal;
            new_discount_amount += itemDiscount;
            new_tax_amount += itemTax;
        });

        // Update order totals
        await order.update({
            total_amount: new_total_amount.toString(),
            discount_amount: new_discount_amount.toString(),
            tax_amount: new_tax_amount.toString()
        });

        return {
            success: true,
            message: 'Order item deleted successfully',
            data: {
                itemId: itemId,
                quantity: itemQuantity,
                stockRestored: itemQuantity
            }
        };
    }

    async addOrderItem(orderId, itemData, userId) {
        const { OrderItem } = require('./sales.models');
        const StockMovement = require('../products/stock-movement.model');
        const { ProductRepository: ProductRepo } = require('../products/products.repository');

        // Find the order
        const order = await OrderRepository.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        if (order.status !== 'pending') {
            throw new Error('Only pending orders can have items added');
        }

        // Validate product exists
        const product = await ProductRepo.findById(itemData.product_id);
        if (!product) {
            throw new Error(`Product with ID ${itemData.product_id} not found`);
        }

        // Check stock availability
        const quantity = Number(itemData.quantity) || 1;
        if (product.stock_quantity < quantity) {
            throw new Error(
                `Insufficient stock for product ${product.name}. ` +
                `Available: ${product.stock_quantity}, Required: ${quantity}`
            );
        }

        // Calculate item values
        const unit_price = Number(itemData.unit_price) || Number(product.price) || 0;
        const discount = Number(itemData.discount) || 0;
        const sales_tax = Number(itemData.sales_tax) || 0;
        const remark = itemData.remark || '';

        const total_price = quantity * unit_price;
        const taxable_amount = total_price - discount;
        const tax_amount = taxable_amount * (sales_tax / 100);
        const line_total = taxable_amount + tax_amount;

        // Create the order item
        const newItem = await OrderItem.create({
            order_id: orderId,
            product_id: itemData.product_id,
            quantity,
            unit_price: unit_price.toString(),
            discount,
            sales_tax,
            sales_tax_percent: sales_tax,
            tax_amount: tax_amount.toString(),
            line_total,
            total_price: total_price.toString(),
            remark
        });

        // Deduct stock
        const newStock = product.stock_quantity - quantity;
        await ProductRepo.update(itemData.product_id, { stock_quantity: newStock });

        // Create stock movement record
        await StockMovement.create({
            product_id: itemData.product_id,
            movement_type: 'sale',
            quantity: -quantity,
            reference_type: 'order',
            reference_id: order.id,
            notes: `Stock deducted for order ${order.order_number}`,
            created_by: userId
        });

        // Recalculate order totals
        const allItems = await OrderItem.findAll({ where: { order_id: orderId } });

        let new_total_amount = 0;
        let new_discount_amount = 0;
        let new_tax_amount = 0;

        allItems.forEach(item => {
            const itemTotal = Number(item.total_price) || 0;
            const itemDiscount = Number(item.discount) || 0;
            const itemTax = Number(item.tax_amount) || 0;

            new_total_amount += itemTotal;
            new_discount_amount += itemDiscount;
            new_tax_amount += itemTax;
        });

        // Update order totals
        await order.update({
            total_amount: new_total_amount.toString(),
            discount_amount: new_discount_amount.toString(),
            tax_amount: new_tax_amount.toString()
        });

        // Fetch and return the new item with product details
        const createdItem = await OrderItem.findOne({
            where: { id: newItem.id },
            include: [
                {
                    model: require('../products/products.model').Product,
                    as: 'product',
                    attributes: ['id', 'name', 'sku', 'price', 'image_url', 'specification', 'stock_quantity'],
                    include: [
                        {
                            model: require('../products/products.model').Unit,
                            as: 'unit',
                            attributes: ['id', 'name', 'symbol']
                        }
                    ]
                }
            ]
        });

        return createdItem;
    }

    async deleteOrder(id) {
        const order = await OrderRepository.delete(id);
        if (!order) {
            throw new Error('Order not found');
        }
        return order;
    }

    async previewBulkDeleteOrders(orderIds) {
        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            throw new Error('No order IDs provided');
        }

        const summary = {
            ordersCount: 0,
            itemsCount: 0,
            invoicesCount: 0,
            paymentsCount: 0,
            deliveriesCount: 0,
            statusHistoryCount: 0,
            staffAssignmentsCount: 0,
            stockToRestore: []
        };

        const details = [];

        for (const id of orderIds) {
            const order = await OrderRepository.findById(id);
            if (!order) continue;

            summary.ordersCount += 1;

            const orderData = order.toJSON();
            const customerName = order.customer ? (order.customer.company || order.customer.name) : '-';

            details.push({
                id: order.id,
                order_number: order.order_number,
                customer_name: customerName,
                status: order.status,
                total_amount: parseFloat(order.total_amount)
            });

            if (order.items) {
                summary.itemsCount += order.items.length;

                // Preview stock restoration (only if non-terminal status)
                if (!['returned', 'failed', 'cancelled'].includes(order.status)) {
                    order.items.forEach(item => {
                        const product = item.product;
                        if (product) {
                            summary.stockToRestore.push({
                                order_number: order.order_number,
                                product_name: product.name,
                                sku: product.sku,
                                quantity: parseFloat(item.quantity)
                            });
                        }
                    });
                }
            }

            if (order.invoice) {
                summary.invoicesCount += 1;
            }

            if (order.payments) {
                summary.paymentsCount += order.payments.length;
            }

            if (order.deliveries) {
                summary.deliveriesCount += order.deliveries.length;
            }

            if (order.status_history) {
                summary.statusHistoryCount += order.status_history.length;
            }

            if (order.assignedStaff) {
                summary.staffAssignmentsCount += order.assignedStaff.length;
            }
        }

        return { details, summary };
    }

    async bulkDeleteOrders(orderIds, userId) {
        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            throw new Error('No order IDs provided');
        }

        const { OrderStaff, OrderStatusHistory, Delivery, Payment, Invoice, OrderItem, Order } = require('./sales.models');
        const { Product } = require('../products/products.model');
        const { Op } = require('sequelize');
        const StockMovement = require('../products/stock-movement.model');
        const { sequelize } = require('../../core/database/sequelize');

        const transaction = await sequelize.transaction();
        let deletedCount = 0;

        try {
            for (const id of orderIds) {
                const order = await OrderRepository.findById(id);
                if (!order) continue;

                const orderJson = order.toJSON();

                // 1. Back up order & related details to DeletedHistory
                await DeletedHistoryRepository.create({
                    record_type: 'Order',
                    record_id: order.id,
                    identifier: order.order_number,
                    data: orderJson,
                    deleted_by: userId
                }, transaction);

                // 2. Restore stock if the order status is non-terminal
                if (!['returned', 'failed', 'cancelled'].includes(order.status)) {
                    if (order.items && order.items.length > 0) {
                        for (const item of order.items) {
                            const product = await Product.findByPk(item.product_id, { transaction });
                            if (product) {
                                const newStock = parseFloat(product.stock_quantity || 0) + parseFloat(item.quantity);
                                await product.update({ stock_quantity: newStock }, { transaction });

                                // Log stock restoration movement
                                await StockMovement.create({
                                    product_id: item.product_id,
                                    movement_type: 'return',
                                    quantity: parseFloat(item.quantity),
                                    reference_type: 'order',
                                    reference_id: order.id,
                                    notes: `Stock restored due to bulk order deletion (Order ${order.order_number})`,
                                    created_by: userId
                                }, { transaction });
                            }
                        }
                    }
                }

                // 3. Delete old stock movements associated with the order (except our new return movements above)
                await StockMovement.destroy({
                    where: {
                        reference_type: 'order',
                        reference_id: order.id,
                        notes: {
                            [Op.notLike]: '%Stock restored due to bulk order deletion%'
                        }
                    },
                    transaction
                });

                // 4. Cascade delete all related rows inside sales models
                await OrderStaff.destroy({ where: { order_id: order.id }, transaction });
                await OrderStatusHistory.destroy({ where: { order_id: order.id }, transaction });
                await Delivery.destroy({ where: { order_id: order.id }, transaction });
                await Payment.destroy({ where: { order_id: order.id }, transaction });
                await Invoice.destroy({ where: { order_id: order.id }, transaction });
                await OrderItem.destroy({ where: { order_id: order.id }, transaction });
                await Order.destroy({ where: { id: order.id }, transaction });

                deletedCount += 1;
            }

            await transaction.commit();
            return { success: true, count: deletedCount };
        } catch (error) {
            if (!transaction.finished) {
                await transaction.rollback();
            }
            throw error;
        }
    }

    async reviewOrder(id, action, userId) {
        // action: 'approve' | 'reject' (or 'cancel')
        const order = await OrderRepository.findById(id);
        if (!order) {
            throw new Error('Order not found');
        }

        if (action === 'approve') {
            // Only pending orders can be approved
            if (order.status !== 'pending') {
                throw new Error('Only pending orders can be approved');
            }
            const updated = await OrderRepository.update(id, { status: 'confirmed' });
            await OrderStatusHistoryRepository.create({
                order_id: id,
                status: 'confirmed',
                changed_by: userId,
                notes: 'Order approved during review'
            });
            return updated;
        } else if (action === 'reject' || action === 'cancel') {
            const status = action === 'reject' ? 'failed' : 'cancelled';

            // Only handle if not already in a terminal state
            if (!['cancelled', 'returned', 'failed'].includes(order.status)) {
                await this._handleOrderStatusChange(order, status, userId);
            }

            const updated = await OrderRepository.update(id, { status });
            await OrderStatusHistoryRepository.create({
                order_id: id,
                status: status,
                changed_by: userId,
                notes: `Order ${action === 'reject' ? 'rejected' : 'cancelled'} during review`
            });
            return updated;
        } else {
            throw new Error('Invalid action');
        }
    }

    /**
     * Helper to handle stock restoration and accounting reversal when an order is returned, cancelled or failed
     */
    async _handleOrderStatusChange(order, newStatus, userId) {
        if (!['returned', 'failed', 'cancelled'].includes(newStatus)) return;

        // 1. Restore stock
        const { ProductRepository: ProductRepo } = require('../products/products.repository');
        const StockMovement = require('../products/stock-movement.model');

        if (order.items && order.items.length > 0) {
            for (const item of order.items) {
                const product = await ProductRepo.findById(item.product_id);
                if (product) {
                    const newStock = product.stock_quantity + item.quantity;
                    await ProductRepo.update(item.product_id, { stock_quantity: newStock });

                    // Log movement
                    await StockMovement.create({
                        product_id: item.product_id,
                        movement_type: 'return',
                        quantity: item.quantity,
                        reference_type: 'order',
                        reference_id: order.id,
                        notes: `Stock restored due to order status change to ${newStatus}`,
                        created_by: userId
                    });
                }
            }
        }

        // 2. Accounting reversal if invoiced
        const invoice = await InvoiceRepository.findByOrderId(order.id);
        if (invoice) {
            try {
                // Determine if this is a "SALES_RETURN" (for returns) or generic reversal
                const transactionType = 'SALES_RETURN';

                await AccountingService.processTransaction({
                    type: transactionType,
                    amount: invoice.total_amount,
                    payment_mode: 'DUE', // Affect AR
                    date: new Date(),
                    description: `Sales Return for Invoice ${invoice.invoice_number} (Order ${order.order_number})`
                });

                // Also mark invoice as cancelled
                await InvoiceRepository.update(invoice.id, { status: 'cancelled' });
            } catch (err) {
                console.error('Accounting Return Error:', err.message);
            }
        }
    }

    // Invoices
    async getAllInvoices(filters = {}, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const result = await InvoiceRepository.findAll(filters, limit, offset);

        // Calculate remaining balance for each invoice using order amounts
        const invoicesWithBalance = result.rows.map(invoice => {
            const invoiceData = invoice.toJSON();

            // Calculate total paid amount from completed payments
            // Calculate payment details
            const payments = invoiceData.payments || [];

            const grossPaid = payments.reduce((sum, p) => {
                const amt = parseFloat(p.amount);
                return amt > 0 ? sum + amt : sum;
            }, 0);

            const refunded = payments.reduce((sum, p) => {
                const amt = parseFloat(p.amount);
                return amt < 0 ? sum + Math.abs(amt) : sum;
            }, 0);

            const paidAmount = grossPaid - refunded; // Net Paid

            // Get order amounts
            const orderTotalAmount = invoiceData.order ? parseFloat(invoiceData.order.total_amount) : 0;
            const orderDiscountAmount = invoiceData.order ? parseFloat(invoiceData.order.discount_amount) : 0;
            const orderTaxAmount = invoiceData.order ? parseFloat(invoiceData.order.tax_amount) : 0;

            // Set invoice total_amount from order
            invoiceData.total_amount = orderTotalAmount;

            // Calculate remaining balance from order amounts
            // remaining_balance = total_amount - discount_amount + tax_amount - paid_amount
            const totalPayable = Math.round((orderTotalAmount - orderDiscountAmount + orderTaxAmount) * 100) / 100;
            const remainingBalance = Math.max(0, Math.round((totalPayable - paidAmount) * 100) / 100);

            // Add calculated fields
            invoiceData.paid_amount = paidAmount;
            invoiceData.gross_paid_amount = grossPaid;
            invoiceData.refunded_amount = refunded;
            invoiceData.remaining_balance = remainingBalance;
            invoiceData.total_payable = totalPayable;

            return invoiceData;
        });

        return {
            data: invoicesWithBalance,
            total: result.count
        };
    }

    async getInvoiceById(id) {
        const invoice = await InvoiceRepository.findById(id);
        if (!invoice) {
            throw new Error('Invoice not found');
        }

        const invoiceData = invoice.toJSON();

        // Calculate total paid amount from completed payments
        // Calculate payment details
        const payments = invoiceData.payments || [];

        const grossPaid = payments.reduce((sum, p) => {
            const amt = parseFloat(p.amount);
            return amt > 0 ? sum + amt : sum;
        }, 0);

        const refunded = payments.reduce((sum, p) => {
            const amt = parseFloat(p.amount);
            return amt < 0 ? sum + Math.abs(amt) : sum;
        }, 0);

        const paidAmount = grossPaid - refunded; // Net Paid

        // Get order amounts
        const orderTotalAmount = invoiceData.order ? parseFloat(invoiceData.order.total_amount) : 0;
        const orderDiscountAmount = invoiceData.order ? parseFloat(invoiceData.order.discount_amount) : 0;
        const orderTaxAmount = invoiceData.order ? parseFloat(invoiceData.order.tax_amount) : 0;

        // Set invoice total_amount from order
        invoiceData.total_amount = orderTotalAmount;

        // Calculate remaining balance from order amounts
        // remaining_balance = total_amount - discount_amount + tax_amount - paid_amount
        const totalPayable = Math.round((orderTotalAmount - orderDiscountAmount + orderTaxAmount) * 100) / 100;
        const remainingBalance = Math.max(0, Math.round((totalPayable - paidAmount) * 100) / 100);

        // Add calculated fields
        invoiceData.paid_amount = paidAmount;
        invoiceData.gross_paid_amount = grossPaid;
        invoiceData.refunded_amount = refunded;
        invoiceData.remaining_balance = remainingBalance;
        invoiceData.total_payable = totalPayable; // Also add total payable for reference

        return invoiceData;
    }

    async createInvoice(data, userId) {
        // Verify order exists and get its total_amount
        const order = await OrderRepository.findById(data.order_id);
        if (!order) {
            throw new Error('Order not found');
        }

        // Generate unique invoice number using prefix settings
        let invoice_number = data.invoice_number;
        if (!invoice_number) {
            try {
                const { generateNumber } = require('../settings/numbering.helper');
                invoice_number = await generateNumber('invoice');
            } catch (err) {
                console.error('Error generating invoice number:', err);
                invoice_number = `INV-${Date.now()}`;
            }
        }

        // Create invoice with auto-generated fields
        const subtotal = parseFloat(order.total_amount || 0);
        const discount = parseFloat(order.discount_amount || 0);
        const tax = parseFloat(order.tax_amount || 0);
        const totalPayable = subtotal - discount + tax;

        const invoiceData = {
            ...data,
            invoice_number,
            total_amount: subtotal, // Store subtotal in DB as per existing model? (Or should it be Payable? Model says total_amount)
            created_by: userId
        };

        const invoice = await InvoiceRepository.create(invoiceData);

        // Accounting: Book Sales Revenue (Dr AR / Cr Sales & Tax)
        if (invoice) {
            try {
                await AccountingService.processTransaction({
                    type: 'SALES',
                    amount: totalPayable,
                    tax_amount: tax,
                    payment_mode: 'DUE',
                    date: invoice.created_at || new Date(),
                    description: `Sales Invoice ${invoice.invoice_number}`
                });
            } catch (err) {
                console.error('Accounting Error:', err.message);
            }
        }

        return invoice;
    }

    async updateInvoiceStatus(id, status, userId) {
        const invoice = await InvoiceRepository.findById(id);
        if (!invoice) {
            throw new Error('Invoice not found');
        }

        const updatedInvoice = await InvoiceRepository.update(id, {
            status,
            updated_at: new Date()
        });

        // If invoice is marked as paid, update the Order payment_status to 'paid'
        if (status === 'paid' && invoice.order_id) {
            const { OrderRepository: OrderRepo } = require('./sales.repository');
            await OrderRepo.update(invoice.order_id, { payment_status: 'paid' });
        }

        return updatedInvoice;
    }

    // Warehouses
    async getAllWarehouses(filters = {}, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const result = await WarehouseRepository.findAll(filters, limit, offset);
        return {
            data: result.rows,
            total: result.count
        };
    }

    async getWarehouseById(id) {
        const warehouse = await WarehouseRepository.findById(id);
        if (!warehouse) {
            throw new Error('Warehouse not found');
        }
        return warehouse;
    }

    async createWarehouse(data, userId) {
        return await WarehouseRepository.create({ ...data, created_by: userId });
    }

    // Payments
    async getAllPayments(filters = {}, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const result = await PaymentRepository.findAll(filters, limit, offset);

        const processedIds = new Set();
        const data = [];

        for (const row of result.rows) {
            if (processedIds.has(row.id)) continue;
            processedIds.add(row.id);

            const payment = row.toJSON();
            if (!payment.invoice && payment.order && payment.order.invoice) {
                payment.invoice = payment.order.invoice;
            }
            data.push(payment);
        }

        return {
            data,
            total: result.count
        };
    }

    async getPaymentById(id) {
        const payment = await PaymentRepository.findById(id);
        if (!payment) {
            throw new Error('Payment not found');
        }

        const paymentData = payment.toJSON();

        // Calculate and add total_payable to the invoice within order
        if (paymentData.order && paymentData.order.invoice) {
            const orderTotalAmount = parseFloat(paymentData.order.total_amount) || 0;
            const orderDiscountAmount = parseFloat(paymentData.order.discount_amount) || 0;
            const orderTaxAmount = parseFloat(paymentData.order.tax_amount) || 0;

            paymentData.order.invoice.total_payable = Math.round((orderTotalAmount - orderDiscountAmount + orderTaxAmount) * 100) / 100;
        }

        // Remove root-level invoice as requested
        delete paymentData.invoice;

        return paymentData;
    }

    async createPayment(data, userId) {
        // Verify order exists
        const order = await OrderRepository.findByIdSimple(data.order_id);
        if (!order) {
            throw new Error('Order not found');
        }

        if (data.wastage && parseFloat(data.wastage) > 0) {
            const wastageAmt = parseFloat(data.wastage);
            order.discount_amount = parseFloat(order.discount_amount || 0) + wastageAmt;
            order.additional_discount = parseFloat(order.additional_discount || 0) + wastageAmt;
            await order.save();
        }

        // Generate reference number if not provided
        const reference_number = data.reference_number || `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        let invoice_id = data.invoice_id;
        let invoice = null;

        if (!invoice_id) {
            invoice = await InvoiceRepository.findByOrderId(order.id);
            if (invoice) {
                invoice_id = invoice.id;
            }
        } else {
            invoice = await InvoiceRepository.findById(invoice_id);
        }

        // If invoice exists, validate payment amount against remaining balance
        if (invoice) {
            const invoiceData = invoice.toJSON ? invoice.toJSON() : invoice;

            // Calculate total paid amount from completed payments
            // Calculate total paid amount from all payments
            const paidAmount = invoiceData.payments
                ? invoiceData.payments
                    .reduce((sum, payment) => sum + parseFloat(payment.amount), 0)
                : 0;

            // Get order amounts for correct calculation
            const orderTotalAmount = invoiceData.order ? parseFloat(invoiceData.order.total_amount) : parseFloat(invoiceData.total_amount);
            const orderDiscountAmount = invoiceData.order ? parseFloat(invoiceData.order.discount_amount) : 0;
            const orderTaxAmount = invoiceData.order ? parseFloat(invoiceData.order.tax_amount) : 0;

            // Calculate remaining balance from order amounts
            // remaining_balance = total_amount - discount_amount + tax_amount - paid_amount
            const totalPayable = orderTotalAmount - orderDiscountAmount + orderTaxAmount;
            const remainingBalance = totalPayable - paidAmount;

            // Check if invoice is already fully paid
            if (Math.round(remainingBalance * 100) <= 0) {
                throw new Error('Invoice is already fully paid');
            }

            // Check if payment amount exceeds remaining balance
            if (Math.round(parseFloat(data.amount) * 100) > Math.round(remainingBalance * 100)) {
                throw new Error(`Payment amount (${data.amount}) exceeds remaining balance (${remainingBalance.toFixed(2)})`);
            }
        }

        const paymentData = {
            ...data,
            invoice_id,
            reference_number,
            created_by: userId,
            status: data.status || 'completed' // Default to completed
        };

        const payment = await PaymentRepository.create(paymentData);

        // Accounting: Payment In (Dr Cash/Bank / Cr AR)
        if (payment && payment.status === 'completed') {
            try {
                let mode = 'CASH';
                const method = (payment.payment_method || '').toUpperCase();
                // Map common methods to BANK, otherwise default to CASH
                if (method.includes('BANK') || method.includes('CARD') || method.includes('TRANSFER') || method.includes('CHEQUE') || method.includes('BKASH') || method.includes('NAGAD')) {
                    mode = 'BANK';
                }

                const isRefund = parseFloat(payment.amount) < 0;
                await AccountingService.processTransaction({
                    type: isRefund ? 'REFUND_PAYMENT' : 'PAYMENT_IN',
                    amount: Math.abs(parseFloat(payment.amount)),
                    payment_mode: mode,
                    date: payment.payment_date || new Date(),
                    description: `${isRefund ? 'Refund Issued' : 'Payment Received'} ${payment.reference_number} for Invoice ${invoice ? invoice.invoice_number : 'Unknown'}`
                });
            } catch (err) {
                console.error('Accounting Payment Error:', err.message);
            }
        }

        // Update Invoice and Order status based on new balance
        if (invoice) {
            // Re-fetch invoice with payments to get the updated total paid
            const updatedInvoice = await InvoiceRepository.findById(invoice.id);
            const invoiceData = updatedInvoice.toJSON();

            const totalPaid = invoiceData.payments
                ? invoiceData.payments
                    .reduce((sum, p) => sum + parseFloat(p.amount), 0)
                : 0;

            const orderTotalAmount = invoiceData.order ? parseFloat(invoiceData.order.total_amount) : parseFloat(invoiceData.total_amount);
            const orderDiscountAmount = invoiceData.order ? parseFloat(invoiceData.order.discount_amount) : 0;
            const orderTaxAmount = invoiceData.order ? parseFloat(invoiceData.order.tax_amount) : 0;
            const invoiceTotalPayable = orderTotalAmount - orderDiscountAmount + orderTaxAmount;

            // Determine statuses
            let newInvoiceStatus = invoiceData.status;
            let newOrderPaymentStatus = 'unpaid';

            if (totalPaid >= invoiceTotalPayable) {
                newInvoiceStatus = 'paid';
                newOrderPaymentStatus = 'paid';
            } else if (totalPaid > 0) {
                newOrderPaymentStatus = 'partially_paid';
            }

            // Update Invoice Status if changed
            if (newInvoiceStatus !== invoiceData.status) {
                await InvoiceRepository.update(invoice.id, { status: newInvoiceStatus });
            }

            // Update Order Payment Status
            if (order) {
                await OrderRepository.update(order.id, { payment_status: newOrderPaymentStatus });
            }
        } else if (order) {
            // If no invoice, just update order based on direct payments? 
            // Current logic forces invoice for validation, but if we allow direct order payments later:
            // checks order total vs order paid... (skipping for now to keep safe)
        }

        return payment;
    }

    // Deliveries
    async createDelivery(orderId, data, userId) {
        // Fetch order to get shipping address if not provided
        const order = await OrderRepository.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        let delivery_number = data.delivery_number;
        if (!delivery_number) {
            delivery_number = `DEL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        }

        // Use provided delivery address or fallback to order shipping/billing address
        const delivery_address = data.delivery_address || order.shipping_address || order.billing_address;

        if (!delivery_address) {
            throw new Error('Delivery address is required and could not be found in the order.');
        }

        const deliveryData = {
            order_id: orderId,
            ...data,
            delivery_number,
            delivery_address,
            created_by: userId
        };
        const delivery = await DeliveryRepository.create(deliveryData);

        // Record status change in history
        await OrderStatusHistoryRepository.create({
            order_id: orderId,
            status: data.status,
            delivery_date: data.delivery_date || null,
            notes: data.notes || null,
            changed_by: userId
        });

        // Update Order status based on delivery status
        if (['delivered', 'in_transit', 'confirmed', 'returned', 'failed', 'cancelled'].includes(data.status)) {
            // If transitioning to a return/failed/cancel status, handle stock and accounting
            if (['returned', 'failed', 'cancelled'].includes(data.status) && !['returned', 'failed', 'cancelled'].includes(order.status)) {
                await this._handleOrderStatusChange(order, data.status, userId);
            }

            await OrderRepository.update(orderId, { status: data.status });
        }

        return delivery;
    }

    // Sales Routes
    async getAllSalesRoutes(filters = {}, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const result = await SalesRouteRepository.findAll(filters, limit, offset);
        return {
            data: result.rows,
            total: result.count
        };
    }

    async createSalesRoute(data, userId) {
        // Map camelCase to snake_case if present
        const routeData = {
            ...data,
            route_name: data.routeName || data.route_name,
            zoom_level: data.zoomLevel || data.zoom_level,
            postal_code: data.postalCode || data.postal_code,
            center_lat: data.centerLat || data.center_lat,
            center_lng: data.centerLng || data.center_lng,
            end_lat: data.endLat || data.end_lat,
            end_lng: data.endLng || data.end_lng,
            end_city: data.endCity || data.end_city,
            end_state: data.endState || data.end_state,
            end_country: data.endCountry || data.end_country,
            end_postal_code: data.endPostalCode || data.end_postal_code,
            coverage_radius: data.coverageRadius || data.coverage_radius,
            created_by: userId
        };

        // Remove camelCase keys to be clean (optional, but good practice if model has strict checking, though Sequelize ignores extras usually)

        return await SalesRouteRepository.create(routeData);
    }

    async getSalesRouteById(id) {
        const route = await SalesRouteRepository.findById(id);
        if (!route) {
            throw new Error('Sales route not found');
        }
        return route;
    }

    async updateSalesRoute(id, data, userId) {
        // Map camelCase to snake_case if present
        const routeData = {
            ...data,
            updated_at: new Date()
        };

        if (data.routeName) routeData.route_name = data.routeName;
        if (data.zoomLevel) routeData.zoom_level = data.zoomLevel;
        if (data.postalCode) routeData.postal_code = data.postalCode;
        if (data.centerLat) routeData.center_lat = data.centerLat;
        if (data.centerLng) routeData.center_lng = data.centerLng;
        if (data.endLat) routeData.end_lat = data.endLat;
        if (data.endLng) routeData.end_lng = data.endLng;
        if (data.endCity) routeData.end_city = data.endCity;
        if (data.endState) routeData.end_state = data.endState;
        if (data.endCountry) routeData.end_country = data.endCountry;
        if (data.endPostalCode) routeData.end_postal_code = data.endPostalCode;
        if (data.coverageRadius) routeData.coverage_radius = data.coverageRadius;

        const updatedRoute = await SalesRouteRepository.update(id, routeData);
        if (!updatedRoute) {
            throw new Error('Sales route not found');
        }
        return updatedRoute;
    }

    async deleteSalesRoute(id) {
        const result = await SalesRouteRepository.delete(id);
        if (!result) {
            throw new Error('Sales route not found');
        }
        return true;
    }

    async assignSalesRoute(id, staffIds, userId) {
        // Ensure staffIds is an array
        if (!Array.isArray(staffIds)) {
            // Check if it's a single value (legacy support)
            if (staffIds) {
                staffIds = [staffIds];
            } else {
                throw new Error('staff_ids array is required');
            }
        }

        const route = await SalesRouteRepository.assignStaff(id, staffIds, userId);
        if (!route) {
            throw new Error('Sales route not found');
        }
        return route;
    }

    async getSalesRouteAssignment(id) {
        // Reuse getById but we might want to ensure we fetch staff details if not already
        const route = await SalesRouteRepository.findById(id);
        if (!route) {
            throw new Error('Sales route not found');
        }
        return {
            id: route.id,
            route_name: route.route_name,
            assigned_sales_rep_id: route.assigned_sales_rep_id,
        };
    }

    async getStaffRoutes(filters = {}, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const result = await SalesRouteRepository.getStaffRoutes(filters, limit, offset);

        const transformedData = result.rows.map(staff => {
            const staffData = staff.toJSON();
            const routes = staffData.assignedRoutes || [];

            let totalCompletedOrders = 0;
            const mappedRoutes = routes.map(route => {
                let routeOrderCount = 0;
                if (route.customers) {
                    route.customers.forEach(customer => {
                        if (customer.orders) {
                            routeOrderCount += customer.orders.length;
                            customer.orders.forEach(order => {
                                if (order.status === 'delivered' || order.status === 'completed') {
                                    totalCompletedOrders++;
                                }
                            });
                        }
                    });
                }

                return {
                    id: route.id,
                    name: route.route_name,
                    status: route.is_active ? 'Active' : 'Inactive',
                    orders: routeOrderCount
                };
            });

            return {
                id: staffData.id,
                name: `${staffData.first_name} ${staffData.last_name}`,
                role: staffData.position || 'Staff',
                email: staffData.email,
                phone: staffData.phone,
                active: staffData.is_active,
                routes: mappedRoutes,
                stats: {
                    completedOrders: totalCompletedOrders,
                    rating: (Math.random() * (5.0 - 4.0) + 4.0).toFixed(1)
                }
            };
        });

        return {
            data: transformedData,
            total: result.count
        };
    }

    // Order Staff Assignment
    async assignStaffToOrder(orderId, staffIds, userId) {
        const result = await OrderRepository.assignStaffToOrder(orderId, staffIds, userId);
        if (!result) {
            throw new Error('Order not found');
        }
        return result;
    }

    async getOrdersWithStaff(filters = {}, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const result = await OrderRepository.getOrdersWithStaff(filters, limit, offset);

        const transformedData = result.rows.map(order => {
            const orderData = order.toJSON();
            const assignedStaff = orderData.assignedStaff || [];

            return {
                id: orderData.id,
                order_number: orderData.order_number,
                customer: orderData.customer ? orderData.customer.name || orderData.customer.company : 'Unknown',
                order_date: orderData.order_date,
                status: orderData.status,
                total_amount: orderData.total_amount,
                assigned_staff: assignedStaff.map(staff => ({
                    id: staff.id,
                    name: `${staff.first_name} ${staff.last_name}`,
                    email: staff.email,
                    position: staff.position
                }))
            };
        });

        return {
            data: transformedData,
            total: result.count
        };
    }


    // Reports & Charts
    async getReportsCharts(start_date, end_date) {
        const { Op } = require('sequelize');
        const { sequelize } = require('../../core/database/sequelize');

        // Build where condition with date range
        const whereCondition = sequelize.where(
            sequelize.fn('DATE', sequelize.col('order_date')),
            {
                [Op.between]: [start_date, end_date]
            }
        );

        // Group by date (MySQL)
        const dateFormat = sequelize.fn('DATE', sequelize.col('order_date'));

        // Query to aggregate sales data
        const results = await OrderRepository.model.findAll({
            attributes: [
                [dateFormat, 'date'],
                [sequelize.fn('SUM', sequelize.col('total_amount')), 'amount'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'order_count']
            ],
            where: whereCondition,
            group: [dateFormat],
            order: [[dateFormat, 'ASC']],
            raw: true
        });

        // Format the results
        const chartData = results.map(row => ({
            date: row.date,
            amount: parseFloat(row.amount) || 0,
            order_count: parseInt(row.order_count) || 0
        }));

        return {
            start_date,
            end_date,
            data: chartData
        };
    }

    // Sales Summary Report
    async getSalesSummary(start_date, end_date) {
        const { Op } = require('sequelize');
        const { sequelize } = require('../../core/database/sequelize');

        // Build where condition with date range
        const whereCondition = sequelize.where(
            sequelize.fn('DATE', sequelize.col('order_date')),
            {
                [Op.between]: [start_date, end_date]
            }
        );

        // Get summary statistics
        const summary = await OrderRepository.model.findOne({
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('id')), 'total_orders'],
                [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_sales'],
                [sequelize.fn('AVG', sequelize.col('total_amount')), 'average_order_value'],
                [sequelize.fn('SUM', sequelize.col('tax_amount')), 'total_tax'],
                [sequelize.fn('SUM', sequelize.col('discount_amount')), 'total_discount']
            ],
            where: whereCondition,
            raw: true
        });

        // Get status breakdown
        const statusBreakdown = await OrderRepository.model.findAll({
            attributes: [
                'status',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                [sequelize.fn('SUM', sequelize.col('total_amount')), 'amount']
            ],
            where: whereCondition,
            group: ['status'],
            raw: true
        });

        // Get payment status breakdown
        const paymentStatusBreakdown = await OrderRepository.model.findAll({
            attributes: [
                'payment_status',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                [sequelize.fn('SUM', sequelize.col('total_amount')), 'amount']
            ],
            where: whereCondition,
            group: ['payment_status'],
            raw: true
        });

        return {
            start_date,
            end_date,
            summary: {
                total_orders: parseInt(summary.total_orders) || 0,
                total_sales: parseFloat(summary.total_sales) || 0,
                average_order_value: parseFloat(summary.average_order_value) || 0,
                total_tax: parseFloat(summary.total_tax) || 0,
                total_discount: parseFloat(summary.total_discount) || 0
            },
            status_breakdown: statusBreakdown.map(row => ({
                status: row.status,
                count: parseInt(row.count) || 0,
                amount: parseFloat(row.amount) || 0
            })),
            payment_status_breakdown: paymentStatusBreakdown.map(row => ({
                payment_status: row.payment_status,
                count: parseInt(row.count) || 0,
                amount: parseFloat(row.amount) || 0
            }))
        };
    }

    async getOrderStats() {
        const stats = await OrderRepository.getStats();

        // Format to match user request
        return {
            total_orders: stats.totalOrders,
            pending_orders: stats.pendingOrders,
            delivered_orders: stats.deliveredOrders,
            total_value: stats.totalValue.toLocaleString()
        };
    }

    async generateEInvoice(invoiceId, userId) {
        const EInvoiceService = require('./einvoice.service');
        return await EInvoiceService.generateEInvoice(invoiceId, userId);
    }

    async submitEInvoice(invoiceId, userId) {
        const EInvoiceService = require('./einvoice.service');
        return await EInvoiceService.submitEInvoice(invoiceId, userId);
    }

    async generateInvoicePdfFile(invoiceId) {
        const fs = require('fs');
        const path = require('path');
        const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
        const { generateInvoicePdf } = require('./invoice.pdf');
        const SettingsService = require('../settings/settings.service');

        const invoice = await InvoiceRepository.findById(invoiceId);
        if (!invoice) {
            throw new Error('Invoice not found');
        }

        const settingsService = new SettingsService();
        const company = await settingsService.getCompanyProfile();

        const fileName = `invoice-${invoice.invoice_number.replace(/[^a-zA-Z0-9]/g, '_')}-${invoice.id}.pdf`;
        const localDir = path.join(__dirname, '../../../public/uploads/invoices');
        const localPath = path.join(localDir, fileName);

        // 1. Generate local PDF file
        await generateInvoicePdf({
            invoice: invoice.toJSON ? invoice.toJSON() : invoice,
            company,
            outputPath: localPath
        });

        // 2. If DigitalOcean Spaces is enabled, upload it there as well
        const useDO = process.env.DO_BUCKET &&
            process.env.DO_BUCKET !== 'your-bucket-name' &&
            process.env.DO_KEY &&
            process.env.DO_SECRETE;

        let s3Url = `/uploads/invoices/${fileName}`;

        if (useDO) {
            try {
                const s3Client = new S3Client({
                    endpoint: process.env.DO_ENDPOINT || 'https://nyc3.digitaloceanspaces.com',
                    region: process.env.DO_REGION || 'nyc3',
                    forcePathStyle: true,
                    credentials: {
                        accessKeyId: process.env.DO_KEY,
                        secretAccessKey: process.env.DO_SECRETE
                    }
                });

                const fileBuffer = fs.readFileSync(localPath);
                const key = `uploads/invoices/${fileName}`;

                await s3Client.send(new PutObjectCommand({
                    Bucket: process.env.DO_BUCKET,
                    Key: key,
                    Body: fileBuffer,
                    ACL: 'public-read',
                    ContentType: 'application/pdf'
                }));

                // Construct S3 URL
                s3Url = `${process.env.DO_ENDPOINT}/${process.env.DO_BUCKET}/${key}`;
                console.log(`[Invoice PDF] Uploaded to DO Spaces successfully: ${s3Url}`);
            } catch (s3Error) {
                console.error('[Invoice PDF] S3 Upload failed, falling back to local path:', s3Error);
            }
        }

        return {
            localPath,
            fileName,
            url: s3Url,
            invoiceNumber: invoice.invoice_number,
            trackingNumber: invoice.order?.deliveries?.[0]?.tracking_number || null
        };
    }
}

module.exports = new SalesService();
