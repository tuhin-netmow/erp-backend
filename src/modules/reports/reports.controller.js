const ReportService = require('./reports.service');
const { success, error, successWithPagination } = require('../../core/utils/response');

class ReportController {
    // Sales
    async getSalesSummary(req, res) {
        try {
            const start_date = req.query.start_date || req.query.startDate;
            const end_date = req.query.end_date || req.query.endDate;

            if (!start_date || !end_date) {
                return error(res, 'start_date and end_date are required', 400);
            }

            const data = await ReportService.getSalesSummary(start_date, end_date);
            return success(res, 'Sales summary retrieved successfully', data);
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getTopCustomers(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const limit = req.query.limit ? parseInt(req.query.limit) : 5;
            const data = await ReportService.getTopCustomers(startDate, endDate, limit);
            return successWithPagination(res, 'Top customers retrieved', data, {
                total: data.length,
                page: 1,
                limit,
                totalPage: 1
            });
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getTopProducts(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const limit = req.query.limit ? parseInt(req.query.limit) : 5;
            const data = await ReportService.getTopProducts(startDate, endDate, limit);
            return successWithPagination(res, 'Top products retrieved', data, {
                total: data.length,
                page: 1,
                limit,
                totalPage: 1
            });
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getSalesByCustomer(req, res) {
        try {
            const startDate = req.query.start_date || req.query.startDate;
            const endDate = req.query.end_date || req.query.endDate;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search || null;

            const result = await ReportService.getSalesByCustomer(startDate, endDate, page, limit, search);

            return successWithPagination(res, 'Sales by customer retrieved', result.rows, {
                total: result.total,
                page,
                limit,
                totalPage: Math.ceil(result.total / limit)
            });
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getAccountReceivables(req, res) {
        try {
            const startDate = req.query.start_date || req.query.startDate;
            const endDate = req.query.end_date || req.query.endDate;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search || null;

            const result = await ReportService.getAccountReceivables(startDate, endDate, page, limit, search);

            return successWithPagination(res, 'Account receivables retrieved', result.rows, {
                total: result.total,
                page,
                limit,
                totalPage: Math.ceil(result.total / limit)
            });
        } catch (err) {
            return error(res, err.message, 500);
        }
    }


    async getCustomerStatistics(req, res) {
        try {
            const data = await ReportService.getCustomerStatistics();
            return success(res, 'Customer statistics retrieved', data);
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    // Purchase
    async getPurchaseSummary(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const data = await ReportService.getPurchaseSummary(startDate, endDate);
            return success(res, 'Purchase summary retrieved', data);
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getSpendingBySupplier(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const limit = req.query.limit ? parseInt(req.query.limit) : 10;
            const data = await ReportService.getSpendingBySupplier(startDate, endDate, limit);
            return successWithPagination(res, 'Supplier spending retrieved', data, {
                total: data.length,
                page: 1,
                limit,
                totalPage: 1
            });
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    // Inventory
    async getInventoryStatus(req, res) {
        try {
            const data = await ReportService.getInventoryStatus();
            return success(res, 'Inventory status retrieved', data);
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getInventoryValuation(req, res) {
        try {
            const data = await ReportService.getInventoryValuation();
            return success(res, 'Inventory valuation retrieved', data);
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getLowStockList(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            const result = await ReportService.getLowStockList(page, limit);

            return successWithPagination(res, 'Low stock list retrieved', result.rows, {
                total: result.total,
                page,
                limit,
                totalPage: Math.ceil(result.total / limit)
            });
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    // HR
    async getAttendanceSummary(req, res) {
        try {
            const { month, year } = req.query;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            if (!month || !year) {
                return error(res, 'Month and Year are required', 400);
            }

            const result = await ReportService.getAttendanceSummary(month, year, page, limit);
            return successWithPagination(res, 'Attendance summary retrieved', result.rows, {
                total: result.total,
                page,
                limit
            });
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getPayrollSummary(req, res) {
        try {
            const { year } = req.query;
            if (!year) {
                return error(res, 'Year is required', 400);
            }
            const data = await ReportService.getPayrollSummary(year);
            return successWithPagination(res, 'Payroll summary retrieved', data, {
                total: data.length,
                page: 1,
                limit: 12,
                totalPage: 1
            });
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    // Finance
    async getProfitLoss(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const data = await ReportService.getProfitLoss(startDate, endDate);
            return success(res, 'Profit & Loss statement retrieved', data);
        } catch (err) {
            return error(res, err.message, 500);
        }
    }
    async getStaffWiseSales(req, res) {
        try {
            const startDate = req.query.start_date || req.query.startDate;
            const endDate = req.query.end_date || req.query.endDate;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search || null;
            const staff_id = req.query.staff_id || null;

            const result = await ReportService.getStaffWiseSales(startDate, endDate, page, limit, search, staff_id);

            const total = parseInt(result.total) || 0;

            return successWithPagination(res, 'Staff wise sales retrieved', result.rows, {
                total: total,
                page,
                limit,
                totalPage: Math.ceil(total / limit)
            });
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getStaffWiseOrderHistory(req, res) {
        try {
            const startDate = req.query.start_date || req.query.startDate;
            const endDate = req.query.end_date || req.query.endDate;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search || null;
            const staff_id = req.query.staff_id || null;

            const result = await ReportService.getStaffWiseOrderHistory(
                startDate, endDate, page, limit, search, staff_id
            );

            const total = parseInt(result.total) || 0;

            return successWithPagination(res, 'Staff order history retrieved', result.rows, {
                total: total,
                page,
                limit,
                totalPage: Math.ceil(total / limit)
            });
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getStaffWiseProductHistory(req, res) {
        try {
            const startDate = req.query.start_date || req.query.startDate;
            const endDate = req.query.end_date || req.query.endDate;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search || null;
            const staff_id = req.query.staff_id || null;

            const result = await ReportService.getStaffWiseProductHistory(
                startDate, endDate, page, limit, search, staff_id
            );

            const total = parseInt(result.total) || 0;

            return successWithPagination(res, 'Staff product sales retrieved', result.rows, {
                total: total,
                page,
                limit,
                totalPage: Math.ceil(total / limit)
            });
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getStaffWiseInvoices(req, res) {
        try {
            const startDate = req.query.start_date || req.query.startDate;
            const endDate = req.query.end_date || req.query.endDate;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search || null;
            const staff_id = req.query.staff_id || null;

            console.log('[getStaffWiseInvoices] Debug:', {
                startDate,
                endDate,
                page,
                limit,
                search,
                staff_id
            });

            const result = await ReportService.getStaffWiseInvoices(startDate, endDate, page, limit, search, staff_id);

            console.log('[getStaffWiseInvoices] Result:', {
                total: result.total,
                rowsCount: result.rows?.length
            });

            const total = parseInt(result.total) || 0;

            return successWithPagination(res, 'Staff wise invoices retrieved', result.rows, {
                total: total,
                page,
                limit,
                totalPage: Math.ceil(total / limit)
            });
        } catch (err) {
            console.error('[getStaffWiseInvoices] Error:', err);
            return error(res, err.message, 500);
        }
    }

    // My Reports - Controllers for logged-in staff member

    async getMySales(req, res) {
        try {
            const startDate = req.query.start_date || req.query.startDate;
            const endDate = req.query.end_date || req.query.endDate;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search || null;
            const customerId = req.query.customerId || null;
            const staffId = req.user?.id;

            console.log('[getMySales] Debug:', {
                staffId,
                startDate,
                endDate,
                page,
                limit,
                search,
                customerId
            });

            if (!staffId) {
                return error(res, 'User not authenticated', 401);
            }

            const result = await ReportService.getMySales(startDate, endDate, page, limit, search, staffId, customerId);

            console.log('[getMySales] Result:', {
                total: result.total,
                rowsCount: result.rows?.length
            });

            return successWithPagination(res, 'My sales retrieved', result.rows, {
                total: result.total,
                page,
                limit,
                totalPage: Math.ceil(result.total / limit)
            });
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getMyInvoices(req, res) {
        try {
            const startDate = req.query.start_date || req.query.startDate;
            const endDate = req.query.end_date || req.query.endDate;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search || null;
            const customerId = req.query.customerId || null;
            const staffId = req.user?.id;

            if (!staffId) {
                return error(res, 'User not authenticated', 401);
            }

            const result = await ReportService.getMyInvoices(startDate, endDate, page, limit, search, staffId, customerId);

            return successWithPagination(res, 'My invoices retrieved', result.rows, {
                total: result.total,
                page,
                limit,
                totalPage: Math.ceil(result.total / limit)
            });
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getMyCustomerWiseSales(req, res) {
        try {
            const startDate = req.query.start_date || req.query.startDate;
            const endDate = req.query.end_date || req.query.endDate;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search || null;
            const staffId = req.user?.id;

            if (!staffId) {
                return error(res, 'User not authenticated', 401);
            }

            const result = await ReportService.getMyCustomerWiseSales(startDate, endDate, page, limit, search, staffId);

            return successWithPagination(res, 'My customer wise sales retrieved', result.rows, {
                total: result.total,
                page,
                limit,
                totalPage: Math.ceil(result.total / limit)
            });
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getMyCustomerWiseInvoices(req, res) {
        try {
            const startDate = req.query.start_date || req.query.startDate;
            const endDate = req.query.end_date || req.query.endDate;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search || null;
            const staffId = req.user?.id;

            if (!staffId) {
                return error(res, 'User not authenticated', 401);
            }

            const result = await ReportService.getMyCustomerWiseInvoices(startDate, endDate, page, limit, search, staffId);

            return successWithPagination(res, 'My customer wise invoices retrieved', result.rows, {
                total: result.total,
                page,
                limit,
                totalPage: Math.ceil(result.total / limit)
            });
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getCustomerWiseInvoices(req, res) {
        try {
            const startDate = req.query.start_date || req.query.startDate;
            const endDate = req.query.end_date || req.query.endDate;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search || null;
            const customerId = req.query.customer_id || req.query.customerId;
            const status = req.query.status || null;

            if (!customerId) {
                return error(res, 'Customer ID is required', 400);
            }

            const result = await ReportService.getCustomerWiseInvoices(startDate, endDate, page, limit, search, customerId, status);

            return successWithPagination(res, 'Customer wise invoices retrieved', result.rows, {
                total: result.total,
                page,
                limit,
                totalPage: Math.ceil(result.total / limit)
            });
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getMyCustomers(req, res) {
        try {
            const search = req.query.search || null;
            const limit = req.query.limit ? parseInt(req.query.limit) : 100;
            const staffId = req.user?.id;

            if (!staffId) {
                return error(res, 'User not authenticated', 401);
            }

            const result = await ReportService.getMyCustomers(staffId, search, limit);

            return success(res, 'My customers retrieved successfully', result);
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getDashboardStatistics(req, res) {
        try {
            const filter = req.query.filter || 'thisMonth';
            const staffId = req.user?.id;

            if (!staffId) {
                return error(res, 'User not authenticated', 401);
            }

            const result = await ReportService.getDashboardStatistics(staffId, filter);

            return success(res, 'Dashboard statistics retrieved', result);
        } catch (err) {
            return error(res, err.message, 500);
        }
    }
}

module.exports = new ReportController();
