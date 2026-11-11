const { Supplier } = require('./suppliers.model');
const { Op } = require('sequelize');

const { sequelize } = require('../../core/database/sequelize');

class SupplierRepository {
    async findAll(filters = {}, limit = 10, offset = 0) {
        const where = {};

        if (filters.is_active !== undefined) {
            where.is_active = filters.is_active;
        }

        if (filters.search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${filters.search}%` } },
                { code: { [Op.like]: `%${filters.search}%` } },
                { email: { [Op.like]: `%${filters.search}%` } },
                { contact_person: { [Op.like]: `%${filters.search}%` } }
            ];
        }

        let order = [['created_at', 'DESC']];

        if (filters.sort === 'top_purchase') {
            order = [[sequelize.literal('total_purchase_amount'), 'DESC']];
        } else if (filters.sort === 'low_purchase') {
            order = [[sequelize.literal('total_purchase_amount'), 'ASC']];
        }

        return await Supplier.findAndCountAll({
            where,
            attributes: {
                include: [
                    [
                        sequelize.literal(`(
                            SELECT COALESCE(SUM(total_amount - COALESCE(discount_amount, 0) + COALESCE(tax_amount, 0)), 0)
                            FROM purchase_orders AS po
                            WHERE po.supplier_id = Supplier.id
                            AND po.status != 'cancelled'
                        )`),
                        'total_purchase_amount'
                    ],
                    [
                        sequelize.literal(`(
                            SELECT COALESCE(SUM(pp.amount), 0)
                            FROM purchase_payments AS pp
                            INNER JOIN purchase_orders AS po ON po.id = pp.purchase_order_id
                            WHERE po.supplier_id = Supplier.id
                            AND pp.status = 'completed'
                        )`),
                        'total_paid_amount'
                    ],
                    [
                        sequelize.literal(`(
                            (SELECT COALESCE(SUM(total_amount - COALESCE(discount_amount, 0) + COALESCE(tax_amount, 0)), 0)
                            FROM purchase_orders AS po
                            WHERE po.supplier_id = Supplier.id
                            AND po.status != 'cancelled')
                            -
                            (SELECT COALESCE(SUM(pp.amount), 0)
                            FROM purchase_payments AS pp
                            INNER JOIN purchase_orders AS po ON po.id = pp.purchase_order_id
                            WHERE po.supplier_id = Supplier.id
                            AND pp.status = 'completed')
                        )`),
                        'total_due_amount'
                    ]
                ]
            },
            limit,
            offset,
            order
        });
    }

    async findById(id) {
        return await Supplier.findByPk(id);
    }

    async findByEmail(email) {
        return await Supplier.findOne({ where: { email } });
    }

    async findByCode(code) {
        return await Supplier.findOne({ where: { code } });
    }

    async create(data) {
        return await Supplier.create(data);
    }

    async update(id, data) {
        const supplier = await Supplier.findByPk(id);
        if (!supplier) return null;
        return await supplier.update(data);
    }

    async delete(id) {
        const supplier = await Supplier.findByPk(id);
        if (!supplier) return null;
        await supplier.destroy();
        return supplier;
    }

    async findSuppliersWithLocation() {
        return await Supplier.findAll({
            where: {
                latitude: { [Op.ne]: null },
                longitude: { [Op.ne]: null },
                is_active: true
            },
            attributes: ['id', 'name', 'contact_person', 'address', 'city', 'latitude', 'longitude', 'phone', 'email']
        });
    }

    async getStats() {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [activeSuppliers, totalSuppliers, newSuppliers, inactiveSuppliers, financialResult] = await Promise.all([
            // Active Suppliers
            Supplier.count({ where: { is_active: true } }),

            // Total Suppliers
            Supplier.count(),

            // New Suppliers (This Month)
            Supplier.count({
                where: {
                    created_at: {
                        [Op.gte]: startOfMonth
                    }
                }
            }),

            // Inactive Suppliers
            Supplier.count({ where: { is_active: false } }),

            // Financial Totals
            sequelize.query(
                `SELECT 
                    (SELECT COALESCE(SUM(total_amount - COALESCE(discount_amount, 0) + COALESCE(tax_amount, 0)), 0) FROM purchase_orders WHERE status != 'cancelled') as totalPurchase,
                    (SELECT COALESCE(SUM(amount), 0) FROM purchase_payments WHERE status = 'completed') as totalPaid,
                    ((SELECT COALESCE(SUM(total_amount - COALESCE(discount_amount, 0) + COALESCE(tax_amount, 0)), 0) FROM purchase_orders WHERE status != 'cancelled') - 
                     (SELECT COALESCE(SUM(amount), 0) FROM purchase_payments WHERE status = 'completed')) as totalDue`,
                { type: sequelize.QueryTypes.SELECT }
            )
        ]);

        const financial = financialResult[0] || { totalPurchase: 0, totalPaid: 0, totalDue: 0 };

        return {
            activeSuppliers,
            totalSuppliers,
            newSuppliers,
            inactiveSuppliers,
            totalPurchase: parseFloat(financial.totalPurchase),
            totalPaid: parseFloat(financial.totalPaid),
            totalDue: parseFloat(financial.totalDue)
        };
    }
}

module.exports = new SupplierRepository();
