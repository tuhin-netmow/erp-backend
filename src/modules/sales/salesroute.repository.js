const { SalesRoute, SalesRouteStaff, Order, OrderItem } = require('./sales.models');
const { Customer } = require('../customers/customers.model');
const { Product } = require('../products/products.model');
const { Staff } = require('../staffs/staffs.model');
const { Op } = require('sequelize');
const { sequelize } = require('../../core/database/sequelize');

class SalesRouteRepository {
    async findAll(filters = {}, limit = 10, offset = 0) {
        const where = {};

        if (filters.is_active !== undefined) {
            where.is_active = filters.is_active;
        }

        if (filters.search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${filters.search}%` } },
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

    async findById(id) {
        return await SalesRoute.findByPk(id, {
            include: [
                {
                    model: Customer,
                    as: 'customers',
                    include: [
                        {
                            model: Order,
                            as: 'orders',
                            include: [
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
                                }
                            ]
                        }
                    ]
                },
                {
                    model: Staff,
                    as: 'assignedStaffMembers',
                    attributes: ['id', 'first_name', 'last_name', 'email', 'position', 'thumb_url'],
                    through: {
                        attributes: ['assigned_at', 'assigned_by']
                    }
                }
            ]
        });
    }

    async create(data) {
        return await SalesRoute.create(data);
    }

    async update(id, data) {
        const route = await SalesRoute.findByPk(id);
        if (!route) return null;
        return await route.update(data);
    }

    async delete(id) {
        const route = await SalesRoute.findByPk(id);
        if (!route) return null;
        await route.destroy();
        return route;
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
                // strict check: ensure all staffIds are valid numbers
                const validStaffIds = staffIds.map(id => parseInt(id)).filter(id => !isNaN(id) && id > 0);

                if (validStaffIds.length !== staffIds.length) {
                    throw new Error('Staff IDs must be positive numbers');
                }

                // Verify ONLY staff members exist
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
                    throw new Error(`Invalid Staff IDs: ${missingIds.join(', ')}. Please verify these staff members exist.`);
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

            // Fetch and return the updated route with assigned staff
            return await SalesRoute.findByPk(routeId, {
                include: [
                    {
                        model: Staff,
                        as: 'assignedStaffMembers',
                        attributes: ['id', 'first_name', 'last_name', 'email', 'position', 'thumb_url'],
                        through: {
                            attributes: ['assigned_at', 'assigned_by']
                        }
                    }
                ]
            });
        } catch (error) {
            // Only rollback if transaction is not fully finished
            if (!transaction.finished) {
                await transaction.rollback();
            }

            // Handle specific FK error just in case validation passes but DB fails
            if (error.name === 'SequelizeForeignKeyConstraintError') {
                throw new Error('Foreign key violation: Invalid Staff ID or Route ID');
            }
            throw error;
        }
    }
    async getAssignedStaff(routeId) {
        return await SalesRoute.findByPk(routeId, {
            include: [
                {
                    model: Staff,
                    as: 'assignedStaffMembers',
                    attributes: ['id', 'first_name', 'last_name', 'email', 'position', 'thumb_url'],
                    through: {
                        attributes: ['assigned_at', 'assigned_by']
                    }
                }
            ]
        });
    }

    async getStaffRoutes(filters = {}, limit = 10, offset = 0) {
        const where = {};
        if (filters.search) {
            where[Op.or] = [
                { first_name: { [Op.like]: `%${filters.search}%` } },
                { last_name: { [Op.like]: `%${filters.search}%` } },
                { email: { [Op.like]: `%${filters.search}%` } }
            ];
        }

        // We fetch Staff primarily, and include their routes
        return await Staff.findAndCountAll({
            where,
            include: [
                {
                    model: SalesRoute,
                    as: 'assignedRoutes', // Ensure this alias matches Staff model definition
                    through: { attributes: [] }, // Hide junction table attributes
                    include: [
                        {
                            model: Customer,
                            as: 'customers',
                            attributes: ['id'],
                            include: [
                                {
                                    model: Order,
                                    as: 'orders',
                                    attributes: ['id', 'status', 'total_amount']
                                }
                            ]
                        }
                    ]
                }
            ],
            limit,
            offset,
            distinct: true // Important for correct count with includes
        });
    }

    async getStaffRoutesForCheckIn(staffId) {
        const salesRoutes = await SalesRoute.findAll({
            where: {
                is_active: true
            },
            include: [
                {
                    model: Staff,
                    as: 'assignedStaffMembers',
                    where: { id: staffId },
                    required: true,
                    through: { attributes: [] },
                    attributes: []
                },
                {
                    model: Customer,
                    as: 'customers',
                    where: {
                        is_active: true
                    },
                    required: false,
                    attributes: [
                        'id',
                        'name',
                        'company',
                        'address',
                        'latitude',
                        'longitude',
                        'phone',
                        'email',
                        'image_url',
                        'sales_route_id'
                    ]
                }
            ],
            order: [
                ['route_name', 'ASC'],
                [{ model: Customer, as: 'customers' }, 'name', 'ASC']
            ]
        });


     

        return salesRoutes;


    }



}

module.exports = new SalesRouteRepository();
