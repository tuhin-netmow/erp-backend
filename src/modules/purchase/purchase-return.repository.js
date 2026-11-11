const { PurchaseReturn, PurchaseReturnItem, PurchaseReturnInvoice, PurchaseReturnPayment } = require('./purchase-return.models');
const { PurchaseOrder } = require('./purchase.models');
const { Op } = require('sequelize');
const { sequelize } = require('../../core/database/sequelize');

class PurchaseReturnRepository {
    async findAll(filters = {}, limit = 10, offset = 0) {
        limit = Number(limit) || 10;
        offset = Number(offset) || 0;
        const where = {};
        if (filters.status) where.status = filters.status;
        if (filters.supplier_id) where.supplier_id = filters.supplier_id;

        if (filters.search) {
            where[Op.or] = [
                { return_number: { [Op.like]: `%${filters.search}%` } },
                { '$supplier.name$': { [Op.like]: `%${filters.search}%` } }
            ];
        }

        const { PurchaseOrderItem } = require('./purchase.models');
        const { Product } = require('../products/products.model');
        const { Supplier } = require('../suppliers/suppliers.model');

        return await PurchaseReturn.findAndCountAll({
            attributes: {
                include: [
                    [
                        sequelize.literal(`(
                            SELECT COALESCE(SUM(prp.amount), 0)
                            FROM purchase_return_payments AS prp
                            WHERE prp.purchase_return_id = PurchaseReturn.id
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
                    model: PurchaseReturnItem,
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
                    model: Supplier,
                    as: 'supplier',
                    attributes: ['id', 'name', 'email', 'phone', 'contact_person']
                },
                {
                    model: PurchaseOrder,
                    as: 'purchase_order',
                    attributes: ['id', 'po_number', 'order_date', 'total_amount', 'status'],
                    include: [
                        {
                            model: Supplier,
                            as: 'supplier',
                            attributes: ['id', 'name', 'email', 'phone']
                        },
                        {
                            model: PurchaseOrderItem,
                            as: 'items',
                            include: [
                                {
                                    model: Product,
                                    as: 'product',
                                    attributes: ['id', 'name', 'sku', 'price', 'specification']
                                }
                            ]
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
        const { Supplier } = require('../suppliers/suppliers.model');
        const { Product } = require('../products/products.model');

        return await PurchaseReturn.findByPk(id, {
            include: [
                {
                    model: Supplier,
                    as: 'supplier',
                    attributes: ['id', 'name', 'email', 'phone', 'contact_person', 'address', 'city']
                },
                {
                    model: PurchaseReturnItem,
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
                    model: PurchaseReturnInvoice,
                    as: 'invoice',
                    include: [
                        {
                            model: PurchaseReturnPayment,
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
                    model: PurchaseReturnPayment,
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
                    model: PurchaseOrder,
                    as: 'purchase_order',
                    attributes: ['id', 'po_number', 'total_amount']
                }
            ]
        });
    }

    async findByIdSimple(id) {
        return await PurchaseReturn.findByPk(id);
    }

    async create(returnData, itemsData) {
        const transaction = await sequelize.transaction();
        try {
            const pr = await PurchaseReturn.create(returnData, { transaction });

            const items = itemsData.map(item => ({
                ...item,
                purchase_return_id: pr.id
            }));

            if (items.length > 0) {
                await PurchaseReturnItem.bulkCreate(items, { transaction });
            }

            await transaction.commit();
            return await this.findById(pr.id);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async update(id, data) {
        const pr = await PurchaseReturn.findByPk(id);
        if (!pr) return null;
        return await pr.update(data);
    }

    async delete(id) {
        const pr = await PurchaseReturn.findByPk(id);
        if (!pr) return null;
        await pr.destroy();
        return pr;
    }
}

class PurchaseReturnInvoiceRepository {
    async findAll(filters = {}, limit = 10, offset = 0) {
        limit = Number(limit) || 10;
        offset = Number(offset) || 0;
        const where = {};
        if (filters.status) where.status = filters.status;
        if (filters.supplier_id) {
            where['$purchase_return.supplier_id$'] = filters.supplier_id;
        }

        if (filters.search) {
            where[Op.or] = [
                { invoice_number: { [Op.like]: `%${filters.search}%` } }
            ];
        }

        return await PurchaseReturnInvoice.findAndCountAll({
            where,
            limit,
            offset,
            include: [
                {
                    model: PurchaseReturn,
                    as: 'purchase_return',
                    include: [
                        {
                            model: require('../suppliers/suppliers.model').Supplier,
                            as: 'supplier',
                            attributes: ['id', 'name']
                        }
                    ]
                }
            ],
            order: [['created_at', 'DESC']]
        });
    }

    async findById(id) {
        return await PurchaseReturnInvoice.findByPk(id, {
            include: [
                {
                    model: PurchaseReturn,
                    as: 'purchase_return',
                    include: [
                        {
                            model: require('../suppliers/suppliers.model').Supplier,
                            as: 'supplier'
                        },
                        {
                            model: PurchaseReturnItem,
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
                    model: PurchaseReturnPayment,
                    as: 'payments'
                }
            ]
        });
    }

    async create(data) {
        return await PurchaseReturnInvoice.create(data);
    }

    async update(id, data) {
        const invoice = await PurchaseReturnInvoice.findByPk(id);
        if (!invoice) return null;
        return await invoice.update(data);
    }

    async findByPurchaseReturnId(purchaseReturnId) {
        return await PurchaseReturnInvoice.findOne({ where: { purchase_return_id: purchaseReturnId } });
    }
}

class PurchaseReturnPaymentRepository {
    async findAll(filters = {}, limit = 10, offset = 0) {
        limit = Number(limit) || 10;
        offset = Number(offset) || 0;
        const where = {};
        if (filters.purchase_return_id) where.purchase_return_id = filters.purchase_return_id;
        if (filters.payment_method) where.payment_method = filters.payment_method;

        if (filters.search) {
            where[Op.or] = [
                { reference_number: { [Op.like]: `%${filters.search}%` } }
            ];
        }

        return await PurchaseReturnPayment.findAndCountAll({
            where,
            limit,
            offset,
            include: [
                {
                    model: PurchaseReturn,
                    as: 'purchase_return',
                    include: [
                        {
                            model: require('../suppliers/suppliers.model').Supplier,
                            as: 'supplier',
                            attributes: ['id', 'name']
                        }
                    ]
                },
                { model: PurchaseReturnInvoice, as: 'invoice' }
            ],
            order: [['created_at', 'DESC']]
        });
    }

    async findById(id) {
        return await PurchaseReturnPayment.findByPk(id, {
            include: [
                {
                    model: PurchaseReturn,
                    as: 'purchase_return',
                    include: [
                        {
                            model: require('../suppliers/suppliers.model').Supplier,
                            as: 'supplier'
                        }
                    ]
                },
                { model: PurchaseReturnInvoice, as: 'invoice' }
            ]
        });
    }

    async create(data) {
        return await PurchaseReturnPayment.create(data);
    }
}

module.exports = {
    PurchaseReturnRepository: new PurchaseReturnRepository(),
    PurchaseReturnInvoiceRepository: new PurchaseReturnInvoiceRepository(),
    PurchaseReturnPaymentRepository: new PurchaseReturnPaymentRepository()
};
