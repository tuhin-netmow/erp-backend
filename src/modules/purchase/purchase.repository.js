const { PurchaseOrder, PurchaseOrderItem, PurchaseInvoice, PurchasePayment, PurchaseReceipt } = require('./purchase.models');
const { Op } = require('sequelize');
const { sequelize } = require('../../core/database/sequelize');

class PurchaseOrderRepository {
    async findAll(filters = {}, limit = 10, offset = 0) {
        const where = {};
        if (filters.status) where.status = filters.status;
        if (filters.supplier_id) where.supplier_id = filters.supplier_id;

        if (filters.search) {
            where[Op.or] = [
                { po_number: { [Op.like]: `%${filters.search}%` } },
                { '$supplier.name$': { [Op.like]: `%${filters.search}%` } }
            ];
        }

        return await PurchaseOrder.findAndCountAll({
            attributes: {
                include: [
                    [
                        sequelize.literal(`(
                            SELECT COALESCE(SUM(pp.amount), 0)
                            FROM purchase_payments AS pp
                            WHERE pp.purchase_order_id = PurchaseOrder.id
                        )`),
                        'total_paid_amount'
                    ]
                ]
            },
            where,
            limit,
            offset,
            subQuery: false,
            include: [
                { model: PurchaseOrderItem, as: 'items' },
                {
                    model: require('../suppliers/suppliers.model').Supplier,
                    as: 'supplier',
                    attributes: ['id', 'name']
                },
                {
                    model: PurchaseInvoice,
                    as: 'invoice',
                    attributes: ['id', 'invoice_number']
                }
            ],
            order: [['created_at', 'DESC']],
            distinct: true
        });
    }

    async findById(id) {
        const { User } = require('../users/user.model');

        return await PurchaseOrder.findByPk(id, {
            include: [
                {
                    model: require('../suppliers/suppliers.model').Supplier,
                    as: 'supplier',
                    attributes: ['id', 'name', 'email', 'phone', 'contact_person']
                },
                {
                    model: PurchaseOrderItem,
                    as: 'items',
                    include: [
                        {
                            model: require('../products/products.model').Product,
                            as: 'product',
                            attributes: ['id', 'name', 'sku', 'price', 'image_url']
                        }
                    ]
                },
                {
                    model: PurchaseInvoice,
                    as: 'invoice',
                    include: [
                        {
                            model: PurchasePayment,
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
                        }
                    ]
                },
                {
                    model: PurchasePayment,
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
                }
            ]
        });
    }

    async findByIdSimple(id) {
        return await PurchaseOrder.findByPk(id);
    }

    async create(orderData, itemsData) {
        const transaction = await sequelize.transaction();
        try {
            const order = await PurchaseOrder.create(orderData, { transaction });

            const items = itemsData.map(item => {
                const discount = item.discount || 0;
                const subtotal = item.quantity * item.unit_cost;
                const line_total = subtotal - discount;

                return {
                    ...item,
                    purchase_order_id: order.id,
                    discount: discount,
                    line_total: line_total,
                    tax_amount: item.tax_amount || 0,
                    purchase_tax_percent: item.purchase_tax_percent || 0
                };
            });

            if (items.length > 0) {
                await PurchaseOrderItem.bulkCreate(items, { transaction });
            }

            await transaction.commit();
            return await this.findById(order.id);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async update(id, data) {
        const order = await PurchaseOrder.findByPk(id);
        if (!order) return null;
        return await order.update(data);
    }

    async delete(id) {
        const order = await PurchaseOrder.findByPk(id);
        if (!order) return null;
        await order.destroy();
        return order;
    }

    async findPurchaseOrdersWithSupplierLocation() {
        const { Supplier } = require('../suppliers/suppliers.model');
        return await PurchaseOrder.findAll({
            include: [
                {
                    model: Supplier,
                    as: 'supplier',
                    attributes: ['id', 'name', 'contact_person', 'address', 'city', 'phone', 'email', 'latitude', 'longitude'],
                    where: {
                        latitude: { [Op.ne]: null },
                        longitude: { [Op.ne]: null }
                    }
                }
            ],
            order: [['created_at', 'DESC']]
        });
    }
}

class PurchaseInvoiceRepository {
    async findAll(filters = {}, limit = 10, offset = 0) {
        const where = {};
        const orderWhere = {};

        if (filters.status) where.status = filters.status;
        if (filters.id) where.id = filters.id;

        if (filters.supplier_id) {
            orderWhere.supplier_id = filters.supplier_id;
        }

        if (filters.search) {
            where[Op.or] = [
                { invoice_number: { [Op.like]: `%${filters.search}%` } },
                { '$purchase_order.supplier.name$': { [Op.like]: `%${filters.search}%` } }
            ];
            if (!isNaN(filters.search)) {
                where[Op.or].push({ '$purchase_order.supplier_id$': filters.search });
                where[Op.or].push({ id: filters.search });
            }
        }

        const { Supplier } = require('../suppliers/suppliers.model');

        const queryOptions = {
            attributes: {
                include: [
                    [
                        sequelize.literal(`(
                            SELECT COALESCE(SUM(amount), 0)
                            FROM purchase_payments AS pp
                            WHERE
                                pp.invoice_id = PurchaseInvoice.id
                        )`),
                        'paid_amount'
                    ]
                ]
            },
            where,
            limit,
            offset,
            include: [
                {
                    model: PurchaseOrder,
                    as: 'purchase_order',
                    where: Object.keys(orderWhere).length > 0 ? orderWhere : undefined,
                    include: [
                        {
                            model: Supplier,
                            as: 'supplier',
                            attributes: ['id', 'name', 'email', 'phone', 'contact_person']
                        },
                        {
                            model: PurchaseOrderItem,
                            as: 'items',
                            include: [
                                {
                                    model: require('../products/products.model').Product,
                                    as: 'product',
                                    attributes: ['id', 'name', 'sku']
                                }
                            ]
                        }
                    ]
                }
            ],
            order: [['created_at', 'DESC']],
            distinct: true
        };

        if (filters.search) {
            queryOptions.subQuery = false;
        }

        return await PurchaseInvoice.findAndCountAll(queryOptions);
    }

    async findById(id) {
        const { Supplier } = require('../suppliers/suppliers.model');
        const { User } = require('../users/user.model');

        return await PurchaseInvoice.findByPk(id, {
            attributes: {
                include: [
                    [
                        sequelize.literal(`(
                            SELECT COALESCE(SUM(amount), 0)
                            FROM purchase_payments AS pp
                            WHERE
                                pp.invoice_id = PurchaseInvoice.id
                        )`),
                        'paid_amount'
                    ]
                ]
            },
            include: [
                {
                    model: PurchaseOrder,
                    as: 'purchase_order',
                    include: [
                        {
                            model: Supplier,
                            as: 'supplier',
                            attributes: ['id', 'name', 'email', 'phone', 'contact_person', 'address', 'city']
                        },
                        {
                            model: PurchaseOrderItem,
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
                    model: PurchasePayment,
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
                }
            ]
        });
    }

    async create(data) {
        return await PurchaseInvoice.create(data);
    }

    async update(id, data) {
        const invoice = await PurchaseInvoice.findByPk(id);
        if (!invoice) return null;
        return await invoice.update(data);
    }

    async findByPurchaseOrderId(purchaseOrderId) {
        return await PurchaseInvoice.findOne({ where: { purchase_order_id: purchaseOrderId } });
    }
}

class PurchasePaymentRepository {
    async findAll(filters = {}, limit = 10, offset = 0) {
        const where = {};

        if (filters.purchase_order_id) {
            where.purchase_order_id = filters.purchase_order_id;
        }

        if (filters.payment_method) {
            where.payment_method = filters.payment_method;
        }

        if (filters.search) {
            where[Op.or] = [
                { reference_number: { [Op.like]: `%${filters.search}%` } },
                { '$purchase_order.po_number$': { [Op.like]: `%${filters.search}%` } },
                { '$purchase_order.supplier.name$': { [Op.like]: `%${filters.search}%` } }
            ];
        }

        return await PurchasePayment.findAndCountAll({
            where,
            limit,
            offset,
            subQuery: false,
            include: [
                {
                    model: PurchaseOrder,
                    as: 'purchase_order',
                    include: [
                        {
                            model: require('../suppliers/suppliers.model').Supplier,
                            as: 'supplier',
                            attributes: ['id', 'name', 'email', 'phone', 'contact_person']
                        }
                    ]
                },
                { model: PurchaseInvoice, as: 'invoice' }
            ],
            order: [['created_at', 'DESC']]
        });
    }

    async findById(id) {
        const { Supplier } = require('../suppliers/suppliers.model');
        return await PurchasePayment.findByPk(id, {
            include: [
                {
                    model: PurchaseOrder,
                    as: 'purchase_order',
                    include: [
                        {
                            model: Supplier,
                            as: 'supplier',
                            attributes: ['id', 'name', 'email', 'phone', 'contact_person']
                        }
                    ]
                },
                { model: PurchaseInvoice, as: 'invoice' }
            ]
        });
    }

    async create(data) {
        return await PurchasePayment.create(data);
    }
}

class PurchaseReceiptRepository {
    async create(data) {
        return await PurchaseReceipt.create(data);
    }

    async findAll(filters = {}, limit = 10, offset = 0) {
        const where = {};

        if (filters.purchase_order_id) {
            where.purchase_order_id = filters.purchase_order_id;
        }

        if (filters.status) {
            where.status = filters.status;
        }

        return await PurchaseReceipt.findAndCountAll({
            where,
            limit,
            offset,
            include: [
                {
                    model: PurchaseOrder,
                    as: 'purchase_order'
                }
            ],
            order: [['created_at', 'DESC']]
        });
    }
}

module.exports = {
    PurchaseOrderRepository: new PurchaseOrderRepository(),
    PurchaseInvoiceRepository: new PurchaseInvoiceRepository(),
    PurchasePaymentRepository: new PurchasePaymentRepository(),
    PurchaseReceiptRepository: new PurchaseReceiptRepository()
};
