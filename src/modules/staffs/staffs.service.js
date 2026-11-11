const StaffRepository = require('./staffs.repository');
const bcrypt = require('bcrypt');

class StaffService {
    async getAllStaffs(filters = {}, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const result = await StaffRepository.findAll(filters, limit, offset);
        return {
            data: result.rows,
            total: result.count
        };
    }

    async getStaffById(id) {
        const staff = await StaffRepository.findById(id);
        if (!staff) {
            throw new Error('Staff not found');
        }
        return staff;
    }

    async createStaff(data, userId) {
        if (data.email) {
            const existing = await StaffRepository.findByEmail(data.email);
            if (existing) {
                throw new Error('Staff with this email already exists');
            }
        }

        // Hash password if provided, or generate default
        if (data.password) {
            data.password = await bcrypt.hash(data.password, 10);
        } else {
            // Generate a random password if not provided, to satisfy User model constraint
            const randomPass = Math.random().toString(36).slice(-8);
            data.password = await bcrypt.hash(randomPass, 10);
            // Optional: You might want to email this password to the user, but for now we just satisfy the DB constraint.
        }

        // Sanitize data: convert empty strings to null
        const cleanData = { ...data };
        ['hire_date', 'thumb_url', 'position', 'phone', 'address', 'city', 'state', 'country', 'postal_code', 'notes'].forEach(field => {
            if (cleanData[field] === '') {
                cleanData[field] = null;
            }
        });

        return await StaffRepository.create({ ...cleanData, created_by: userId });
    }

    async updateStaff(id, data) {
        if (data.email) {
            const existing = await StaffRepository.findByEmail(data.email);
            if (existing && existing.id !== parseInt(id)) {
                throw new Error('Staff with this email already exists');
            }
        }

        // Hash password if provided
        if (data.password) {
            data.password = await bcrypt.hash(data.password, 10);
        }

        // Sanitize data: convert empty strings to null
        const cleanData = { ...data };
        ['hire_date', 'thumb_url', 'position', 'phone', 'address', 'city', 'state', 'country', 'postal_code', 'notes'].forEach(field => {
            if (cleanData[field] === '') {
                cleanData[field] = null;
            }
        });

        const staff = await StaffRepository.update(id, cleanData);
        if (!staff) {
            throw new Error('Staff not found');
        }
        return staff;
    }

    async deleteStaff(id) {
        const staff = await StaffRepository.delete(id);
        if (!staff) {
            throw new Error('Staff not found');
        }
        return staff;
    }

    async getStaffsWithRoutes(filters = {}, page = 1, limit = 10) {
        // Use SalesRouteRepository to fetch staff with deep inclusions
        // We might need to adjust filters to pass 'search' correctly if needed
        const result = await require('../sales/salesroute.repository').getStaffRoutes(filters, limit, (page - 1) * limit);

        const formattedData = result.rows.map(staff => {
            const routes = staff.assignedRoutes || [];

            // Calculate aggregations
            let completedOrdersCount = 0;

            const formattedRoutes = routes.map(route => {
                const customers = route.customers || [];
                let routeOrderCount = 0;
                let routeCompletedOrders = 0;

                customers.forEach(customer => {
                    const orders = customer.orders || [];
                    routeOrderCount += orders.length;

                    const completed = orders.filter(o => ['delivered', 'completed', 'shipped'].includes(o.status)).length;
                    routeCompletedOrders += completed;
                });

                completedOrdersCount += routeCompletedOrders;

                return {
                    id: route.id,
                    name: route.route_name,
                    status: route.is_active ? 'Active' : 'Pending', // Mapping boolean to string status
                    orders: routeOrderCount
                };
            });

            return {
                id: staff.id,
                name: staff.name || `${staff.first_name || ''} ${staff.last_name || ''}`.trim(),
                role: staff.position || 'Staff',
                email: staff.email,
                phone: staff.phone,
                thumb_url: staff.thumb_url || null,
                active: staff.status === 'active',
                routes: formattedRoutes,
                stats: {
                    completedOrders: completedOrdersCount,
                    rating: 4.5 // Placeholder as rating system is not implemented yet
                }
            };
        });

        return {
            data: formattedData,
            total: result.count
        };
    }
}

module.exports = new StaffService();
