const { Customer, CustomerImage, CustomerContact } = require('./customers.model');
const { Op } = require('sequelize');
const { sequelize } = require('../../core/database/sequelize');

class CustomerRepository {
    async findAll(filters = {}, limit = 10, offset = 0) {
        const where = {};

        if (filters.customer_type) {
            where.customer_type = filters.customer_type;
        }

        if (filters.is_active !== undefined) {
            where.is_active = filters.is_active;
        }

        if (filters.search) {
            const allowedFilterFields = ['name', 'company', 'phone', 'address'];
            if (filters.filter_by && allowedFilterFields.includes(filters.filter_by)) {
                where[filters.filter_by] = { [Op.like]: `%${filters.search}%` };
            } else {
                where[Op.or] = [
                    { name: { [Op.like]: `%${filters.search}%` } },
                    { email: { [Op.like]: `%${filters.search}%` } },
                    { phone: { [Op.like]: `%${filters.search}%` } },
                    { company: { [Op.like]: `%${filters.search}%` } },
                    { address: { [Op.like]: `%${filters.search}%` } }
                ];
            }
        }

        let order = [['created_at', 'DESC']];

        if (filters.sort === 'top_sold') {
            order = [[sequelize.literal('total_sales'), 'DESC']];
        } else if (filters.sort === 'low_sold') {
            order = [[sequelize.literal('total_sales'), 'ASC']];
        }

        return await Customer.findAndCountAll({
            where,
            attributes: {
                include: [
                    [
                        sequelize.literal(`(
                            SELECT COALESCE(SUM(total_amount - COALESCE(discount_amount, 0) + COALESCE(tax_amount, 0)), 0)
                            FROM orders AS o
                            WHERE o.customer_id = Customer.id
                            AND o.status != 'cancelled'
                        )`),
                        'total_sales'
                    ],
                    [
                        sequelize.literal(`(
                            SELECT COALESCE(SUM(total_amount - COALESCE(discount_amount, 0) + COALESCE(tax_amount, 0)), 0)
                            FROM orders AS o
                            WHERE o.customer_id = Customer.id
                            AND o.status != 'cancelled'
                        )`),
                        'purchase_amount'
                    ],
                    [
                        sequelize.literal(`(
                            SELECT COALESCE(SUM(p.amount), 0)
                            FROM payments AS p
                            INNER JOIN orders AS o ON p.order_id = o.id
                            WHERE o.customer_id = Customer.id
                            AND p.status = 'completed'
                        )`),
                        'paid_amount'
                    ],
                    [
                        sequelize.literal(`(
                            (SELECT COALESCE(SUM(total_amount - COALESCE(discount_amount, 0) + COALESCE(tax_amount, 0)), 0)
                            FROM orders AS o
                            WHERE o.customer_id = Customer.id
                            AND o.status != 'cancelled')
                            -
                            (SELECT COALESCE(SUM(p.amount), 0)
                            FROM payments AS p
                            INNER JOIN orders AS o ON p.order_id = o.id
                            WHERE o.customer_id = Customer.id
                            AND p.status = 'completed')
                        )`),
                        'due_amount'
                    ],
                    [
                        sequelize.literal(`(
                            SELECT COALESCE(SUM(COALESCE(discount_amount, 0)), 0)
                            FROM orders AS o
                            WHERE o.customer_id = Customer.id
                            AND o.status != 'cancelled'
                        )`),
                        'total_discount'
                    ]
                ]
            },
            include: [
                {
                    model: CustomerImage,
                    as: 'images',
                    attributes: ['image_url']
                },
                {
                    model: CustomerContact,
                    as: 'contacts',
                    attributes: ['id', 'name', 'phone', 'role', 'email', 'is_primary']
                },
                {
                    model: require('../users/user.model').User,
                    as: 'creator',
                    attributes: ['id', 'name', 'email', 'thumb_url']
                }
            ],
            limit,
            offset,
            distinct: true, // Fix for correct pagination count with includes
            order
        });
    }

    async findById(id) {
        return await Customer.findByPk(id, {
            attributes: {
                include: [
                    [
                        sequelize.literal(`(
                            SELECT COALESCE(SUM(total_amount - COALESCE(discount_amount, 0) + COALESCE(tax_amount, 0)), 0)
                            FROM orders AS o
                            WHERE o.customer_id = Customer.id
                            AND o.status != 'cancelled'
                        )`),
                        'total_sales'
                    ],
                    [
                        sequelize.literal(`(
                            SELECT COALESCE(SUM(total_amount - COALESCE(discount_amount, 0) + COALESCE(tax_amount, 0)), 0)
                            FROM orders AS o
                            WHERE o.customer_id = Customer.id
                            AND o.status != 'cancelled'
                        )`),
                        'purchase_amount'
                    ],
                    [
                        sequelize.literal(`(
                            SELECT COALESCE(SUM(p.amount), 0)
                            FROM payments AS p
                            INNER JOIN orders AS o ON p.order_id = o.id
                            WHERE o.customer_id = Customer.id
                            AND p.status = 'completed'
                        )`),
                        'paid_amount'
                    ],
                    [
                        sequelize.literal(`(
                            (SELECT COALESCE(SUM(total_amount - COALESCE(discount_amount, 0) + COALESCE(tax_amount, 0)), 0)
                            FROM orders AS o
                            WHERE o.customer_id = Customer.id
                            AND o.status != 'cancelled')
                            -
                            (SELECT COALESCE(SUM(p.amount), 0)
                            FROM payments AS p
                            INNER JOIN orders AS o ON p.order_id = o.id
                            WHERE o.customer_id = Customer.id
                            AND p.status = 'completed')
                        )`),
                        'due_amount'
                    ],
                    [
                        sequelize.literal(`(
                            SELECT COALESCE(SUM(COALESCE(discount_amount, 0)), 0)
                            FROM orders AS o
                            WHERE o.customer_id = Customer.id
                            AND o.status != 'cancelled'
                        )`),
                        'total_discount'
                    ]
                ]
            },
            include: [
                {
                    model: CustomerImage,
                    as: 'images',
                    attributes: ['id', 'image_url', 'is_primary', 'sort_order', 'caption']
                },
                {
                    model: CustomerContact,
                    as: 'contacts',
                    attributes: ['id', 'name', 'phone', 'role', 'email', 'is_primary']
                },
                {
                    model: require('../users/user.model').User,
                    as: 'creator',
                    attributes: ['id', 'name', 'email', 'thumb_url']
                }
            ]
        });
    }

    async findByEmail(email) {
        return await Customer.findOne({ where: { email } });
    }

    async create(data) {
        const transaction = await sequelize.transaction();
        try {
            const { images, contacts, ...customerData } = data;
            const customer = await Customer.create(customerData, { transaction });

            if (images && images.length > 0) {
                const imageRecords = images.map((img, index) => ({
                    customer_id: customer.id,
                    image_url: img.image_url,
                    is_primary: img.is_primary || false,
                    sort_order: img.sort_order || index,
                    caption: img.caption
                }));
                await CustomerImage.bulkCreate(imageRecords, { transaction });
            }

            if (contacts && contacts.length > 0) {
                const contactRecords = contacts.map(contact => ({
                    customer_id: customer.id,
                    name: contact.name,
                    phone: contact.phone,
                    role: contact.role,
                    email: contact.email,
                    is_primary: contact.is_primary || false
                }));
                await CustomerContact.bulkCreate(contactRecords, { transaction });
            }

            await transaction.commit();
            return await this.findById(customer.id);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async update(id, data) {
        const transaction = await sequelize.transaction();
        try {
            const customer = await Customer.findByPk(id);
            if (!customer) {
                await transaction.commit();
                return null;
            }

            const { images, contacts, ...customerData } = data;
            await customer.update(customerData, { transaction });

            if (images !== undefined) {
                // Delete existing images
                await CustomerImage.destroy({
                    where: { customer_id: id },
                    transaction
                });

                // Create new images
                if (images && images.length > 0) {
                    const imageRecords = images.map((img, index) => ({
                        customer_id: id,
                        image_url: img.image_url,
                        is_primary: img.is_primary || false,
                        sort_order: img.sort_order || index,
                        caption: img.caption
                    }));
                    await CustomerImage.bulkCreate(imageRecords, { transaction });
                }
            }

            if (contacts !== undefined) {
                // Delete existing contacts
                await CustomerContact.destroy({
                    where: { customer_id: id },
                    transaction
                });

                // Create new contacts
                if (contacts && contacts.length > 0) {
                    const contactRecords = contacts.map(contact => ({
                        customer_id: id,
                        name: contact.name,
                        phone: contact.phone,
                        role: contact.role,
                        email: contact.email,
                        is_primary: contact.is_primary || false
                    }));
                    await CustomerContact.bulkCreate(contactRecords, { transaction });
                }
            }

            await transaction.commit();
            return await this.findById(id);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async delete(id) {
        const customer = await Customer.findByPk(id);
        if (!customer) return null;
        await customer.destroy();
        return customer;
    }

    async findCustomersWithLocation(filters = {}) {
        const where = {
            latitude: { [Op.ne]: null },
            longitude: { [Op.ne]: null },
            is_active: true
        };

        // Add country filter if provided
        if (filters.country) {
            where.country = filters.country;
        }

        return await Customer.findAll({
            where,
            attributes: ['id', 'name', 'company', 'address', 'city', 'country', 'latitude', 'longitude', 'phone', 'email']
        });
    }

    async getStats() {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [activeCustomers, totalCustomers, newCustomers, inactiveCustomers, financialResult] = await Promise.all([
            // Active Customers
            Customer.count({ where: { is_active: true } }),

            // Total Customers
            Customer.count(),

            // New Customers (This Month)
            Customer.count({
                where: {
                    created_at: {
                        [Op.gte]: startOfMonth
                    }
                }
            }),

            // Inactive Customers
            Customer.count({ where: { is_active: false } }),

            // Financial Totals
            sequelize.query(
                `SELECT 
                    (SELECT COALESCE(SUM(total_amount - COALESCE(discount_amount, 0) + COALESCE(tax_amount, 0)), 0) FROM orders WHERE status != 'cancelled') as totalSales,
                    (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed') as totalPaid,
                    (SELECT COALESCE(SUM(outstanding_balance), 0) FROM customers) as totalDue`,
                { type: sequelize.QueryTypes.SELECT }
            )
        ]);

        const financial = financialResult[0] || { totalSales: 0, totalPaid: 0, totalDue: 0 };

        return {
            activeCustomers,
            totalCustomers,
            newCustomers,
            inactiveCustomers,
            totalSales: parseFloat(financial.totalSales),
            totalPaid: parseFloat(financial.totalPaid),
            totalDue: parseFloat(financial.totalDue)
        };
    }
}

module.exports = new CustomerRepository();
