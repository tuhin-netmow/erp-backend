const { Warehouse, SalesRoute, SalesRouteStaff, Order, OrderStaff, OrderItem, Invoice, Payment, Delivery, OrderStatusHistory, DeletedHistory } = require('./sales.models');
const { Op } = require('sequelize');
const { sequelize } = require('../../core/database/sequelize');

class OrderRepository {
    constructor() {
        this.model = Order;
    }

    async findAll(filters = {}, limit = 10, offset = 0) {
        const where = {};
        if (filters.status) {
            if (filters.status === 'in_transit') {
                where.status = { [Op.or]: ['in_transit', 'shipped'] };
            } else {
                where.status = filters.status;
            }
        }
        if (filters.customer_id) where.customer_id = filters.customer_id;

        if (filters.search) {
            where[Op.or] = [
                { order_number: { [Op.like]: `%${filters.search}%` } },
                { '$customer.name$': { [Op.like]: `%${filters.search}%` } },
                { '$customer.company$': { [Op.like]: `%${filters.search}%` } }
            ];
            if (!isNaN(filters.search)) {
                where[Op.or].push({ customer_id: filters.search });
            }
        }

        const { Staff } = require('../staffs/staffs.model');
        const { User } = require('../users/user.model');

        const queryOptions = {
            // attributes: removed subquery to use service layer calculation
            where,
            limit,
            offset,
            include: [
                {
                    model: require('../customers/customers.model').Customer,
                    as: 'customer',
                    include: [
                        {
                            model: require('../customers/customers.model').CustomerImage,
                            as: 'images'
                        },
                        {
                            model: require('../customers/customers.model').CustomerContact,
                            as: 'contacts'
                        }
                    ]
                },
                {
                    model: OrderItem,
                    as: 'items',
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
                },
                {
                    model: Delivery,
                    as: 'deliveries',
                    limit: 1,
                    order: [['created_at', 'DESC']],
                    separate: true
                },
                {
                    model: Staff,
                    as: 'assignedStaff',
                    attributes: ['id', 'first_name', 'last_name', 'email', 'position', 'thumb_url'],
                    through: { attributes: ['assigned_at', 'role'] }
                },
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: Payment,
                    as: 'payments',
                    separate: true
                }
            ],
            order: [['created_at', 'DESC']],
            distinct: true
        };

        if (filters.search) {
            queryOptions.subQuery = false;
        }

        return await Order.findAndCountAll(queryOptions);
    }

    async findById(id) {
        const { Staff } = require('../staffs/staffs.model');
        const { User } = require('../users/user.model');

        return await Order.findByPk(id, {
            include: [
                {
                    model: require('../customers/customers.model').Customer,
                    as: 'customer',
                    include: [
                        {
                            model: require('../customers/customers.model').CustomerImage,
                            as: 'images'
                        },
                        {
                            model: require('../customers/customers.model').CustomerContact,
                            as: 'contacts'
                        }
                    ]
                },
                {
                    model: OrderItem,
                    as: 'items',
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
                },
                { model: Invoice, as: 'invoice' },
                { model: Payment, as: 'payments' },
                { model: Delivery, as: 'deliveries' },
                {
                    model: Staff,
                    as: 'assignedStaff',
                    attributes: ['id', 'first_name', 'last_name', 'email', 'position', 'thumb_url'],
                    through: { attributes: ['assigned_at', 'role'] }
                },
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: OrderStatusHistory,
                    as: 'status_history'
                }
            ]
        });
    }

    async findByIdSimple(id) {
        return await Order.findByPk(id);
    }

    async create(orderData, itemsData) {
        const transaction = await sequelize.transaction();
        try {
            const order = await Order.create(orderData, { transaction });

            const items = itemsData.map(item => {
                const discount = item.discount || 0;
                const total_price = item.quantity * item.unit_price; // Before discount
                const line_total = item.line_total || (total_price - discount); // After discount

                return {
                    ...item,
                    order_id: order.id,
                    discount: discount,
                    total_price: total_price,
                    line_total: line_total,
                    tax_amount: item.tax_amount || 0,
                    sales_tax_percent: item.sales_tax_percent || 0
                };
            });

            if (items.length > 0) {
                await OrderItem.bulkCreate(items, { transaction });
            }

            await transaction.commit();
            return await this.findById(order.id);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async update(id, data) {
        const order = await Order.findByPk(id);
        if (!order) return null;
        await order.update(data);

        // Fetch the complete order with all relationships to return updated data
        return await this.findById(id);
    }

    async delete(id) {
        const order = await Order.findByPk(id);
        if (!order) return null;
        await order.destroy();
        return order;
    }

    async getStats() {
        const [totalOrders, pendingOrders, deliveredOrders, totalValueResult] = await Promise.all([
            // Total Orders
            Order.count(),

            // Pending Orders
            Order.count({ where: { status: 'pending' } }),

            // Delivered Orders
            Order.count({ where: { status: 'delivered' } }),

            // Total Value
            Order.sum('total_amount', { where: { status: { [Op.not]: 'cancelled' } } })
        ]);

        return {
            totalOrders,
            pendingOrders,
            deliveredOrders,
            totalValue: totalValueResult || 0
        };
    }

    async assignStaffToOrder(orderId, staffIds, assignedBy) {
        const transaction = await sequelize.transaction();

        try {
            // Verify order exists
            const order = await Order.findByPk(orderId);
            if (!order) {
                await transaction.rollback();
                return null;
            }

            // Remove all existing staff assignments for this order
            await OrderStaff.destroy({
                where: { order_id: orderId },
                transaction
            });

            // Add new staff assignments
            if (staffIds && staffIds.length > 0) {
                const { Staff } = require('../staffs/staffs.model');

                // Verify all staff members exist
                const existingStaff = await Staff.findAll({
                    where: {
                        id: {
                            [Op.in]: staffIds
                        }
                    },
                    attributes: ['id'],
                    transaction
                });

                const existingIds = existingStaff.map(s => s.id);
                const missingIds = staffIds.filter(id => !existingIds.includes(id));

                if (missingIds.length > 0) {
                    throw new Error(`Invalid Staff IDs: ${missingIds.join(', ')}`);
                }

                const assignments = staffIds.map(staffId => ({
                    order_id: orderId,
                    staff_id: staffId,
                    assigned_by: assignedBy,
                    assigned_at: new Date()
                }));

                await OrderStaff.bulkCreate(assignments, { transaction });
            }

            await transaction.commit();

            // Fetch and return the updated order with assigned staff
            return await this.findById(orderId);
        } catch (error) {
            if (!transaction.finished) {
                await transaction.rollback();
            }
            throw error;
        }
    }

    async getOrdersWithStaff(filters = {}, limit = 10, offset = 0) {
        const where = {};
        if (filters.status) {
            if (filters.status === 'in_transit') {
                where.status = { [Op.or]: ['in_transit', 'shipped'] };
            } else {
                where.status = filters.status;
            }
        }
        if (filters.customer_id) where.customer_id = filters.customer_id;

        if (filters.search) {
            where[Op.or] = [
                { order_number: { [Op.like]: `%${filters.search}%` } },
                { '$customer.name$': { [Op.like]: `%${filters.search}%` } },
                { '$customer.company$': { [Op.like]: `%${filters.search}%` } }
            ];
            if (!isNaN(filters.search)) {
                where[Op.or].push({ customer_id: filters.search });
            }
        }

        const { Staff } = require('../staffs/staffs.model');
        const { User } = require('../users/user.model');

        const queryOptions = {
            where,
            limit,
            offset,
            include: [
                {
                    model: require('../customers/customers.model').Customer,
                    as: 'customer',
                    include: [
                        {
                            model: require('../customers/customers.model').CustomerImage,
                            as: 'images'
                        },
                        {
                            model: require('../customers/customers.model').CustomerContact,
                            as: 'contacts'
                        }
                    ]
                },
                {
                    model: Staff,
                    as: 'assignedStaff',
                    attributes: ['id', 'first_name', 'last_name', 'email', 'position', 'thumb_url'],
                    through: { attributes: ['assigned_at', 'role'] }
                },
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'name', 'email']
                }
            ],
            order: [['created_at', 'DESC']],
            distinct: true
        };

        if (filters.search) {
            queryOptions.subQuery = false;
        }

        return await Order.findAndCountAll(queryOptions);
    }

    async findOrdersWithItems(orderIds) {
        const { Customer } = require('../customers/customers.model');
        const { Product } = require('../products/products.model');
        const { User } = require('../users/user.model');

        return await Order.findAll({
            where: {
                id: {
                    [Op.in]: orderIds
                }
            },
            attributes: ['id', 'order_number', 'order_date', 'total_amount', 'status'],
            include: [
                {
                    model: Customer,
                    as: 'customer',
                    attributes: ['id', 'name', 'company']
                },
                {
                    model: OrderItem,
                    as: 'items',
                    include: [
                        {
                            model: Product,
                            as: 'product',
                            attributes: ['id', 'name', 'sku', 'price', 'image_url', 'specification']
                        }
                    ]
                },
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'name', 'email']
                }
            ],
            order: [['id', 'ASC']]
        });
    }

    async findAllBySalesRoute(filters = {}, limit = 10, offset = 0) {
        const where = {};
        const customerWhere = {};

        // Filter by sales route
        if (filters.sales_route_id) {
            customerWhere.sales_route_id = filters.sales_route_id;
        }

        // Filter by order status
        if (filters.status) {
            if (filters.status === 'in_transit') {
                where.status = { [Op.or]: ['in_transit', 'shipped'] };
            } else {
                where.status = filters.status;
            }
        }

        // Search by order number
        if (filters.search) {
            where[Op.or] = [
                { order_number: { [Op.like]: `%${filters.search}%` } },
                { '$customer.name$': { [Op.like]: `%${filters.search}%` } },
                { '$customer.company$': { [Op.like]: `%${filters.search}%` } }
            ];
            if (!isNaN(filters.search)) {
                where[Op.or].push({ customer_id: filters.search });
            }
        }

        const { Customer } = require('../customers/customers.model');
        const { User } = require('../users/user.model');

        const queryOptions = {
            where,
            limit,
            offset,
            include: [
                {
                    model: Customer,
                    as: 'customer',
                    where: Object.keys(customerWhere).length > 0 ? customerWhere : undefined,
                    required: true, // Only get orders with customers
                    attributes: ['id', 'name', 'email', 'phone', 'company', 'address', 'city', 'sales_route_id'],
                    include: [
                        {
                            model: SalesRoute,
                            as: 'salesRoute',
                            attributes: ['id', 'route_name', 'description']
                        }
                    ]
                },
                {
                    model: OrderItem,
                    as: 'items',
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
                },
                {
                    model: Delivery,
                    as: 'deliveries',
                    limit: 1,
                    order: [['created_at', 'DESC']],
                    separate: true
                },
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'name', 'email']
                }
            ],
            order: [['created_at', 'DESC']],
            distinct: true
        };

        if (filters.search) {
            queryOptions.subQuery = false;
        }

        return await Order.findAndCountAll(queryOptions);
    }
}

class InvoiceRepository {
    async findAll(filters = {}, limit = 10, offset = 0) {
        const where = {};
        const orderWhere = {};

        if (filters.status) where.status = filters.status;

        // Filter for unpaid invoices (not paid and not cancelled)
        if (filters.unpaid === true || filters.unpaid === 'true') {
            where.status = { [Op.notIn]: ['paid', 'cancelled'] };
        }

        if (filters.id) where.id = filters.id;

        // Filter by customer_id (belongs to Order)
        if (filters.customer_id) {
            orderWhere.customer_id = filters.customer_id;
        }

        if (filters.search) {
            where[Op.or] = [
                { invoice_number: { [Op.like]: `%${filters.search}%` } },
                { '$order.order_number$': { [Op.like]: `%${filters.search}%` } },
                { '$order.customer.name$': { [Op.like]: `%${filters.search}%` } },
                { '$order.customer.company$': { [Op.like]: `%${filters.search}%` } }
            ];
            // If search is numeric, also search by customer ID and invoice ID
            if (!isNaN(filters.search)) {
                where[Op.or].push({ '$order.customer_id$': filters.search });
                where[Op.or].push({ id: filters.search });
            }
        }

        const { Customer } = require('../customers/customers.model');

        const queryOptions = {
            where,
            limit,
            offset,
            include: [
                {
                    model: Order,
                    as: 'order',
                    where: Object.keys(orderWhere).length > 0 ? orderWhere : undefined,
                    include: [
                        {
                            model: Customer,
                            as: 'customer',
                            attributes: ['id', 'name', 'email', 'phone', 'company']
                        },
                        {
                            model: OrderItem,
                            as: 'items',
                            include: [
                                {
                                    model: require('../products/products.model').Product,
                                    as: 'product',
                                    attributes: ['id', 'name', 'sku', 'price', 'image_url', 'specification']
                                }
                            ]
                        }
                    ]
                },
                {
                    model: Payment,
                    as: 'payments',
                    attributes: ['id', 'amount', 'payment_date', 'payment_method', 'status']
                }
            ],
            order: [['created_at', 'DESC']],
            distinct: true // Ensure correct count with includes
        };

        if (filters.search) {
            queryOptions.subQuery = false;
        }

        return await Invoice.findAndCountAll(queryOptions);
    }

    async findById(id) {
        const { Customer } = require('../customers/customers.model');
        return await Invoice.findByPk(id, {
            include: [
                {
                    model: Order,
                    as: 'order',
                    include: [
                        {
                            model: Customer,
                            as: 'customer'
                        },
                        {
                            model: OrderItem,
                            as: 'items',
                            include: [
                                {
                                    model: require('../products/products.model').Product,
                                    as: 'product',
                                    attributes: ['id', 'name', 'sku', 'price', 'image_url', 'specification']
                                }
                            ]
                        },
                        {
                            model: Delivery,
                            as: 'deliveries'
                        }
                    ]
                },
                {
                    model: Payment,
                    as: 'payments',
                    include: [
                        {
                            model: require('../users/user.model').User,
                            as: 'creator',
                            attributes: ['id', 'name', 'email']
                        }
                    ]
                },
                {
                    model: require('../users/user.model').User,
                    as: 'creator',
                    attributes: ['id', 'name', 'email']
                }
            ]
        });
    }

    async create(data) {
        return await Invoice.create(data);
    }

    async update(id, data) {
        const invoice = await Invoice.findByPk(id);
        if (!invoice) return null;
        return await invoice.update(data);
    }

    async findByOrderId(orderId) {
        return await Invoice.findOne({ where: { order_id: orderId } });
    }
}

class WarehouseRepository {
    async findAll(filters = {}, limit = 10, offset = 0) {
        const where = {};

        if (filters.is_active !== undefined) {
            where.is_active = filters.is_active;
        }

        if (filters.search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${filters.search}%` } },
                { location: { [Op.like]: `%${filters.search}%` } }
            ];
        }

        return await Warehouse.findAndCountAll({
            where,
            limit,
            offset,
            order: [['created_at', 'DESC']]
        });
    }

    async findById(id) {
        return await Warehouse.findByPk(id);
    }

    async create(data) {
        return await Warehouse.create(data);
    }
}

class PaymentRepository {
    async findAll(filters = {}, limit = 10, offset = 0) {
        const where = {};

        if (filters.order_id) {
            where.order_id = filters.order_id;
        }

        if (filters.payment_method) {
            where.payment_method = filters.payment_method;
        }

        if (filters.search) {
            where[Op.or] = [
                { reference_number: { [Op.like]: `%${filters.search}%` } },
                { '$order.order_number$': { [Op.like]: `%${filters.search}%` } },
                { '$order.customer.name$': { [Op.like]: `%${filters.search}%` } },
                { '$order.customer.company$': { [Op.like]: `%${filters.search}%` } }
            ];

            let paymentIdSearch = filters.search;
            if (paymentIdSearch.toUpperCase().startsWith('PAY-')) {
                paymentIdSearch = paymentIdSearch.substring(4);
            }
            if (!isNaN(paymentIdSearch) && paymentIdSearch.trim() !== '') {
                where[Op.or].push({ id: paymentIdSearch });
            }
        }

        return await Payment.findAndCountAll({
            where,
            limit,
            offset,
            include: [
                {
                    model: Order,
                    as: 'order',
                    include: [
                        {
                            model: require('../customers/customers.model').Customer,
                            as: 'customer',
                            attributes: ['id', 'name', 'email', 'phone', 'company']
                        },
                        {
                            model: Invoice,
                            as: 'invoice'
                        }
                    ]
                },
                { model: Invoice, as: 'invoice' }
            ],
            order: [['created_at', 'DESC']],
            distinct: true,
            col: 'id'
        });
    }

    async findById(id) {
        const { Customer } = require('../customers/customers.model');
        return await Payment.findByPk(id, {
            include: [
                {
                    model: Order,
                    as: 'order',
                    include: [
                        {
                            model: Customer,
                            as: 'customer',
                            attributes: ['id', 'name', 'email', 'phone', 'company']
                        },
                        {
                            model: Invoice,
                            as: 'invoice'
                        }
                    ]
                }
            ]
        });
    }

    async create(data) {
        return await Payment.create(data);
    }
}

class DeliveryRepository {
    async create(data) {
        return await Delivery.create(data);
    }
}

class OrderStatusHistoryRepository {
    async create(data) {
        return await OrderStatusHistory.create(data);
    }

    async findAllByOrderId(orderId) {
        return await OrderStatusHistory.findAll({
            where: { order_id: orderId },
            order: [['created_at', 'DESC']]
        });
    }
}

class SalesRouteRepository {
    async create(data) {
        return await SalesRoute.create(data);
    }

    async findAll(filters = {}, limit = 10, offset = 0) {
        const where = {};
        if (filters.is_active !== undefined) where.is_active = filters.is_active;
        if (filters.search) {
            where[Op.or] = [
                { route_name: { [Op.like]: `%${filters.search}%` } },
                { description: { [Op.like]: `%${filters.search}%` } }
            ];
        }

        return await SalesRoute.findAndCountAll({
            where,
            limit,
            offset,
            order: [['created_at', 'DESC']]
        });
    }

    async findAllWithOrders(filters = {}, limit = 10, offset = 0) {
        const routeWhere = {};
        if (filters.sales_route_id) routeWhere.id = filters.sales_route_id;

        // Search routes
        if (filters.search) {
            routeWhere[Op.or] = [
                { route_name: { [Op.like]: `%${filters.search}%` } }
            ];
        }

        // Order filters
        const orderWhere = {};
        if (filters.status) orderWhere.status = filters.status;

        // Date filter
        if (filters.date) {
            // specific date match
            orderWhere.order_date = sequelize.where(
                sequelize.fn('DATE', sequelize.col('customers.orders.order_date')),
                filters.date
            );
        }

        const { Customer } = require('../customers/customers.model');

        return await SalesRoute.findAndCountAll({
            where: routeWhere,
            limit,
            offset,
            include: [
                {
                    model: Customer,
                    as: 'customers',
                    required: false,
                    include: [
                        {
                            model: Order,
                            as: 'orders',
                            where: Object.keys(orderWhere).length > 0 ? orderWhere : undefined,
                            required: false, // Include customers even if no orders unless we strictly want only routes/custs with orders? 
                            // If we filter orders, we might want to see routes but with empty orders list if none match.
                            // However, 'where' inside include usually forces inner join if required is true. false -> LEFT JOIN.
                            include: [
                                {
                                    model: OrderItem,
                                    as: 'items',
                                    include: [
                                        {
                                            model: require('../products/products.model').Product,
                                            as: 'product',
                                            attributes: ['id', 'name', 'sku', 'price', 'image_url', 'specification']
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ],
            distinct: true,
            order: [['id', 'ASC']]
        });
    }

    async findById(id) {
        const { Customer } = require('../customers/customers.model');
        const { Staff } = require('../staffs/staffs.model');

        return await SalesRoute.findByPk(id, {
            include: [
                {
                    model: Customer,
                    as: 'customers',
                    attributes: ['id', 'name', 'email', 'phone', 'company', 'address', 'city', 'latitude', 'longitude'],
                    required: false,
                    include: [
                        {
                            model: Order,
                            as: 'orders',
                            attributes: ['id', 'order_number', 'order_date', 'total_amount', 'status'],
                            include: [
                                {
                                    model: OrderItem,
                                    as: 'items',
                                    include: [
                                        {
                                            model: require('../products/products.model').Product,
                                            as: 'product',
                                            attributes: ['id', 'name', 'sku', 'price', 'image_url', 'specification']
                                        }
                                    ]
                                }
                            ],
                            limit: 1,
                            order: [['order_date', 'DESC']],
                            required: false
                        }
                    ]
                },
                {
                    model: Staff,
                    as: 'assignedStaffMembers',
                    attributes: ['id', 'first_name', 'last_name', 'email', 'position'],
                    through: {
                        attributes: ['assigned_at', 'assigned_by']
                    }
                }
            ]
        });
    }

    async assignStaff(routeId, staffIds, assignedBy) {
        const transaction = await sequelize.transaction();

        try {
            // Verify route exists
            const route = await SalesRoute.findByPk(routeId);
            if (!route) {
                await transaction.rollback();
                return null;
            }

            // Remove all existing staff assignments for this route
            await SalesRouteStaff.destroy({
                where: { sales_route_id: routeId },
                transaction
            });

            // Add new staff assignments
            if (staffIds && staffIds.length > 0) {
                const { Staff } = require('../staffs/staffs.model');

                // Verify ONLY staff members exist
                // strict check: ensure all staffIds are valid numbers
                const validStaffIds = staffIds.map(id => parseInt(id)).filter(id => !isNaN(id) && id > 0);

                if (validStaffIds.length !== staffIds.length) {
                    throw new Error('Staff IDs must be positive numbers');
                }

                const existingStaff = await Staff.findAll({
                    where: {
                        id: {
                            [Op.in]: validStaffIds
                        }
                    },
                    attributes: ['id'],
                    transaction
                });

                const existingIds = existingStaff.map(s => s.id);
                const missingIds = validStaffIds.filter(id => !existingIds.includes(id));

                if (missingIds.length > 0) {
                    throw new Error(`Invalid Staff IDs: ${missingIds.join(', ')}`);
                }

                const assignments = validStaffIds.map(staffId => ({
                    sales_route_id: routeId,
                    staff_id: staffId,
                    assigned_by: assignedBy,
                    assigned_at: new Date()
                }));

                await SalesRouteStaff.bulkCreate(assignments, { transaction });
            }

            await transaction.commit();

            // Return updated route
            return await this.findById(routeId);
        } catch (error) {
            if (!transaction.finished) {
                await transaction.rollback();
            }
            throw error;
        }
    }
    async update(id, data) {
        const route = await SalesRoute.findByPk(id);
        if (!route) return null;
        return await route.update(data);
    }

    async delete(id) {
        const route = await SalesRoute.findByPk(id);
        if (!route) return null;
        return await route.destroy();
    }
}

class DeletedHistoryRepository {
    constructor() {
        this.model = DeletedHistory;
    }

    async create(data, transaction = null) {
        return await DeletedHistory.create(data, { transaction });
    }
}

module.exports = {
    OrderRepository: new OrderRepository(),
    InvoiceRepository: new InvoiceRepository(),
    WarehouseRepository: new WarehouseRepository(),
    PaymentRepository: new PaymentRepository(),
    DeliveryRepository: new DeliveryRepository(),
    OrderStatusHistoryRepository: new OrderStatusHistoryRepository(),
    SalesRouteRepository: new SalesRouteRepository(),
    DeletedHistoryRepository: new DeletedHistoryRepository()
};
