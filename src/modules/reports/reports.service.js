const { sequelize } = require('../../core/database/sequelize');
const { QueryTypes } = require('sequelize');
const { Order, OrderItem } = require('../sales/sales.models');
const { PurchaseOrder } = require('../purchase/purchase.models');
const { Product } = require('../products/products.model');
const { Staff } = require('../staffs/staffs.model');
const { Attendance } = require('../attendance/attendance.model');
const { Payroll } = require('../payroll/payroll.models');
const { Transaction } = require('../accounting/accounting.models');

class ReportService {
    // Helper to format dates for SQL
    _getDateRange(startDate, endDate) {
        return {
            start: startDate || '1970-01-01',
            end: endDate || new Date().toISOString().split('T')[0]
        };
    }

    // --- Sales Reports ---
    async getSalesSummary(startDate, endDate) {
        const { start, end } = this._getDateRange(startDate, endDate);

        // Main summary query with proper DATE filtering
        const summarySql = `
            SELECT 
                COUNT(*) as total_orders,
                COALESCE(SUM(total_amount), 0) as total_sales,
                COALESCE(AVG(total_amount), 0) as average_order_value,
                COALESCE(SUM(tax_amount), 0) as total_tax,
                COALESCE(SUM(discount_amount), 0) as total_discount
            FROM orders
            WHERE DATE(order_date) BETWEEN :start AND :end
        `;

        const summaryResult = await sequelize.query(summarySql, {
            replacements: { start, end },
            type: QueryTypes.SELECT
        });

        // Status breakdown query
        const statusSql = `
            SELECT 
                status,
                COUNT(*) as count,
                COALESCE(SUM(total_amount), 0) as amount
            FROM orders
            WHERE DATE(order_date) BETWEEN :start AND :end
            GROUP BY status
            ORDER BY amount DESC
        `;

        const statusBreakdown = await sequelize.query(statusSql, {
            replacements: { start, end },
            type: QueryTypes.SELECT
        });

        // Payment status breakdown query
        const paymentStatusSql = `
            SELECT 
                payment_status,
                COUNT(*) as count,
                COALESCE(SUM(total_amount), 0) as amount
            FROM orders
            WHERE DATE(order_date) BETWEEN :start AND :end
            GROUP BY payment_status
            ORDER BY amount DESC
        `;

        const paymentStatusBreakdown = await sequelize.query(paymentStatusSql, {
            replacements: { start, end },
            type: QueryTypes.SELECT
        });

        return {
            start_date: start,
            end_date: end,
            summary: {
                total_orders: parseInt(summaryResult[0].total_orders) || 0,
                total_sales: parseFloat(summaryResult[0].total_sales) || 0,
                average_order_value: parseFloat(summaryResult[0].average_order_value) || 0,
                total_tax: parseFloat(summaryResult[0].total_tax) || 0,
                total_discount: parseFloat(summaryResult[0].total_discount) || 0
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

    async getTopCustomers(startDate, endDate, limit = 5) {
        const { start, end } = this._getDateRange(startDate, endDate);

        const sql = `
            SELECT
                c.id, c.name, c.email, c.company,
                COUNT(o.id) as order_count,
                SUM(o.total_amount) as total_spent
            FROM orders o
            JOIN customers c ON o.customer_id = c.id
            WHERE o.order_date BETWEEN :start AND :end
            AND o.status != 'cancelled'
            GROUP BY c.id
            ORDER BY total_spent DESC
            LIMIT :limit
        `;

        return await sequelize.query(sql, {
            replacements: { start, end, limit },
            type: QueryTypes.SELECT
        });
    }

    async getTopProducts(startDate, endDate, limit = 5) {
        const { start, end } = this._getDateRange(startDate, endDate);

        const sql = `
            SELECT
                p.id, p.name, p.sku, p.specification,
                SUM(oi.quantity) as total_quantity_sold,
                SUM(oi.total_price) as total_revenue
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN products p ON oi.product_id = p.id
            WHERE o.order_date BETWEEN :start AND :end
            AND o.status != 'cancelled'
            GROUP BY p.id
            ORDER BY total_quantity_sold DESC
            LIMIT :limit
        `;

        return await sequelize.query(sql, {
            replacements: { start, end, limit },
            type: QueryTypes.SELECT
        });
    }

    async getSalesByCustomer(startDate, endDate, page = 1, limit = 10, search = null) {
        const { start, end } = this._getDateRange(startDate, endDate);
        const offset = (page - 1) * limit;

        // Build WHERE clause for search
        let searchCondition = '';
        if (search) {
            searchCondition = `WHERE c.name LIKE :search`;
        }

        const sql = `
            SELECT
                c.name as customer,
                c.company,
                COUNT(o.id) as orders,
                COALESCE(SUM(o.total_amount), 0) as sales
            FROM customers c
            LEFT JOIN orders o ON c.id = o.customer_id
                AND DATE(o.order_date) BETWEEN :start AND :end
                AND o.status != 'cancelled'
            ${searchCondition}
            GROUP BY c.id, c.name
            ORDER BY sales DESC
            LIMIT :limit OFFSET :offset
        `;

        const countSql = `
            SELECT COUNT(*) as total 
            FROM customers c
            ${searchCondition}
        `;

        const replacements = {
            start,
            end,
            limit,
            offset,
            ...(search && { search: `%${search}%` })
        };

        const rows = await sequelize.query(sql, {
            replacements,
            type: QueryTypes.SELECT
        });

        const countResult = await sequelize.query(countSql, {
            replacements: search ? { search: `%${search}%` } : {},
            type: QueryTypes.SELECT
        });

        return {
            rows,
            total: countResult[0].total
        };
    }

    async getAccountReceivables(startDate, endDate, page = 1, limit = 10, search = null) {
        const { start, end } = this._getDateRange(startDate, endDate);
        const offset = (page - 1) * limit;

        // Build WHERE clause
        let whereConditions = [
            'o.payment_status != \'paid\'',
            'o.status != \'cancelled\'',
            'DATE(o.order_date) BETWEEN :start AND :end'
        ];

        if (search) {
            whereConditions.push('c.name LIKE :search');
        }

        const whereClause = whereConditions.join(' AND ');

        const sql = `
            SELECT
                COALESCE(i.invoice_number, o.order_number) as invoiceNumber,
                c.name as customer,
                c.company,
                DATE_FORMAT(o.order_date, '%Y-%m-%d') as date,
                DATE_FORMAT(COALESCE(i.due_date, o.due_date, o.created_at), '%Y-%m-%d') as due,
                o.total_amount as total,
                COALESCE(SUM(p.amount), 0) as paid,
                (o.total_amount - COALESCE(SUM(p.amount), 0)) as balance
            FROM orders o
            JOIN customers c ON o.customer_id = c.id
            LEFT JOIN invoices i ON o.id = i.order_id
            LEFT JOIN payments p ON o.id = p.order_id
            WHERE ${whereClause}
            GROUP BY o.id, c.name, i.invoice_number, o.order_number, o.order_date, i.due_date, o.due_date, o.created_at, o.total_amount
            HAVING balance > 0
            ORDER BY o.order_date DESC
            LIMIT :limit OFFSET :offset
        `;

        const countSql = `
            SELECT COUNT(*) as total FROM (
                SELECT o.id
                FROM orders o
                JOIN customers c ON o.customer_id = c.id
                LEFT JOIN payments p ON o.id = p.order_id
                WHERE ${whereClause}
                GROUP BY o.id, o.total_amount
                HAVING (o.total_amount - COALESCE(SUM(p.amount), 0)) > 0
            ) as count_table
        `;

        const replacements = {
            start,
            end,
            limit,
            offset,
            ...(search && { search: `%${search}%` })
        };

        const rows = await sequelize.query(sql, {
            replacements,
            type: QueryTypes.SELECT
        });

        const countReplacements = {
            start,
            end,
            ...(search && { search: `%${search}%` })
        };

        const countResult = await sequelize.query(countSql, {
            replacements: countReplacements,
            type: QueryTypes.SELECT
        });

        // Ensure numeric values are numbers
        const formattedRows = rows.map(row => ({
            ...row,
            total: parseFloat(row.total),
            paid: parseFloat(row.paid),
            balance: parseFloat(row.balance)
        }));

        return {
            rows: formattedRows,
            total: countResult[0].total
        };
    }



    async getCustomerStatistics() {
        // Total customers count
        const customersSql = `
            SELECT COUNT(*) as count
            FROM customers 
            WHERE is_active = true
        `;
        const customerResult = await sequelize.query(customersSql, { type: QueryTypes.SELECT });

        // Total Sales (All time valid orders)
        const salesSql = `
            SELECT COALESCE(SUM(total_amount), 0) as total 
            FROM orders 
            WHERE status NOT IN ('cancelled', 'returned', 'failed')
        `;
        const salesResult = await sequelize.query(salesSql, { type: QueryTypes.SELECT });

        // Total Outstanding Balance - calculated same way as account-receivables
        // Sum of (order total - payments) for all unpaid orders
        const outstandingSql = `
            SELECT COALESCE(SUM(balance), 0) as total_outstanding
            FROM (
                SELECT (o.total_amount - COALESCE(SUM(p.amount), 0)) as balance
                FROM orders o
                LEFT JOIN payments p ON o.id = p.order_id
                WHERE o.payment_status != 'paid'
                AND o.status NOT IN ('cancelled', 'returned', 'failed')
                GROUP BY o.id, o.total_amount
                HAVING balance > 0
            ) as outstanding_orders
        `;
        const outstandingResult = await sequelize.query(outstandingSql, { type: QueryTypes.SELECT });

        return {
            total_customers: parseInt(customerResult[0].count) || 0,
            total_sales: parseFloat(salesResult[0].total) || 0,
            total_outstanding_balance: parseFloat(outstandingResult[0].total_outstanding) || 0
        };
    }


    // --- Purchase Reports ---
    async getPurchaseSummary(startDate, endDate) {
        const { start, end } = this._getDateRange(startDate, endDate);

        const sql = `
            SELECT 
                COUNT(*) as total_orders,
                SUM(total_amount) as total_spent
            FROM purchase_orders
            WHERE order_date BETWEEN :start AND :end
            AND status != 'cancelled'
        `;

        const result = await sequelize.query(sql, {
            replacements: { start, end },
            type: QueryTypes.SELECT
        });

        return result[0];
    }

    async getSpendingBySupplier(startDate, endDate, limit = 10) {
        const { start, end } = this._getDateRange(startDate, endDate);

        const sql = `
            SELECT 
                s.id, s.name,
                COUNT(po.id) as po_count,
                SUM(po.total_amount) as total_spent
            FROM purchase_orders po
            JOIN suppliers s ON po.supplier_id = s.id
            WHERE po.order_date BETWEEN :start AND :end
            AND po.status != 'cancelled'
            GROUP BY s.id
            ORDER BY total_spent DESC
            LIMIT :limit
        `;

        return await sequelize.query(sql, {
            replacements: { start, end, limit },
            type: QueryTypes.SELECT
        });
    }

    // --- Inventory Reports ---
    async getInventoryStatus() {
        const sql = `
            SELECT 
                COUNT(*) as total_products,
                SUM(CASE WHEN stock_quantity <= min_stock_level THEN 1 ELSE 0 END) as low_stock_count,
                SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) as out_of_stock_count
            FROM products
            WHERE is_active = true
        `;

        const result = await sequelize.query(sql, { type: QueryTypes.SELECT });
        return result[0];
    }

    async getInventoryValuation() {
        const sql = `
            SELECT 
                SUM(stock_quantity) as total_units,
                SUM(stock_quantity * cost) as total_Valuation,
                SUM(stock_quantity * price) as potential_Sales_Value
            FROM products
            WHERE is_active = true
        `;

        const result = await sequelize.query(sql, { type: QueryTypes.SELECT });

        // Ensure numbers are returned, not nulls
        return {
            total_units: parseInt(result[0].total_units) || 0,
            total_Valuation: parseFloat(result[0].total_Valuation) || 0,
            potential_Sales_Value: parseFloat(result[0].potential_Sales_Value) || 0
        };
    }

    async getLowStockList(page = 1, limit = 10) {
        const offset = (page - 1) * limit;

        const sql = `
            SELECT
                p.sku,
                p.name as product,
                p.specification,
                p.stock_quantity as stock,
                p.min_stock_level as minLevel,
                COALESCE((
                    SELECT SUM(oi.total_price)
                    FROM order_items oi
                    JOIN orders o ON oi.order_id = o.id
                    WHERE oi.product_id = p.id AND o.status != 'cancelled'
                ), 0) as total_sales_amt,
                COALESCE((
                    SELECT SUM(poi.line_total)
                    FROM purchase_order_items poi
                    JOIN purchase_orders po ON poi.purchase_order_id = po.id
                    WHERE poi.product_id = p.id AND po.status != 'cancelled'
                ), 0) as total_purchase_amt
            FROM products p
            WHERE p.stock_quantity <= p.min_stock_level
            AND p.is_active = true
            ORDER BY p.stock_quantity ASC
            LIMIT :limit OFFSET :offset
        `;

        const countSql = `
            SELECT COUNT(*) as total
            FROM products
            WHERE stock_quantity <= min_stock_level
            AND is_active = true
        `;

        const rows = await sequelize.query(sql, {
            replacements: { limit, offset },
            type: QueryTypes.SELECT
        });

        const countResult = await sequelize.query(countSql, { type: QueryTypes.SELECT });

        return {
            rows,
            total: countResult[0].total
        };
    }

    // --- HR Reports ---
    async getAttendanceSummary(month, year, page = 1, limit = 10) {
        const offset = (page - 1) * limit;

        const mysqlSql = `
            SELECT 
                s.id, s.first_name, s.last_name,
                COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
                COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_days,
                COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days,
                COUNT(CASE WHEN a.status = 'half_day' THEN 1 END) as half_days
            FROM staffs s
            LEFT JOIN attendances a ON s.id = a.staff_id 
                AND MONTH(a.date) = :month 
                AND YEAR(a.date) = :year
            WHERE s.status = 'active'
            GROUP BY s.id
            LIMIT :limit OFFSET :offset
        `;

        const countSql = `
            SELECT COUNT(*) as total
            FROM staffs
            WHERE status = 'active'
        `;

        const rows = await sequelize.query(mysqlSql, {
            replacements: { month, year, limit, offset },
            type: QueryTypes.SELECT
        });

        const countResult = await sequelize.query(countSql, {
            type: QueryTypes.SELECT
        });

        return {
            rows,
            total: countResult[0].total
        };
    }

    async getPayrollSummary(year) {
        const sql = `
            SELECT 
                month,
                COUNT(*) as staff_paid,
                SUM(basic_salary) as total_basic,
                SUM(net_salary) as total_net_payout
            FROM payrolls
            WHERE year = :year
            AND status = 'paid'
            GROUP BY month
            ORDER BY 
                CASE month
                    WHEN 'January' THEN 1
                    WHEN 'February' THEN 2
                    WHEN 'March' THEN 3
                    WHEN 'April' THEN 4
                    WHEN 'May' THEN 5
                    WHEN 'June' THEN 6
                    WHEN 'July' THEN 7
                    WHEN 'August' THEN 8
                    WHEN 'September' THEN 9
                    WHEN 'October' THEN 10
                    WHEN 'November' THEN 11
                    WHEN 'December' THEN 12
                END
        `;

        return await sequelize.query(sql, {
            replacements: { year },
            type: QueryTypes.SELECT
        });
    }

    // --- Finance Reports ---
    async getProfitLoss(startDate, endDate) {
        const { start, end } = this._getDateRange(startDate, endDate);

        // 1. Revenue from Sales
        const revenueSql = `
            SELECT COALESCE(SUM(total_amount), 0) as total
            FROM orders 
            WHERE order_date BETWEEN :start AND :end 
            AND status != 'cancelled'
        `;
        const revenueRes = await sequelize.query(revenueSql, { replacements: { start, end }, type: QueryTypes.SELECT });
        const revenue = parseFloat(revenueRes[0].total);

        // 2. Cost of Goods Sold (Approximate from Purchase Orders for now, or Product Cost * Sold Qty)
        // Better to use Product Cost * Sold Qty for accurate COGS
        const cogsSql = `
            SELECT COALESCE(SUM(oi.quantity * p.cost_price), 0) as total
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN products p ON oi.product_id = p.id
            WHERE o.order_date BETWEEN :start AND :end
            AND o.status != 'cancelled'
        `;
        const cogsRes = await sequelize.query(cogsSql, { replacements: { start, end }, type: QueryTypes.SELECT });
        const cogs = parseFloat(cogsRes[0].total);

        // 3. Expenses from Accounting
        const expenseSql = `
            SELECT COALESCE(SUM(amount), 0) as total
            FROM transactions
            WHERE type = 'expense'
            AND date BETWEEN :start AND :end
        `;
        const expenseRes = await sequelize.query(expenseSql, { replacements: { start, end }, type: QueryTypes.SELECT });
        const expenses = parseFloat(expenseRes[0].total);

        return {
            revenue,
            cogs,
            gross_profit: revenue - cogs,
            expenses,
            net_profit: revenue - cogs - expenses
        };
    }
    async getStaffWiseSales(startDate, endDate, page = 1, limit = 10, search = null, staffId = null) {
        const { start, end } = this._getDateRange(startDate, endDate);
        const offset = parseInt((page - 1) * limit);
        const limitNum = parseInt(limit);

        // Use users table (staffs and users are the same)
        const sql = `
            SELECT
                u.id,
                IFNULL(u.name, CONCAT(IFNULL(u.first_name, ''), ' ', IFNULL(u.last_name, ''))) as staff_name,
                COUNT(\`orders\`.\`id\`) as order_count,
                COALESCE(SUM(\`orders\`.\`total_amount\` - COALESCE(\`orders\`.\`discount_amount\`, 0) + COALESCE(\`orders\`.\`tax_amount\`, 0)), 0) as total_sales,
                COALESCE(SUM(\`paid\`.\`paid_amount\`), 0) as total_paid,
                COALESCE(SUM(\`orders\`.\`total_amount\` - COALESCE(\`orders\`.\`discount_amount\`, 0) + COALESCE(\`orders\`.\`tax_amount\`, 0)), 0) - COALESCE(SUM(\`paid\`.\`paid_amount\`), 0) as due_amount
            FROM \`users\` u
            LEFT JOIN \`orders\` ON u.\`id\` = \`orders\`.\`created_by\`
                AND DATE(\`orders\`.\`order_date\`) BETWEEN :start AND :end
                AND \`orders\`.\`status\` != 'cancelled'
            LEFT JOIN (
                SELECT \`order_id\`, COALESCE(SUM(\`amount\`), 0) as paid_amount
                FROM \`payments\`
                GROUP BY \`order_id\`
            ) \`paid\` ON \`orders\`.\`id\` = \`paid\`.\`order_id\`
            WHERE u.\`status\` = 'active'
                ${staffId && staffId !== 'all' ? 'AND u.\`id\` = :staffId' : ''}
                ${search && search.trim() !== '' ? 'AND (u.\`first_name\` LIKE :search OR u.\`last_name\` LIKE :search OR u.\`name\` LIKE :search)' : ''}
            GROUP BY u.\`id\`, u.\`name\`, u.\`first_name\`, u.\`last_name\`
            HAVING order_count > 0
            ORDER BY total_sales DESC
            LIMIT :limit OFFSET :offset
        `;

        const countSql = `
            SELECT COUNT(*) as total
            FROM (
                SELECT u.\`id\`
                FROM \`users\` u
                INNER JOIN \`orders\` ON u.\`id\` = \`orders\`.\`created_by\`
                    AND DATE(\`orders\`.\`order_date\`) BETWEEN :start AND :end
                    AND \`orders\`.\`status\` != 'cancelled'
                WHERE u.\`status\` = 'active'
                    ${staffId && staffId !== 'all' ? 'AND u.\`id\` = :staffId' : ''}
                    ${search && search.trim() !== '' ? 'AND (u.\`first_name\` LIKE :search OR u.\`last_name\` LIKE :search OR u.\`name\` LIKE :search)' : ''}
                GROUP BY u.\`id\`
            ) as subquery
        `;

        const replacements = {
            start,
            end,
            limit: limitNum,
            offset,
            ...(search && search.trim() !== '' && { search: `%${search}%` }),
            ...(staffId && staffId !== 'all' && { staffId: parseInt(staffId) })
        };

        const rows = await sequelize.query(sql, {
            replacements,
            type: QueryTypes.SELECT
        });

        const countResult = await sequelize.query(countSql, {
            replacements,
            type: QueryTypes.SELECT
        });

        return {
            rows: rows.map(row => ({
                ...row,
                order_count: parseInt(row.order_count) || 0,
                total_sales: parseFloat(row.total_sales) || 0,
                total_paid: parseFloat(row.total_paid) || 0,
                due_amount: parseFloat(row.due_amount) || 0
            })),
            total: countResult[0].total
        };
    }

    async getStaffWiseOrderHistory(startDate, endDate, page = 1, limit = 10, search = null, staffId = null) {
        try {
            const { start, end } = this._getDateRange(startDate, endDate);
            const offset = parseInt((page - 1) * limit);
            const limitNum = parseInt(limit);

            // Get paginated orders with items and product details
            let sql = `
                SELECT
                    u.id as staff_id,
                    IFNULL(u.name, CONCAT(IFNULL(u.first_name, ''), ' ', IFNULL(u.last_name, ''))) as staff_name,
                    o.id as order_id,
                    o.order_number,
                    DATE_FORMAT(o.order_date, '%Y-%m-%d') as order_date,
                    o.total_amount,
                    o.payment_status,
                    o.status,
                    c.id as customer_id,
                    IFNULL(c.name, '') as customer_name,
                    IFNULL(c.company, '') as customer_company,
                    oi.id as item_id,
                    oi.quantity,
                    oi.unit_price,
                    oi.total_price as item_total_price,
                    p.id as product_id,
                    p.name as product_name,
                    p.image_url as product_image_url,
                    p.sku
                FROM users u
                INNER JOIN orders o ON u.id = o.created_by
                LEFT JOIN customers c ON o.customer_id = c.id
                LEFT JOIN order_items oi ON o.id = oi.order_id
                LEFT JOIN products p ON oi.product_id = p.id
                WHERE u.status = 'active'
                    AND DATE(o.order_date) BETWEEN :start AND :end
                    AND o.status != 'cancelled'
            `;

            let countSql = `
                SELECT COUNT(*) as total
                FROM (
                    SELECT DISTINCT o.id
                    FROM users u
                    INNER JOIN orders o ON u.id = o.created_by
                    WHERE u.status = 'active'
                        AND DATE(o.order_date) BETWEEN :start AND :end
                        AND o.status != 'cancelled'
            `;

            const replacements = {
                start,
                end
            };

            // Add search condition if provided
            if (search && search.trim() !== '') {
                const searchCondition = ' AND (u.first_name LIKE :search OR u.last_name LIKE :search OR u.name LIKE :search)';
                sql += searchCondition;
                countSql += searchCondition;
                replacements.search = `%${search}%`;
            }

            // Add staff filter if provided
            if (staffId && staffId !== 'all' && staffId !== 'undefined') {
                const staffCondition = ' AND u.id = :staffId';
                sql += staffCondition;
                countSql += staffCondition;
                replacements.staffId = parseInt(staffId);
            }

            // Get unique order IDs for pagination
            let orderIdsSql = `
                SELECT DISTINCT o.id
                FROM users u
                INNER JOIN orders o ON u.id = o.created_by
                WHERE u.status = 'active'
                    AND DATE(o.order_date) BETWEEN :start AND :end
                    AND o.status != 'cancelled'
            `;

            // Reapply filters to order IDs query
            if (search && search.trim() !== '') {
                orderIdsSql += ' AND (u.first_name LIKE :search OR u.last_name LIKE :search OR u.name LIKE :search)';
            }
            if (staffId && staffId !== 'all' && staffId !== 'undefined') {
                orderIdsSql += ' AND u.id = :staffId';
            }

            orderIdsSql += ' ORDER BY o.order_date DESC LIMIT :limit OFFSET :offset';

            const orderIdsResult = await sequelize.query(orderIdsSql, {
                replacements: {
                    ...replacements,
                    limit: limitNum,
                    offset
                },
                type: QueryTypes.SELECT
            });

            const orderIds = orderIdsResult.map(row => row.id);

            if (orderIds.length === 0) {
                return {
                    rows: [],
                    total: 0
                };
            }

            // Get total count
            countSql += ') as distinct_orders';

            const countResult = await sequelize.query(countSql, {
                replacements,
                type: QueryTypes.SELECT
            });

            // Add order ID filter to main query
            sql += ' AND o.id IN (:orderIds)';

            console.log('SQL Query:', sql);
            console.log('Replacements:', { ...replacements, orderIds });

            const rows = await sequelize.query(sql, {
                replacements: {
                    ...replacements,
                    orderIds
                },
                type: QueryTypes.SELECT
            });

            // Group results: staff -> orders -> items
            const groupedByStaff = {};

            rows.forEach(row => {
                const staffIdValue = row.staff_id;

                // Initialize staff if not exists
                if (!groupedByStaff[staffIdValue]) {
                    groupedByStaff[staffIdValue] = {
                        staff_id: parseInt(row.staff_id) || 0,
                        staff_name: row.staff_name || 'Unknown',
                        orders: []
                    };
                }

                // Find or create order
                let order = groupedByStaff[staffIdValue].orders.find(o => o.order_id === row.order_id);
                if (!order) {
                    order = {
                        order_id: parseInt(row.order_id) || 0,
                        order_number: row.order_number || '',
                        order_date: row.order_date,
                        customer: {
                            id: parseInt(row.customer_id) || 0,
                            name: row.customer_name,
                            company: row.customer_company
                        },
                        total_amount: parseFloat(row.total_amount) || 0,
                        payment_status: row.payment_status || 'unknown',
                        status: row.status || 'unknown',
                        items: []
                    };
                    groupedByStaff[staffIdValue].orders.push(order);
                }

                // Add item if exists
                if (row.item_id) {
                    order.items.push({
                        item_id: parseInt(row.item_id) || 0,
                        product_id: parseInt(row.product_id) || 0,
                        product_name: row.product_name || 'Unknown Product',
                        product_image_url: row.product_image_url || null,
                        sku: row.sku || '',
                        quantity: parseInt(row.quantity) || 0,
                        unit_price: parseFloat(row.unit_price) || 0,
                        total_price: parseFloat(row.item_total_price) || 0
                    });
                }
            });

            return {
                rows: Object.values(groupedByStaff),
                total: countResult[0].total
            };
        } catch (error) {
            console.error('Error in getStaffWiseOrderHistory:', error);
            throw error;
        }
    }

    async getStaffWiseProductHistory(startDate, endDate, page = 1, limit = 10, search = null, staffId = null) {
        try {
            const { start, end } = this._getDateRange(startDate, endDate);
            const offset = parseInt((page - 1) * limit);
            const limitNum = parseInt(limit);

            // Detailed product sales per staff
            let sql = `
                SELECT
                    u.id as staff_id,
                    IFNULL(u.name, CONCAT(IFNULL(u.first_name, ''), ' ', IFNULL(u.last_name, ''))) as staff_name,
                    p.id as product_id,
                    p.name as product_name,
                    p.sku,
                    p.image_url,
                    p.is_commissionable,
                    oi.quantity as quantity_sold,
                    oi.unit_price,
                    oi.total_price as total_revenue,
                    o.order_number as order_number,
                    1 as orders_count
                FROM users u
                INNER JOIN orders o ON u.id = o.created_by
                INNER JOIN order_items oi ON o.id = oi.order_id
                INNER JOIN products p ON oi.product_id = p.id
                WHERE u.status = 'active'
                    AND DATE(o.order_date) BETWEEN :start AND :end
                    AND o.status != 'cancelled'
            `;

            let countSql = `
                SELECT COUNT(oi.id) as total
                FROM users u
                INNER JOIN orders o ON u.id = o.created_by
                INNER JOIN order_items oi ON o.id = oi.order_id
                INNER JOIN products p ON oi.product_id = p.id
                WHERE u.status = 'active'
                    AND DATE(o.order_date) BETWEEN :start AND :end
                    AND o.status != 'cancelled'
            `;

            const replacements = {
                start,
                end,
                limit: limitNum,
                offset
            };

            // Add search condition if provided
            if (search && search.trim() !== '') {
                const searchCondition = ' AND (u.first_name LIKE :search OR u.last_name LIKE :search OR u.name LIKE :search)';
                sql += searchCondition;
                countSql += searchCondition;
                replacements.search = `%${search}%`;
            }

            // Add staff filter if provided
            if (staffId && staffId !== 'all' && staffId !== 'undefined') {
                const staffCondition = ' AND u.id = :staffId';
                sql += staffCondition;
                countSql += staffCondition;
                replacements.staffId = parseInt(staffId);
            }

            sql += `
                GROUP BY oi.id, o.order_number, u.id, p.id, p.image_url, p.is_commissionable, oi.unit_price
                ORDER BY o.order_date DESC
            `;

            const hasStaffFilter = staffId && staffId !== 'all' && staffId !== 'undefined';
            if (!hasStaffFilter) {
                sql += ` LIMIT :limit OFFSET :offset `;
            }

            const rows = await sequelize.query(sql, {
                replacements,
                type: QueryTypes.SELECT
            });

            const countResult = await sequelize.query(countSql, {
                replacements,
                type: QueryTypes.SELECT
            });

            // Group products by staff for better structure
            const groupedByStaff = {};
            rows.forEach(row => {
                const staffIdValue = row.staff_id;
                if (!groupedByStaff[staffIdValue]) {
                    groupedByStaff[staffIdValue] = {
                        staff_id: parseInt(row.staff_id) || 0,
                        staff_name: row.staff_name || 'Unknown',
                        products: []
                    };
                }
                groupedByStaff[staffIdValue].products.push({
                    product_id: parseInt(row.product_id) || 0,
                    product_name: row.product_name || '',
                    sku: row.sku || '',
                    image_url: row.image_url || null,
                    is_commissionable: row.is_commissionable === 1 || row.is_commissionable === true || row.is_commissionable === '1',
                    quantity_sold: parseFloat(row.quantity_sold) || 0,
                    unit_price: parseFloat(row.unit_price) || 0,
                    total_revenue: parseFloat(row.total_revenue) || 0,
                    orders_count: parseInt(row.orders_count) || 0,
                    order_number: row.order_number || ''
                });
            });

            return {
                rows: Object.values(groupedByStaff),
                total: countResult[0].total
            };
        } catch (error) {
            console.error('Error in getStaffWiseProductHistory:', error);
            throw error;
        }
    }

    async getStaffWiseInvoices(startDate, endDate, page = 1, limit = 10, search = null, staffId = null) {
        const { start, end } = this._getDateRange(startDate, endDate);
        const offset = parseInt((page - 1) * limit);
        const limitNum = parseInt(limit);

        // Use users table (staffs and users are the same)
        const sql = `
            SELECT
                u.\`id\` as staff_id,
                IFNULL(u.\`name\`, CONCAT(IFNULL(u.\`first_name\`, ''), ' ', IFNULL(u.\`last_name\`, ''))) as staff_name,
                COUNT(DISTINCT \`invoices\`.\`id\`) as total_invoices,
                COALESCE(SUM(\`orders\`.\`total_amount\`), 0) as total_amount,
                COALESCE(SUM(\`paid\`.\`paid_amount\`), 0) as paid_amount,
                COALESCE(SUM(\`orders\`.\`total_amount\`), 0) - COALESCE(SUM(\`paid\`.\`paid_amount\`), 0) as unpaid_amount
            FROM \`users\` u
            INNER JOIN \`orders\` ON u.\`id\` = \`orders\`.\`created_by\`
            LEFT JOIN \`invoices\` ON \`orders\`.\`id\` = \`invoices\`.\`order_id\`
            LEFT JOIN (
                SELECT \`order_id\`, COALESCE(SUM(\`amount\`), 0) as paid_amount
                FROM \`payments\`
                GROUP BY \`order_id\`
            ) \`paid\` ON \`orders\`.\`id\` = \`paid\`.\`order_id\`
            WHERE u.\`status\` = 'active'
                AND \`orders\`.\`status\` != 'cancelled'
                AND DATE(\`orders\`.\`order_date\`) BETWEEN :start AND :end
                ${search && search.trim() !== '' ? 'AND (u.\`first_name\` LIKE :search OR u.\`last_name\` LIKE :search OR u.\`name\` LIKE :search)' : ''}
                ${staffId && staffId !== 'all' ? 'AND u.\`id\` = :staffId' : ''}
            GROUP BY u.\`id\`, u.\`name\`, u.\`first_name\`, u.\`last_name\`
            HAVING total_invoices > 0
            ORDER BY total_amount DESC
            LIMIT :limit OFFSET :offset
        `;

        const countSql = `
            SELECT COUNT(*) as total
            FROM (
                SELECT u.\`id\`
                FROM \`users\` u
                INNER JOIN \`orders\` ON u.\`id\` = \`orders\`.\`created_by\`
                INNER JOIN \`invoices\` ON \`orders\`.\`id\` = \`invoices\`.\`order_id\`
                WHERE u.\`status\` = 'active'
                    AND \`orders\`.\`status\` != 'cancelled'
                    AND DATE(\`orders\`.\`order_date\`) BETWEEN :start AND :end
                    ${search && search.trim() !== '' ? 'AND (u.\`first_name\` LIKE :search OR u.\`last_name\` LIKE :search OR u.\`name\` LIKE :search)' : ''}
                    ${staffId && staffId !== 'all' ? 'AND u.\`id\` = :staffId' : ''}
                GROUP BY u.\`id\`
            ) as subquery
        `;

        const replacements = {
            start,
            end,
            limit: limitNum,
            offset,
            ...(search && search.trim() !== '' && { search: `%${search}%` }),
            ...(staffId && staffId !== 'all' && { staffId: parseInt(staffId) })
        };

        console.log('[getStaffWiseInvoices] SQL Debug:', {
            start,
            end,
            search,
            staffId,
            sql: sql.replace(/\s+/g, ' ')
        });

        const rows = await sequelize.query(sql, {
            replacements,
            type: QueryTypes.SELECT
        });

        const countResult = await sequelize.query(countSql, {
            replacements,
            type: QueryTypes.SELECT
        });

        console.log('[getStaffWiseInvoices] Result:', {
            total: countResult[0]?.total || 0,
            rowsCount: rows.length,
            rows: rows
        });

        return {
            rows: rows.map(row => ({
                ...row,
                staff_id: parseInt(row.staff_id) || 0,
                total_invoices: parseInt(row.total_invoices) || 0,
                total_amount: parseFloat(row.total_amount) || 0,
                paid_amount: parseFloat(row.paid_amount) || 0,
                unpaid_amount: parseFloat(row.unpaid_amount) || 0
            })),
            total: countResult[0].total
        };
    }

    // My Reports - Reports for the logged-in staff member

    async getMySales(startDate, endDate, page = 1, limit = 10, search = null, staffId, customerId = null) {
        const { start, end } = this._getDateRange(startDate, endDate);
        const offset = parseInt((page - 1) * limit);
        const limitNum = parseInt(limit);

        let searchCondition = '';
        if (search && search.trim() !== '') {
            searchCondition = `AND (c.company LIKE :search OR c.name LIKE :search)`;
        }

        let customerCondition = '';
        if (customerId && customerId !== 'all') {
            customerCondition = `AND c.id = :customerId`;
        }

        const sql = `
            SELECT
                c.id as customer_id,
                CONCAT(c.company, ' - ', c.name) as customer_name,
                COUNT(DISTINCT o.id) as order_count,
                COALESCE(SUM(o.total_amount - COALESCE(o.discount_amount, 0) + COALESCE(o.tax_amount, 0)), 0) as total_sales,
                COALESCE(SUM(paid.paid_amount), 0) as paid_amount,
                COALESCE(SUM(o.total_amount - COALESCE(o.discount_amount, 0) + COALESCE(o.tax_amount, 0)), 0) - COALESCE(SUM(paid.paid_amount), 0) as due_amount
            FROM orders o
            INNER JOIN customers c ON o.customer_id = c.id
            LEFT JOIN (
                SELECT order_id, COALESCE(SUM(amount), 0) as paid_amount
                FROM payments
                GROUP BY order_id
            ) paid ON o.id = paid.order_id
            WHERE o.created_by = :staffId
                AND DATE(o.order_date) BETWEEN :start AND :end
                ${searchCondition}
                ${customerCondition}
            GROUP BY c.id, c.company, c.name
            ORDER BY total_sales DESC
            LIMIT :limit OFFSET :offset
        `;

        const countSql = `
            SELECT COUNT(DISTINCT c.id) as total
            FROM orders o
            INNER JOIN customers c ON o.customer_id = c.id
            WHERE o.created_by = :staffId
                AND DATE(o.order_date) BETWEEN :start AND :end
                ${searchCondition}
                ${customerCondition}
        `;

        console.log('[getMySales] SQL Debug:', {
            staffId: parseInt(staffId),
            start,
            end,
            search,
            customerId,
            sql: sql.replace(/\s+/g, ' ').trim()
        });

        const replacements = {
            staffId: parseInt(staffId),
            start,
            end,
            limit: limitNum,
            offset,
            ...(search && search.trim() !== '' && { search: `%${search}%` }),
            ...(customerId && customerId !== 'all' && { customerId: parseInt(customerId) })
        };

        const rows = await sequelize.query(sql, {
            replacements,
            type: QueryTypes.SELECT
        });

        const countResult = await sequelize.query(countSql, {
            replacements,
            type: QueryTypes.SELECT
        });

        return {
            rows: rows.map(row => ({
                ...row,
                customer_id: parseInt(row.customer_id) || 0,
                order_count: parseInt(row.order_count) || 0,
                total_sales: parseFloat(row.total_sales) || 0,
                paid_amount: parseFloat(row.paid_amount) || 0,
                due_amount: parseFloat(row.due_amount) || 0
            })),
            total: countResult[0].total
        };
    }

    async getMyInvoices(startDate, endDate, page = 1, limit = 10, search = null, staffId, customerId = null) {
        const { start, end } = this._getDateRange(startDate, endDate);
        const offset = parseInt((page - 1) * limit);
        const limitNum = parseInt(limit);

        let searchCondition = '';
        if (search && search.trim() !== '') {
            searchCondition = `AND (c.company LIKE :search OR c.name LIKE :search OR COALESCE(i.invoice_number, o.order_number) LIKE :search)`;
        }

        let customerCondition = '';
        if (customerId && customerId !== 'all') {
            customerCondition = `AND c.id = :customerId`;
        }

        const sql = `
            SELECT
                i.id,
                COALESCE(i.invoice_number, o.order_number) as invoice_number,
                CONCAT(c.company, ' - ', c.name) as customer_name,
                DATE_FORMAT(o.order_date, '%Y-%m-%d') as invoice_date,
                DATE_FORMAT(COALESCE(o.due_date, o.order_date), '%Y-%m-%d') as due_date,
                o.total_amount,
                COALESCE(SUM(p.amount), 0) as paid_amount,
                o.payment_status,
                o.total_amount - COALESCE(SUM(p.amount), 0) as balance_due
            FROM orders o
            INNER JOIN customers c ON o.customer_id = c.id
            LEFT JOIN invoices i ON o.id = i.order_id
            LEFT JOIN payments p ON o.id = p.order_id
            WHERE o.created_by = :staffId
                AND DATE(o.order_date) BETWEEN :start AND :end
                ${searchCondition}
                ${customerCondition}
            GROUP BY i.id, i.invoice_number, c.company, c.name, o.order_date, o.due_date, o.total_amount, o.payment_status, o.order_number
            ORDER BY o.order_date DESC
            LIMIT :limit OFFSET :offset
        `;

        const countSql = `
            SELECT COUNT(DISTINCT o.id) as total
            FROM orders o
            INNER JOIN customers c ON o.customer_id = c.id
            LEFT JOIN invoices i ON o.id = i.order_id
            WHERE o.created_by = :staffId
                AND DATE(o.order_date) BETWEEN :start AND :end
                ${searchCondition}
                ${customerCondition}
        `;

        const replacements = {
            staffId: parseInt(staffId),
            start,
            end,
            limit: limitNum,
            offset,
            ...(search && search.trim() !== '' && { search: `%${search}%` }),
            ...(customerId && customerId !== 'all' && { customerId: parseInt(customerId) })
        };

        const rows = await sequelize.query(sql, {
            replacements,
            type: QueryTypes.SELECT
        });

        const countResult = await sequelize.query(countSql, {
            replacements,
            type: QueryTypes.SELECT
        });

        return {
            rows: rows.map(row => ({
                ...row,
                id: parseInt(row.id) || 0,
                total_amount: parseFloat(row.total_amount) || 0,
                paid_amount: parseFloat(row.paid_amount) || 0,
                balance_due: parseFloat(row.balance_due) || 0
            })),
            total: countResult[0].total
        };
    }

    async getMyCustomerWiseSales(startDate, endDate, page = 1, limit = 10, search = null, staffId) {
        // Similar to getMySales but with more detailed customer info
        return this.getMySales(startDate, endDate, page, limit, search, staffId);
    }

    async getMyCustomerWiseInvoices(startDate, endDate, page = 1, limit = 10, search = null, staffId) {
        const { start, end } = this._getDateRange(startDate, endDate);
        const offset = parseInt((page - 1) * limit);
        const limitNum = parseInt(limit);

        let searchCondition = '';
        if (search && search.trim() !== '') {
            searchCondition = `AND (c.company LIKE :search OR c.name LIKE :search)`;
        }

        const sql = `
            SELECT
                c.id as customer_id,
                CONCAT(c.company, ' - ', c.name) as customer_name,
                COUNT(DISTINCT o.id) as invoice_count,
                COALESCE(SUM(o.total_amount), 0) as total_amount,
                COALESCE(SUM(
                    CASE WHEN o.payment_status = 'paid' THEN o.total_amount ELSE 0 END
                ), 0) as paid_amount,
                COALESCE(SUM(
                    CASE WHEN o.payment_status != 'paid' THEN o.total_amount ELSE 0 END
                ), 0) as unpaid_amount
            FROM orders o
            INNER JOIN customers c ON o.customer_id = c.id
            WHERE o.created_by = :staffId
                AND DATE(o.order_date) BETWEEN :start AND :end
                ${searchCondition}
            GROUP BY c.id, c.company, c.name
            ORDER BY total_amount DESC
            LIMIT :limit OFFSET :offset
        `;

        const countSql = `
            SELECT COUNT(DISTINCT c.id) as total
            FROM orders o
            INNER JOIN customers c ON o.customer_id = c.id
            WHERE o.created_by = :staffId
                AND DATE(o.order_date) BETWEEN :start AND :end
                ${searchCondition}
        `;

        const replacements = {
            staffId: parseInt(staffId),
            start,
            end,
            limit: limitNum,
            offset,
            ...(search && search.trim() !== '' && { search: `%${search}%` }),
            ...(customerId && customerId !== 'all' && { customerId: parseInt(customerId) })
        };

        const rows = await sequelize.query(sql, {
            replacements,
            type: QueryTypes.SELECT
        });

        const countResult = await sequelize.query(countSql, {
            replacements,
            type: QueryTypes.SELECT
        });

        return {
            rows: rows.map(row => ({
                ...row,
                customer_id: parseInt(row.customer_id) || 0,
                invoice_count: parseInt(row.invoice_count) || 0,
                total_amount: parseFloat(row.total_amount) || 0,
                paid_amount: parseFloat(row.paid_amount) || 0,
                unpaid_amount: parseFloat(row.unpaid_amount) || 0
            })),
            total: countResult[0].total
        };
    }

    async getCustomerWiseInvoices(startDate, endDate, page = 1, limit = 10, search = null, customerId, status = null) {
        const { start, end } = this._getDateRange(startDate, endDate);
        const offset = parseInt((page - 1) * limit);
        const limitNum = parseInt(limit);

        console.log('=== getCustomerWiseInvoices DEBUG ===');
        console.log('status received:', status);
        console.log('status type:', typeof status);
        console.log('status.trim():', status?.trim());

        let searchCondition = '';
        if (search && search.trim() !== '') {
            searchCondition = `AND (COALESCE(i.invoice_number, o.order_number) LIKE :search)`;
        }

        let statusCondition = '';
        let dbStatus = null;
        if (status && status.trim() !== '') {
            // Map "due" to "unpaid" and "partial" to "partially_paid"
            const statusMap = {
                'due': 'unpaid',
                'partial': 'partially_paid',
                'paid': 'paid'
            };
            dbStatus = statusMap[status.toLowerCase()] || status;
            statusCondition = `AND o.payment_status = :status`;
            console.log('dbStatus:', dbStatus);
            console.log('statusCondition:', statusCondition);
        }

        const sql = `
            SELECT
                o.id,
                COALESCE(i.invoice_number, o.order_number) as invoice_number,
                o.order_number,
                o.total_amount,
                COALESCE(SUM(p.amount), 0) as paid_amount,
                o.payment_status as status,
                DATE_FORMAT(o.created_at, '%Y-%m-%d') as created_at,
                DATE_FORMAT(COALESCE(o.due_date, o.order_date), '%Y-%m-%d') as due_date
            FROM orders o
            LEFT JOIN invoices i ON o.id = i.order_id
            LEFT JOIN payments p ON o.id = p.order_id
            WHERE o.customer_id = :customerId
                AND DATE(o.order_date) BETWEEN :start AND :end
                ${searchCondition}
                ${statusCondition}
            GROUP BY o.id, i.invoice_number, o.order_number, o.total_amount, o.payment_status, o.created_at, o.due_date, o.order_date
            ORDER BY o.created_at DESC
            LIMIT :limit OFFSET :offset
        `;

        const countSql = `
            SELECT COUNT(DISTINCT o.id) as total
            FROM orders o
            LEFT JOIN invoices i ON o.id = i.order_id
            WHERE o.customer_id = :customerId
                AND DATE(o.order_date) BETWEEN :start AND :end
                ${searchCondition}
                ${statusCondition}
        `;

        const replacements = {
            customerId: parseInt(customerId),
            start,
            end,
            limit: limitNum,
            offset,
            ...(search && search.trim() !== '' && { search: `%${search}%` }),
            ...(dbStatus && { status: dbStatus })
        };

        console.log('replacements:', JSON.stringify(replacements, null, 2));
        console.log('SQL with statusCondition:', statusCondition);

        const rows = await sequelize.query(sql, {
            replacements,
            type: QueryTypes.SELECT
        });

        const countResult = await sequelize.query(countSql, {
            replacements,
            type: QueryTypes.SELECT
        });

        return {
            rows: rows.map(row => ({
                ...row,
                id: parseInt(row.id) || 0,
                total_amount: parseFloat(row.total_amount) || 0,
                paid_amount: parseFloat(row.paid_amount) || 0
            })),
            total: parseInt(countResult[0].total) || 0
        };
    }

    // Get customers assigned to the logged-in staff (customers for whom staff has created orders)
    async getMyCustomers(staffId, search = null, limit = 100) {
        const limitNum = parseInt(limit);

        let searchCondition = '';
        if (search && search.trim() !== '') {
            searchCondition = `AND (c.company LIKE :search OR c.name LIKE :search)`;
        }

        const sql = `
            SELECT DISTINCT
                c.id,
                c.company,
                c.name,
                c.email,
                c.phone,
                c.address,
                c.status
            FROM customers c
            INNER JOIN orders o ON o.customer_id = c.id
            WHERE o.created_by = :staffId
                ${searchCondition}
            ORDER BY c.company, c.name
            LIMIT :limit
        `;

        const countSql = `
            SELECT COUNT(DISTINCT c.id) as total
            FROM customers c
            INNER JOIN orders o ON o.customer_id = c.id
            WHERE o.created_by = :staffId
                ${searchCondition}
        `;

        const replacements = {
            staffId: parseInt(staffId),
            limit: limitNum,
            ...(search && search.trim() !== '' && { search: `%${search}%` })
        };

        console.log('[getMyCustomers] Debug:', {
            staffId: parseInt(staffId),
            search,
            limit: limitNum,
            sql: sql.replace(/\s+/g, ' ').trim()
        });

        const rows = await sequelize.query(sql, {
            replacements,
            type: QueryTypes.SELECT
        });

        const countResult = await sequelize.query(countSql, {
            replacements,
            type: QueryTypes.SELECT
        });

        return {
            data: rows.map(row => ({
                id: parseInt(row.id) || 0,
                company: row.company || '',
                name: row.name || '',
                email: row.email || '',
                phone: row.phone || '',
                address: row.address || '',
                status: row.status || 'active'
            })),
            pagination: {
                total: countResult[0].total,
                limit: limitNum
            }
        };
    }

    async getDashboardStatistics(staffId, filter = 'thisMonth') {
        const now = new Date();
        let startDate, endDate;

        // Calculate date range based on filter
        switch (filter) {
            case 'today':
                startDate = now.toISOString().split('T')[0];
                endDate = startDate;
                break;
            case 'thisWeek':
                // Start of current week (Monday)
                const dayOfWeek = now.getDay();
                const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
                const monday = new Date(now.setDate(diff));
                startDate = monday.toISOString().split('T')[0];
                endDate = now.toISOString().split('T')[0];
                break;
            case 'thisMonth':
                // Start of current month
                startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                endDate = now.toISOString().split('T')[0];
                break;
            case 'lastMonth':
                // Previous month
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
                endDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
                break;
            case 'thisYear':
                // Start of current year
                startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
                endDate = now.toISOString().split('T')[0];
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                endDate = now.toISOString().split('T')[0];
        }

        // Calculate total sales (sum of order amounts)
        const salesSql = `
            SELECT
                COALESCE(SUM(o.total_amount), 0) as total_sales
            FROM orders o
            WHERE o.created_by = :staffId
                AND DATE(o.order_date) BETWEEN :start AND :end
                AND o.status != 'cancelled'
        `;

        // Calculate total orders/invoices count
        const ordersSql = `
            SELECT
                COUNT(DISTINCT o.id) as total_orders,
                COUNT(DISTINCT i.id) as total_invoices
            FROM orders o
            LEFT JOIN invoices i ON o.id = i.order_id
            WHERE o.created_by = :staffId
                AND DATE(o.order_date) BETWEEN :start AND :end
                AND o.status != 'cancelled'
        `;

        // Calculate total collections (sum of payments)
        const collectionsSql = `
            SELECT
                COALESCE(SUM(p.amount), 0) as total_collections
            FROM payments p
            INNER JOIN orders o ON p.order_id = o.id
            WHERE o.created_by = :staffId
                AND DATE(p.payment_date) BETWEEN :start AND :end
        `;

        const replacements = { staffId, start: startDate, end: endDate };

        const [salesResult, ordersResult, collectionsResult] = await Promise.all([
            sequelize.query(salesSql, {
                replacements,
                type: QueryTypes.SELECT
            }),
            sequelize.query(ordersSql, {
                replacements,
                type: QueryTypes.SELECT
            }),
            sequelize.query(collectionsSql, {
                replacements,
                type: QueryTypes.SELECT
            })
        ]);

        return {
            total_sales: parseFloat(salesResult[0].total_sales) || 0,
            total_orders: parseInt(ordersResult[0].total_orders) || 0,
            total_invoices: parseInt(ordersResult[0].total_invoices) || 0,
            total_collections: parseFloat(collectionsResult[0].total_collections) || 0,
            period: {
                filter,
                start_date: startDate,
                end_date: endDate
            }
        };
    }
}

module.exports = new ReportService();
