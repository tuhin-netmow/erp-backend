const { PurchaseReturnRepository, PurchaseReturnInvoiceRepository, PurchaseReturnPaymentRepository } = require('./purchase-return.repository');
const AccountingService = require('../accounting/accounting.service');

class PurchaseReturnService {
    // Purchase Returns
    async getAllPurchaseReturns(filters = {}, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const result = await PurchaseReturnRepository.findAll(filters, limit, offset);

        const data = result.rows.map(row => {
            const pr = row.get({ plain: true });
            const totalAmount = parseFloat(pr.total_amount || 0);
            const discountAmount = parseFloat(pr.discount_amount || 0);
            const taxAmount = parseFloat(pr.tax_amount || 0);
            const refunded = parseFloat(pr.total_refunded_amount || 0);

            const grandTotal = totalAmount - discountAmount + taxAmount;
            const dueRefund = grandTotal - refunded;

            return {
                ...pr,
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

    async getPurchaseReturnById(id) {
        const pr = await PurchaseReturnRepository.findById(id);
        if (!pr) {
            throw new Error('Purchase return not found');
        }

        const data = pr.get({ plain: true });
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

    async createPurchaseReturn(data, userId) {
        let { items, ...returnInfo } = data;

        if (returnInfo.purchase_order_id === 0) {
            returnInfo.purchase_order_id = null;
        }

        if (!Array.isArray(items) || items.length === 0) {
            throw new Error('Purchase return must contain at least one item');
        }

        const { ProductRepository } = require('../products/products.repository');

        // Generate Return number
        const return_number = `PRRTN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        let total_amount = 0;
        let discount_amount = 0;
        let tax_amount = 0;

        const productIds = items.map(i => i.product_id);
        const products = await ProductRepository.findByIds(productIds);
        const productMap = new Map(products.map(p => [String(p.id), p]));

        const processedItems = items.map(item => {
            const quantity = Number(item.quantity) || 0;
            const unit_cost = Number(item.unit_cost) || 0;
            const discount = Number(item.discount) || 0;

            if (quantity <= 0 || unit_cost < 0) {
                throw new Error('Invalid quantity or unit cost');
            }

            const product = productMap.get(String(item.product_id));
            if (!product) {
                throw new Error(`Product not found: ${item.product_id}`);
            }

            const tax_percent = Number(product.purchase_tax) || 0;
            const line_subtotal = quantity * unit_cost;
            const line_total = Math.max(line_subtotal - discount, 0);
            const item_tax_amount = (line_total * tax_percent) / 100;

            discount_amount += discount;
            total_amount += line_total;
            tax_amount += item_tax_amount;

            return {
                ...item,
                quantity,
                unit_cost,
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

        const result = await PurchaseReturnRepository.create(returnData, processedItems);

        // Optional: Update stock if the items are physically returned
        if (returnData.status === 'returned') {
            const StockMovement = require('../products/stock-movement.model');
            for (const item of processedItems) {
                const product = await ProductRepository.findById(item.product_id);
                if (product) {
                    const newStock = (Number(product.stock_quantity) || 0) - item.quantity;
                    await ProductRepository.update(item.product_id, { stock_quantity: newStock });

                    await StockMovement.create({
                        product_id: item.product_id,
                        movement_type: 'purchase_return',
                        quantity: -item.quantity,
                        reference_type: 'purchase_return',
                        reference_id: result.id,
                        notes: `Stock reduced from purchase return ${return_number}`,
                        created_by: userId
                    });
                }
            }
        }

        return result;
    }

    async updatePurchaseReturn(id, data) {
        const pr = await PurchaseReturnRepository.update(id, data);
        if (!pr) {
            throw new Error('Purchase return not found');
        }
        return pr;
    }

    async deletePurchaseReturn(id) {
        const pr = await PurchaseReturnRepository.delete(id);
        if (!pr) {
            throw new Error('Purchase return not found');
        }
        return pr;
    }

    // Purchase Return Invoices
    async getAllPurchaseReturnInvoices(filters = {}, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const result = await PurchaseReturnInvoiceRepository.findAll(filters, limit, offset);
        return {
            data: result.rows,
            total: result.count
        };
    }

    async getPurchaseReturnInvoiceById(id) {
        const invoice = await PurchaseReturnInvoiceRepository.findById(id);
        if (!invoice) {
            throw new Error('Purchase return invoice not found');
        }
        return invoice;
    }

    async createPurchaseReturnInvoice(data, userId) {
        const pr = await PurchaseReturnRepository.findByIdSimple(data.purchase_return_id);
        if (!pr) {
            throw new Error('Purchase return not found');
        }

        const invoice_number = `PRINV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const total_amount = parseFloat(pr.total_amount || 0) - parseFloat(pr.discount_amount || 0) + parseFloat(pr.tax_amount || 0);

        const invoiceData = {
            ...data,
            invoice_number,
            total_amount,
            created_by: userId
        };

        const invoice = await PurchaseReturnInvoiceRepository.create(invoiceData);

        // Accounting: Purchase Return (Revenue/Income or Contra-Expense)
        if (invoice) {
            try {
                await AccountingService.processTransaction({
                    type: 'PURCHASE_RETURN',
                    amount: total_amount,
                    tax_amount: parseFloat(pr.tax_amount || 0),
                    payment_mode: 'DUE',
                    date: invoice.invoice_date || new Date(),
                    description: `Purchase Return Invoice ${invoice.invoice_number}`
                });
            } catch (err) {
                console.error('Accounting Error:', err.message);
            }
        }

        return invoice;
    }

    async updatePurchaseReturnInvoice(id, data) {
        const invoice = await PurchaseReturnInvoiceRepository.update(id, data);
        if (!invoice) {
            throw new Error('Purchase return invoice not found');
        }
        return invoice;
    }

    // Purchase Return Payments (Refunds)
    async getAllPurchaseReturnPayments(filters = {}, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const result = await PurchaseReturnPaymentRepository.findAll(filters, limit, offset);
        return {
            data: result.rows,
            total: result.count
        };
    }

    async getPurchaseReturnPaymentById(id) {
        const payment = await PurchaseReturnPaymentRepository.findById(id);
        if (!payment) {
            throw new Error('Purchase return payment not found');
        }
        return payment;
    }

    async createPurchaseReturnPayment(data, userId) {
        const pr = await PurchaseReturnRepository.findByIdSimple(data.purchase_return_id);
        if (!pr) {
            throw new Error('Purchase return not found');
        }

        const reference_number = data.reference_number || `PRREF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        let invoice_id = data.invoice_id;
        if (!invoice_id) {
            const invoice = await PurchaseReturnInvoiceRepository.findByPurchaseReturnId(pr.id);
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

        const payment = await PurchaseReturnPaymentRepository.create(paymentData);

        // Accounting: Refund In (Dr Cash / Cr AP or Cr Purchase Return)
        if (payment) {
            try {
                let mode = 'CASH';
                const method = (payment.payment_method || '').toUpperCase();
                if (method.includes('BANK') || method.includes('CARD') || method.includes('TRANSFER') || method.includes('CHEQUE')) {
                    mode = 'BANK';
                }

                await AccountingService.processTransaction({
                    type: 'PAYMENT_IN',
                    amount: payment.amount,
                    payment_mode: mode,
                    date: payment.payment_date || new Date(),
                    description: `Refund ${payment.reference_number} for PR #${pr.return_number}`
                });
            } catch (err) {
                console.error('Accounting Refund Error:', err.message);
            }
        }

        return payment;
    }
}

module.exports = new PurchaseReturnService();
