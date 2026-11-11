const { SalesReturnRepository, SalesReturnInvoiceRepository, SalesReturnPaymentRepository } = require('./sales-return.repository');
const AccountingService = require('../accounting/accounting.service');

class SalesReturnService {
    // Sales Returns
    async getAllSalesReturns(filters = {}, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const result = await SalesReturnRepository.findAll(filters, limit, offset);

        const data = result.rows.map(row => {
            const sr = row.get({ plain: true });
            const totalAmount = parseFloat(sr.total_amount || 0);
            const discountAmount = parseFloat(sr.discount_amount || 0);
            const taxAmount = parseFloat(sr.tax_amount || 0);
            const refunded = parseFloat(sr.total_refunded_amount || 0);

            const grandTotal = totalAmount - discountAmount + taxAmount;
            const dueRefund = grandTotal - refunded;

            return {
                ...sr,
                grand_total: grandTotal,
                total_refunded_amount: refunded,
                due_refund_amount: dueRefund > 0 ? dueRefund : 0
            };
        });

        return {
            data,
            total: result.count
        };
    }

    async getSalesReturnById(id) {
        const sr = await SalesReturnRepository.findById(id);
        if (!sr) {
            throw new Error('Sales return not found');
        }

        const data = sr.get({ plain: true });
        const totalAmount = parseFloat(data.total_amount || 0);
        const discountAmount = parseFloat(data.discount_amount || 0);
        const taxAmount = parseFloat(data.tax_amount || 0);

        const totalRefunded = data.payments && data.payments.length > 0
            ? data.payments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0)
            : 0;

        const grandTotal = totalAmount - discountAmount + taxAmount;
        const dueRefund = grandTotal - totalRefunded;

        return {
            ...data,
            grand_total: grandTotal,
            total_refunded_amount: totalRefunded,
            due_refund_amount: dueRefund > 0 ? dueRefund : 0
        };
    }

    async createSalesReturn(data, userId) {
        let { items, ...returnInfo } = data;

        if (!Array.isArray(items) || items.length === 0) {
            throw new Error('Sales return must contain at least one item');
        }

        const { ProductRepository } = require('../products/products.repository');

        // Generate Return number
        const return_number = `SLSRTN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        let total_amount = 0;
        let discount_amount = 0;
        let tax_amount = 0;

        const productIds = items.map(i => i.product_id);
        const products = await ProductRepository.findByIds(productIds);
        const productMap = new Map(products.map(p => [String(p.id), p]));

        const processedItems = items.map(item => {
            const quantity = Number(item.quantity) || 0;
            const unit_price = Number(item.unit_price) || 0;
            const discount = Number(item.discount) || 0;

            if (quantity <= 0 || unit_price < 0) {
                throw new Error('Invalid quantity or unit price');
            }

            const product = productMap.get(String(item.product_id));
            if (!product) {
                throw new Error(`Product not found: ${item.product_id}`);
            }

            const tax_percent = Number(product.sales_tax) || 0;
            const line_subtotal = quantity * unit_price;
            const line_total = Math.max(line_subtotal - discount, 0);
            const item_tax_amount = (line_total * tax_percent) / 100;

            discount_amount += discount;
            total_amount += line_total;
            tax_amount += item_tax_amount;

            return {
                ...item,
                quantity,
                unit_price,
                discount,
                tax_amount: item_tax_amount,
                line_total: line_total
            };
        });

        const returnData = {
            ...returnInfo,
            return_number,
            total_amount,
            discount_amount,
            tax_amount,
            grand_total: total_amount + tax_amount,
            created_by: userId
        };

        const result = await SalesReturnRepository.create(returnData, processedItems);

        // Optional: Update stock if the items are physically returned
        if (returnData.status === 'returned') {
            const StockMovement = require('../products/stock-movement.model');
            for (const item of processedItems) {
                const product = await ProductRepository.findById(item.product_id);
                if (product) {
                    const newStock = (Number(product.stock_quantity) || 0) + item.quantity;
                    await ProductRepository.update(item.product_id, { stock_quantity: newStock });

                    await StockMovement.create({
                        product_id: item.product_id,
                        movement_type: 'sales_return',
                        quantity: item.quantity,
                        reference_type: 'sales_return',
                        reference_id: result.id,
                        notes: `Stock increased from sales return ${return_number}`,
                        created_by: userId
                    });
                }
            }
        }

        return result;
    }

    async updateSalesReturn(id, data) {
        const sr = await SalesReturnRepository.update(id, data);
        if (!sr) {
            throw new Error('Sales return not found');
        }
        return sr;
    }

    async deleteSalesReturn(id) {
        const sr = await SalesReturnRepository.delete(id);
        if (!sr) {
            throw new Error('Sales return not found');
        }
        return sr;
    }

    // Sales Return Invoices
    async getAllSalesReturnInvoices(filters = {}, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const result = await SalesReturnInvoiceRepository.findAll(filters, limit, offset);
        return {
            data: result.rows,
            total: result.count
        };
    }

    async getSalesReturnInvoiceById(id) {
        const invoice = await SalesReturnInvoiceRepository.findById(id);
        if (!invoice) {
            throw new Error('Sales return invoice not found');
        }
        return invoice;
    }

    async createSalesReturnInvoice(data, userId) {
        const sr = await SalesReturnRepository.findByIdSimple(data.sales_return_id);
        if (!sr) {
            throw new Error('Sales return not found');
        }

        const invoice_number = `SLSRINV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const total_amount = parseFloat(sr.total_amount || 0) - parseFloat(sr.discount_amount || 0) + parseFloat(sr.tax_amount || 0);

        const invoiceData = {
            ...data,
            invoice_number,
            total_amount,
            created_by: userId
        };

        const invoice = await SalesReturnInvoiceRepository.create(invoiceData);

        // Accounting: Sales Return (Contra-Revenue or Expense)
        if (invoice) {
            try {
                await AccountingService.processTransaction({
                    type: 'SALES_RETURN',
                    amount: total_amount,
                    tax_amount: parseFloat(sr.tax_amount || 0),
                    payment_mode: 'DUE',
                    date: invoice.invoice_date || new Date(),
                    description: `Sales Return Invoice ${invoice.invoice_number}`
                });
            } catch (err) {
                console.error('Accounting Error:', err.message);
            }
        }

        return invoice;
    }

    async updateSalesReturnInvoice(id, data) {
        const invoice = await SalesReturnInvoiceRepository.update(id, data);
        if (!invoice) {
            throw new Error('Sales return invoice not found');
        }
        return invoice;
    }

    // Sales Return Payments (Refunds to Customers)
    async getAllSalesReturnPayments(filters = {}, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const result = await SalesReturnPaymentRepository.findAll(filters, limit, offset);
        return {
            data: result.rows,
            total: result.count
        };
    }

    async getSalesReturnPaymentById(id) {
        const payment = await SalesReturnPaymentRepository.findById(id);
        if (!payment) {
            throw new Error('Sales return payment not found');
        }
        return payment;
    }

    async createSalesReturnPayment(data, userId) {
        const sr = await SalesReturnRepository.findByIdSimple(data.sales_return_id);
        if (!sr) {
            throw new Error('Sales return not found');
        }

        const reference_number = data.reference_number || `SLSRREF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        let invoice_id = data.invoice_id;
        if (!invoice_id) {
            const invoice = await SalesReturnInvoiceRepository.findBySalesReturnId(sr.id);
            if (invoice) {
                invoice_id = invoice.id;
            }
        }

        const paymentData = {
            ...data,
            invoice_id,
            reference_number,
            created_by: userId
        };

        const payment = await SalesReturnPaymentRepository.create(paymentData);

        // Calculate total refund amount
        const totalAmount = parseFloat(sr.total_amount || 0);
        const discountAmount = parseFloat(sr.discount_amount || 0);
        const taxAmount = parseFloat(sr.tax_amount || 0);
        const grandTotal = totalAmount - discountAmount + taxAmount;

        // Get all payments for this sales return to calculate total refunded
        const { SalesReturnPayment } = require('./sales-return.models');
        const allPayments = await SalesReturnPayment.findAll({
            where: { sales_return_id: sr.id }
        });

        const totalRefunded = allPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

        // Update Invoice Status
        if (invoice_id) {
            let invoiceStatus = 'draft';
            if (totalRefunded >= grandTotal) {
                invoiceStatus = 'refunded';
            } else if (totalRefunded > 0) {
                invoiceStatus = 'issued';
            }

            await SalesReturnInvoiceRepository.update(invoice_id, {
                status: invoiceStatus
            });
        }

        // Update Sales Return payment_status
        let paymentStatus = 'pending';
        if (totalRefunded >= grandTotal) {
            paymentStatus = 'refunded';
        } else if (totalRefunded > 0) {
            paymentStatus = 'partial';
        }

        await SalesReturnRepository.update(sr.id, {
            payment_status: paymentStatus
        });

        // Update Stock when fully refunded (if not already updated)
        if (paymentStatus === 'refunded' && sr.status !== 'returned') {
            const StockMovement = require('../products/stock-movement.model');
            const { ProductRepository } = require('../products/products.repository');

            // Fetch sales return with items
            const srWithItems = await SalesReturnRepository.findById(sr.id);

            if (srWithItems && srWithItems.items && Array.isArray(srWithItems.items)) {
                for (const item of srWithItems.items) {
                    const product = await ProductRepository.findById(item.product_id);
                    if (!product) {
                        console.error(`Product with ID ${item.product_id} not found`);
                        continue;
                    }

                    // Add stock back (items are returned)
                    const currentStock = Number(product.stock_quantity) || 0;
                    const returnQty = Number(item.quantity) || 0;

                    const newStock = currentStock + returnQty;
                    await ProductRepository.update(item.product_id, {
                        stock_quantity: newStock
                    });

                    // Record stock movement
                    await StockMovement.create({
                        product_id: item.product_id,
                        movement_type: 'sales_return',
                        quantity: returnQty,
                        reference_type: 'sales_return',
                        reference_id: sr.id,
                        notes: `Stock increased from sales return ${sr.return_number} (fully refunded)`,
                        created_by: userId
                    });
                }
            }

            // Update sales return status
            await SalesReturnRepository.update(sr.id, { status: 'returned' });
        }

        // Accounting: Refund Out (Dr AR or Dr Sales Return / Cr Cash)
        if (payment) {
            try {
                let mode = 'CASH';
                const method = (payment.payment_method || '').toUpperCase();
                if (method.includes('BANK') || method.includes('CARD') || method.includes('TRANSFER') || method.includes('CHEQUE')) {
                    mode = 'BANK';
                }

                await AccountingService.processTransaction({
                    type: 'PAYMENT_OUT',
                    amount: payment.amount,
                    payment_mode: mode,
                    date: payment.payment_date || new Date(),
                    description: `Refund ${payment.reference_number} for Sales Return #${sr.return_number}`
                });
            } catch (err) {
                console.error('Accounting Refund Error:', err.message);
            }
        }

        return payment;
    }
}

module.exports = new SalesReturnService();
