const { SalesReturn, SalesReturnItem, SalesReturnInvoice, SalesReturnPayment } = require('./sales-return.models');
const { Order } = require('./sales.models');
const { Op } = require('sequelize');
const { sequelize } = require('../../core/database/sequelize');

class SalesReturnRepository {
    async findAll(filters = {}, limit = 10, offset = 0) {
        limit = Number(limit) || 10;
        offset = Number(offset) || 0;
        const where = {};
        if (filters.status) where.status = filters.status;
        if (filters.customer_id) where.customer_id = filters.customer_id;
        if (filters.order_id) where.order_id = filters.order_id;

        if (filters.search) {
            where[Op.or] = [
                { return_number: { [Op.like]: `%${filters.search}%` } },
                { '$customer.name$': { [Op.like]: `%${filters.search}%` } },
                { '$customer.company$': { [Op.like]: `%${filters.search}%` } }
            ];
        }

        return await SalesReturn.findAndCountAll({
            attributes: {
                include: [
                    [
                        sequelize.literal(`(
                            SELECT COALESCE(SUM(srp.amount), 0)
                            FROM sales_return_payments AS srp
                            WHERE srp.sales_return_id = SalesReturn.id
                        )`),
                        'total_refunded_amount'
                    ]
                ]
            },
            where,
            limit,
            offset,
            subQuery: false,
            include: [
                {
                    model: SalesReturnItem,
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
                    model: require('../customers/customers.model').Customer,
                    as: 'customer'
                },
                {
                    model: Order,
                    as: 'order',
                    include: [
                        {
                            model: require('./sales.models').OrderItem,
                            as: 'items',
                            include: [
                                {
                                    model: require('../products/products.model').Product,
                                    as: 'product',
                                    attributes: ['id', 'name', 'sku', 'specification']
                                }
                            ]
                        },
                        {
                            model: require('../customers/customers.model').Customer,
                            as: 'customer'
                        }
                    ]
                }
            ],
            order: [['created_at', 'DESC']],
            distinct: true
        });
    }

    async findById(id) {
        const { User } = require('../users/user.model');
        const { Customer } = require('../customers/customers.model');
        const { Product } = require('../products/products.model');

        return await SalesReturn.findByPk(id, {
            include: [
                {
                    model: Customer,
                    as: 'customer'
                },
                {
                    model: SalesReturnItem,
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
                    model: SalesReturnInvoice,
                    as: 'invoice',
                    include: [
                        {
                            model: SalesReturnPayment,
                            as: 'payments',
                            include: [
                                {
                                    model: User,
                                    as: 'creator',
                                    attributes: ['id', 'name', 'email']
                                }
                            ]
                        }
                    ]
                },
                {
                    model: SalesReturnPayment,
                    as: 'payments',
                    include: [
                        {
                            model: User,
                            as: 'creator',
                            attributes: ['id', 'name', 'email']
                        }
                    ]
                },
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: Order,
                    as: 'order',
                    attributes: ['id', 'order_number', 'total_amount']
                }
            ]
        });
    }

    async findByIdSimple(id) {
        return await SalesReturn.findByPk(id);
    }

    async create(returnData, itemsData) {
        const transaction = await sequelize.transaction();
        try {
            const sr = await SalesReturn.create(returnData, { transaction });

            const items = itemsData.map(item => ({
                ...item,
                sales_return_id: sr.id
            }));

            if (items.length > 0) {
                await SalesReturnItem.bulkCreate(items, { transaction });
            }

            await transaction.commit();
            return await this.findById(sr.id);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async update(id, data) {
        const sr = await SalesReturn.findByPk(id);
        if (!sr) return null;
        return await sr.update(data);
    }

    async delete(id) {
        const sr = await SalesReturn.findByPk(id);
        if (!sr) return null;
        await sr.destroy();
        return sr;
    }
}

class SalesReturnInvoiceRepository {
    async findAll(filters = {}, limit = 10, offset = 0) {
        limit = Number(limit) || 10;
        offset = Number(offset) || 0;
        const where = {};
        if (filters.status) where.status = filters.status;
        if (filters.customer_id) {
            where['$sales_return.customer_id$'] = filters.customer_id;
        }

        if (filters.search) {
            where[Op.or] = [
                { invoice_number: { [Op.like]: `%${filters.search}%` } }
            ];
        }

        return await SalesReturnInvoice.findAndCountAll({
            where,
            limit,
            offset,
            include: [
                {
                    model: SalesReturn,
                    as: 'sales_return',
                    include: [
                        {
                            model: require('../customers/customers.model').Customer,
                            as: 'customer'
                        }
                    ]
                }
            ],
            order: [['created_at', 'DESC']]
        });
    }

    async findById(id) {
        return await SalesReturnInvoice.findByPk(id, {
            include: [
                {
                    model: SalesReturn,
                    as: 'sales_return',
                    include: [
                        {
                            model: require('../customers/customers.model').Customer,
                            as: 'customer'
                        },
                        {
                            model: SalesReturnItem,
                            as: 'items',
                            include: [
                                {
                                    model: require('../products/products.model').Product,
                                    as: 'product'
                                }
                            ]
                        }
                    ]
                },
                {
                    model: SalesReturnPayment,
                    as: 'payments'
                }
            ]
        });
    }

    async create(data) {
        return await SalesReturnInvoice.create(data);
    }

    async update(id, data) {
        const invoice = await SalesReturnInvoice.findByPk(id);
        if (!invoice) return null;
        return await invoice.update(data);
    }

    async findBySalesReturnId(salesReturnId) {
        return await SalesReturnInvoice.findOne({ where: { sales_return_id: salesReturnId } });
    }
}

class SalesReturnPaymentRepository {
    async findAll(filters = {}, limit = 10, offset = 0) {
        limit = Number(limit) || 10;
        offset = Number(offset) || 0;
        const where = {};
        if (filters.sales_return_id) where.sales_return_id = filters.sales_return_id;
        if (filters.payment_method) where.payment_method = filters.payment_method;

        if (filters.search) {
            where[Op.or] = [
                { reference_number: { [Op.like]: `%${filters.search}%` } },
                { '$sales_return.customer.name$': { [Op.like]: `%${filters.search}%` } },
                { '$sales_return.customer.company$': { [Op.like]: `%${filters.search}%` } }
            ];
        }

        return await SalesReturnPayment.findAndCountAll({
            where,
            limit,
            offset,
            subQuery: false,
            include: [
                {
                    model: SalesReturn,
                    as: 'sales_return',
                    include: [
                        {
                            model: require('../customers/customers.model').Customer,
                            as: 'customer'
                        }
                    ]
                },
                { model: SalesReturnInvoice, as: 'invoice' }
            ],
            order: [['created_at', 'DESC']]
        });
    }

    async findById(id) {
        return await SalesReturnPayment.findByPk(id, {
            include: [
                {
                    model: SalesReturn,
                    as: 'sales_return',
                    include: [
                        {
                            model: require('../customers/customers.model').Customer,
                            as: 'customer'
                        }
                    ]
                },
                { model: SalesReturnInvoice, as: 'invoice' }
            ]
        });
    }

    async create(data) {
        return await SalesReturnPayment.create(data);
    }
}

module.exports = {
    SalesReturnRepository: new SalesReturnRepository(),
    SalesReturnInvoiceRepository: new SalesReturnInvoiceRepository(),
    SalesReturnPaymentRepository: new SalesReturnPaymentRepository()
};
