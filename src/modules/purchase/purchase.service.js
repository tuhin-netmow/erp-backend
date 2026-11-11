const { PurchaseOrderRepository, PurchaseInvoiceRepository, PurchasePaymentRepository, PurchaseReceiptRepository } = require('./purchase.repository');
const AccountingService = require('../accounting/accounting.service');

class PurchaseService {
    // Purchase Orders
    async getAllPurchaseOrders(filters = {}, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const result = await PurchaseOrderRepository.findAll(filters, limit, offset);

        const data = result.rows.map(row => {
            const order = row.get({ plain: true });

            // Calculate total_price for each item and recalculate total_amount
            if (order.items && order.items.length > 0) {
                order.items = order.items.map(item => ({
                    ...item,
                    total_price: parseFloat(item.unit_cost || 0) * parseInt(item.quantity || 0)
                }));

                // Recalculate total_amount as sum of all item total_price
                order.total_amount = order.items.reduce((sum, item) => sum + item.total_price, 0);
            }

            const totalAmount = parseFloat(order.total_amount || 0);
            const discountAmount = parseFloat(order.discount_amount || 0);
            const taxAmount = parseFloat(order.tax_amount || 0);
            const paid = parseFloat(order.total_paid_amount || 0);

            // Calculate net_amount (total - discount)
            const netAmount = totalAmount - discountAmount;

            // Calculate total_payable_amount (total - discount + tax)
            const totalPayableAmount = totalAmount - discountAmount + taxAmount;

            // Calculate total_due_amount (total_payable - paid)
            const totalDueAmount = totalPayableAmount - paid;

            return {
                ...order,
                total_amount: totalAmount,
                net_amount: netAmount,
                total_payable_amount: totalPayableAmount,
                total_paid_amount: paid,
                total_due_amount: totalDueAmount > 0 ? totalDueAmount : 0
            };
        });

        return {
            data,
            total: result.count
        };
    }

    async getPurchaseOrderById(id) {
        const po = await PurchaseOrderRepository.findById(id);
        if (!po) {
            throw new Error('Purchase order not found');
        }

        // Convert to plain object
        const order = po.get({ plain: true });

        // Calculate total_price for each item and recalculate total_amount
        if (order.items && order.items.length > 0) {
            order.items = order.items.map(item => ({
                ...item,
                total_price: parseFloat(item.unit_cost || 0) * parseInt(item.quantity || 0)
            }));

            // Recalculate total_amount as sum of all item total_price
            order.total_amount = order.items.reduce((sum, item) => sum + item.total_price, 0);
        }

        const totalAmount = parseFloat(order.total_amount || 0);
        const discountAmount = parseFloat(order.discount_amount || 0);
        const taxAmount = parseFloat(order.tax_amount || 0);

        // Calculate total paid from payments
        const totalPaid = order.payments && order.payments.length > 0
            ? order.payments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0)
            : 0;

        // Calculate net_amount (total - discount)
        const netAmount = totalAmount - discountAmount;

        // Calculate total_payable_amount (total - discount + tax)
        const totalPayableAmount = totalAmount - discountAmount + taxAmount;

        // Calculate total_due_amount (total_payable - paid)
        const totalDueAmount = totalPayableAmount - totalPaid;

        // Process invoice if it exists
        if (order.invoice) {
            // Sync invoice total_amount with order's total_amount
            order.invoice.total_amount = totalAmount;

            // Calculate invoice paid_amount from invoice payments
            const invoicePaid = order.invoice.payments && order.invoice.payments.length > 0
                ? order.invoice.payments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0)
                : 0;

            order.invoice.paid_amount = invoicePaid;
            order.invoice.due_amount = totalAmount - invoicePaid;
            order.invoice.due_amount = order.invoice.due_amount > 0 ? order.invoice.due_amount : 0;
        }

        return {
            ...order,
            total_amount: totalAmount,
            net_amount: netAmount,
            total_payable_amount: totalPayableAmount,
            total_paid_amount: totalPaid,
            total_due_amount: totalDueAmount > 0 ? totalDueAmount : 0
        };
    }

    // async createPurchaseOrder(data, userId) {
    //     const { items, ...orderInfo } = data;

    //     // Generate PO number
    //     const po_number = `PO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    //     // Calculate total amount, discount amount, and tax amount
    //     let total_amount = 0;
    //     let discount_amount = 0;
    //     let tax_amount = 0;

    //     if (items && Array.isArray(items)) {
    //         const { ProductRepository } = require('../products/products.repository');

    //         // Use Promise.all to handle async product fetching
    //         items = await Promise.all(
    //             items.map(async (item) => {
    //             const quantity = Number(item.quantity) || 0;
    //             const unit_cost = Number(item.unit_cost) || 0;
    //             const discount = Number(item.discount) || 0;

    //             // Fetch product to get purchase_tax
    //             const product = await ProductRepository.findById(item.product_id);
    //             const purchase_tax_rate = product && product.purchase_tax ? Number(product.purchase_tax) : 0;

    //             const subtotal = quantity * unit_cost;
    //             const line_total = subtotal - discount;

    //             // Calculate item tax
    //             const item_tax_amount = (line_total * purchase_tax_rate) / 100;

    //             discount_amount += discount;
    //             total_amount += line_total;
    //             tax_amount += item_tax_amount;

    //             return {
    //                 ...item,
    //                 tax_amount: item_tax_amount,
    //                 purchase_tax_percent: purchase_tax_rate  // Store the tax percentage
    //             };
    //         })
    //     );
    //     }

    //     const orderData = {
    //         ...orderInfo,
    //         po_number,
    //         total_amount,
    //         discount_amount,
    //         tax_amount,
    //         created_by: userId
    //     };

    //     const order = await PurchaseOrderRepository.create(orderData, items || []);
    //     return order;
    // }

    async createPurchaseOrder(data, userId) {
        let { items, ...orderInfo } = data;

        if (!Array.isArray(items) || items.length === 0) {
            throw new Error('Purchase order must contain at least one item');
        }

        const { ProductRepository } = require('../products/products.repository');

        // Generate PO number using prefix settings
        let po_number = data.po_number;
        if (!po_number) {
            try {
                const { generateNumber } = require('../settings/numbering.helper');
                po_number = await generateNumber('purchase_order');
            } catch (err) {
                console.error('Error generating PO number:', err);
                po_number = `PO-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            }
        }

        let total_amount = 0;
        let discount_amount = 0;
        let tax_amount = 0;

        /* ----------------------------------
           Fetch all products in one query
        -----------------------------------*/
        const productIds = items.map(i => i.product_id);
        const products = await ProductRepository.findByIds(productIds);

        const productMap = new Map(
            products.map(p => [String(p.id), p])
        );

        /* ----------------------------------
           Process items
        -----------------------------------*/
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

            const purchase_tax_percent = Number(product.purchase_tax) || 0;

            const subtotal = quantity * unit_cost;
            const line_total = Math.max(subtotal - discount, 0);
            const item_tax_amount = (line_total * purchase_tax_percent) / 100;

            discount_amount += discount;
            total_amount += line_total;
            tax_amount += item_tax_amount;

            return {
                ...item,
                quantity,
                unit_cost,
                discount,
                tax_amount: item_tax_amount,
                purchase_tax_percent
            };
        });

        /* ----------------------------------
           Prepare order data
        -----------------------------------*/
        const orderData = {
            ...orderInfo,
            po_number,
            total_amount,
            discount_amount,
            tax_amount,
            grand_total: total_amount + tax_amount,
            created_by: userId
        };

        /* ----------------------------------
           Persist (transaction ready)
        -----------------------------------*/
        return PurchaseOrderRepository.create(orderData, processedItems);
    }


    async updatePurchaseOrder(id, data, userId) {
        // Get current order before update
        const currentOrder = await PurchaseOrderRepository.findByIdSimple(id);
        if (!currentOrder) {
            throw new Error('Purchase order not found');
        }

        // Check if status is changing to 'approved'
        const isBeingApproved = data.status === 'approved' && currentOrder.status !== 'approved';

        // Update the order
        const order = await PurchaseOrderRepository.update(id, data);
        if (!order) {
            throw new Error('Purchase order not found');
        }

        // Update stock when PO is approved (if not already processed)
        if (isBeingApproved && currentOrder.status !== 'received' && currentOrder.status !== 'completed') {
            const StockMovement = require('../products/stock-movement.model');
            const { ProductRepository } = require('../products/products.repository');

            // Fetch order with items
            const orderWithItems = await PurchaseOrderRepository.findById(id);

            if (orderWithItems && orderWithItems.items && Array.isArray(orderWithItems.items)) {
                for (const item of orderWithItems.items) {
                    const product = await ProductRepository.findById(item.product_id);
                    if (!product) {
                        console.error(`Product with ID ${item.product_id} not found`);
                        continue;
                    }

                    // Calculate Weighted Average Cost
                    const currentStock = Number(product.stock_quantity) || 0;
                    const currentCost = Number(product.cost) || 0;
                    const incomingQty = Number(item.quantity) || 0;
                    const incomingCost = Number(item.unit_cost) || 0;

                    let newCost = currentCost;
                    if (currentStock + incomingQty > 0) {
                        newCost = ((currentStock * currentCost) + (incomingQty * incomingCost)) / (currentStock + incomingQty);
                    }

                    // Add stock
                    const newStock = currentStock + incomingQty;
                    await ProductRepository.update(item.product_id, {
                        stock_quantity: newStock,
                        cost: newCost
                    });

                    // Record stock movement
                    await StockMovement.create({
                        product_id: item.product_id,
                        movement_type: 'purchase',
                        quantity: incomingQty,
                        reference_type: 'purchase_order',
                        reference_id: order.id,
                        notes: `Stock added from purchase order ${order.po_number} (approved). Cost updated to ${newCost.toFixed(2)}`,
                        created_by: userId || data.updated_by
                    });
                }
            }
        }

        return order;
    }

    async deletePurchaseOrder(id) {
        const order = await PurchaseOrderRepository.delete(id);
        if (!order) {
            throw new Error('Purchase order not found');
        }
        return order;
    }

    // Purchase Invoices
    async getAllPurchaseInvoices(filters = {}, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const result = await PurchaseInvoiceRepository.findAll(filters, limit, offset);

        const data = result.rows.map(row => {
            const invoice = row.get({ plain: true });

            // Process purchase order if it exists
            if (invoice.purchase_order) {
                // Calculate total_price for each item and recalculate total_amount
                if (invoice.purchase_order.items && invoice.purchase_order.items.length > 0) {
                    invoice.purchase_order.items = invoice.purchase_order.items.map(item => ({
                        ...item,
                        total_price: parseFloat(item.unit_cost || 0) * parseInt(item.quantity || 0)
                    }));

                    // Recalculate total_amount as sum of all item total_price
                    invoice.purchase_order.total_amount = invoice.purchase_order.items.reduce(
                        (sum, item) => sum + item.total_price,
                        0
                    );
                }

                const poTotalAmount = parseFloat(invoice.purchase_order.total_amount || 0);
                const poDiscountAmount = parseFloat(invoice.purchase_order.discount_amount || 0);
                const poTaxAmount = parseFloat(invoice.purchase_order.tax_amount || 0);

                // Calculate net_amount (total - discount)
                const netAmount = poTotalAmount - poDiscountAmount;

                // Calculate total_payable_amount (total - discount + tax)
                const totalPayableAmount = poTotalAmount - poDiscountAmount + poTaxAmount;

                // Add calculated fields to purchase order
                invoice.purchase_order.net_amount = netAmount;
                invoice.purchase_order.total_payable_amount = totalPayableAmount;

                // Sync invoice total_amount with purchase order's total_amount
                invoice.total_amount = poTotalAmount;

                // Add total_payable_amount to invoice (same as PO's total_payable_amount)
                invoice.total_payable_amount = totalPayableAmount;
            }

            const paid = parseFloat(invoice.paid_amount || 0);
            const total = parseFloat(invoice.total_amount || 0);
            const payable = parseFloat(invoice.total_payable_amount || total);

            return {
                ...invoice,
                paid_amount: paid,
                total_payable_amount: payable,
                due_amount: payable - paid > 0 ? payable - paid : 0
            };
        });

        return {
            data,
            total: result.count
        };
    }

    async getPurchaseInvoiceById(id) {
        const invoice = await PurchaseInvoiceRepository.findById(id);
        if (!invoice) {
            throw new Error('Purchase invoice not found');
        }

        const data = invoice.toJSON();

        // Process purchase order if it exists
        if (data.purchase_order) {
            // Calculate total_price for each item and recalculate total_amount
            if (data.purchase_order.items && data.purchase_order.items.length > 0) {
                data.purchase_order.items = data.purchase_order.items.map(item => ({
                    ...item,
                    total_price: parseFloat(item.unit_cost || 0) * parseInt(item.quantity || 0)
                }));

                // Recalculate total_amount as sum of all item total_price
                data.purchase_order.total_amount = data.purchase_order.items.reduce(
                    (sum, item) => sum + item.total_price,
                    0
                );
            }

            const poTotalAmount = parseFloat(data.purchase_order.total_amount || 0);
            const poDiscountAmount = parseFloat(data.purchase_order.discount_amount || 0);
            const poTaxAmount = parseFloat(data.purchase_order.tax_amount || 0);

            // Calculate net_amount (total - discount)
            const netAmount = poTotalAmount - poDiscountAmount;

            // Calculate total_payable_amount (total - discount + tax)
            const totalPayableAmount = poTotalAmount - poDiscountAmount + poTaxAmount;

            // Add calculated fields to purchase order
            data.purchase_order.net_amount = netAmount;
            data.purchase_order.total_payable_amount = totalPayableAmount;

            // Sync invoice total_amount with purchase order's total_amount
            data.total_amount = poTotalAmount;

            // Add total_payable_amount to invoice (same as PO's total_payable_amount)
            data.total_payable_amount = totalPayableAmount;
        }

        data.paid_amount = parseFloat(data.paid_amount || 0);
        const payable = parseFloat(data.total_payable_amount || data.total_amount || 0);
        data.total_payable_amount = payable;
        data.due_amount = payable - data.paid_amount;
        data.due_amount = data.due_amount > 0 ? data.due_amount : 0;

        return data;
    }

    async createPurchaseInvoice(data, userId) {
        // Verify purchase order exists
        const order = await PurchaseOrderRepository.findById(data.purchase_order_id);
        if (!order) {
            throw new Error('Purchase order not found');
        }

        // Generate unique invoice number using prefix settings
        let invoice_number = data.invoice_number;
        if (!invoice_number) {
            try {
                const { generateNumber } = require('../settings/numbering.helper');
                invoice_number = await generateNumber('purchase_invoice');
            } catch (err) {
                console.error('Error generating purchase invoice number:', err);
                invoice_number = `PINV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            }
        }

        // Create invoice with auto-generated fields
        const subtotal = parseFloat(order.total_amount || 0);
        const discount = parseFloat(order.discount_amount || 0);
        const tax = parseFloat(order.tax_amount || 0);
        const totalPayable = subtotal - discount + tax;

        const invoiceData = {
            ...data,
            invoice_number,
            total_amount: subtotal,
            created_by: userId
        };

        const invoice = await PurchaseInvoiceRepository.create(invoiceData);

        // Accounting: Book Purchase (Due)
        if (invoice) {
            try {
                await AccountingService.processTransaction({
                    type: 'PURCHASE',
                    amount: totalPayable,
                    tax_amount: tax,
                    payment_mode: 'DUE',
                    date: invoice.invoice_date || new Date(),
                    description: `Purchase Invoice ${invoice.invoice_number}`
                });
            } catch (err) {
                console.error('Accounting Error:', err.message);
            }
        }

        return invoice;
    }

    async updatePurchaseInvoice(id, data) {
        const invoice = await PurchaseInvoiceRepository.update(id, data);
        if (!invoice) {
            throw new Error('Purchase invoice not found');
        }
        return invoice;
    }

    // Purchase Payments
    async getAllPurchasePayments(filters = {}, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const result = await PurchasePaymentRepository.findAll(filters, limit, offset);
        return {
            data: result.rows,
            total: result.count
        };
    }

    async getPurchasePaymentById(id) {
        const result = await PurchasePaymentRepository.findById(id);
        if (!result) {
            throw new Error('Purchase payment not found');
        }

        const payment = result.toJSON();

        // Calculate fields for Purchase Order
        if (payment.purchase_order) {
            const poTotal = parseFloat(payment.purchase_order.total_amount || 0);
            const poDiscount = parseFloat(payment.purchase_order.discount_amount || 0);
            const poTax = parseFloat(payment.purchase_order.tax_amount || 0);

            payment.purchase_order.net_amount = poTotal - poDiscount;
            payment.purchase_order.total_payable_amount = poTotal - poDiscount + poTax;
        }

        // Calculate fields for Invoice
        if (payment.invoice) {
            // If invoice is linked to a PO, usually the amounts are consistent. 
            // We'll trust the PO's structure if available, or just pass what we have if the invoice has its own fields.
            // Based on other methods, we often derive invoice payable from PO details if linked.

            if (payment.purchase_order) {
                // Sync with PO calculations as seen in getPurchaseInvoiceById
                const poTotal = parseFloat(payment.purchase_order.total_amount || 0);
                const poDiscount = parseFloat(payment.purchase_order.discount_amount || 0);
                const poTax = parseFloat(payment.purchase_order.tax_amount || 0);

                payment.invoice.net_amount = poTotal - poDiscount;
                payment.invoice.total_payable_amount = poTotal - poDiscount + poTax;
            } else {
                // Fallback if no PO (unlikely for purchase payment), just use total_amount
                payment.invoice.net_amount = parseFloat(payment.invoice.total_amount || 0);
                payment.invoice.total_payable_amount = parseFloat(payment.invoice.total_amount || 0);
            }
        }

        return payment;
    }

    async createPurchasePayment(data, userId) {
        // Verify purchase order exists
        const order = await PurchaseOrderRepository.findByIdSimple(data.purchase_order_id);
        if (!order) {
            throw new Error('Purchase order not found');
        }

        if (data.wastage && parseFloat(data.wastage) > 0) {
            const wastageAmt = parseFloat(data.wastage);
            order.discount_amount = parseFloat(order.discount_amount || 0) + wastageAmt;
            await order.save();
        }

        // Generate reference number if not provided
        const reference_number = data.reference_number || `PREF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        let invoice_id = data.invoice_id;
        if (!invoice_id) {
            const invoice = await PurchaseInvoiceRepository.findByPurchaseOrderId(order.id);
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

        const payment = await PurchasePaymentRepository.create(paymentData);

        // Calculate total payable amount
        const totalAmount = parseFloat(order.total_amount || 0);
        const discountAmount = parseFloat(order.discount_amount || 0);
        const taxAmount = parseFloat(order.tax_amount || 0);
        const totalPayable = totalAmount - discountAmount + taxAmount;

        // Get all payments for this purchase order to calculate total paid
        const { PurchasePayment } = require('./purchase.models');
        const allPayments = await PurchasePayment.findAll({
            where: { purchase_order_id: order.id }
        });

        const totalPaid = allPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

        // Update Invoice Status
        if (invoice_id) {
            let invoiceStatus = 'draft';
            if (totalPaid >= totalPayable) {
                invoiceStatus = 'paid';
            } else if (totalPaid > 0) {
                invoiceStatus = 'partial';
            }

            await PurchaseInvoiceRepository.update(invoice_id, {
                status: invoiceStatus,
                payment_status: invoiceStatus
            });
        }

        // Update Purchase Order payment_status
        let paymentStatus = 'unpaid';
        if (totalPaid >= totalPayable) {
            paymentStatus = 'paid';
        } else if (totalPaid > 0) {
            paymentStatus = 'partial';
        }

        await PurchaseOrderRepository.update(order.id, {
            payment_status: paymentStatus
        });

        // Update Stock when fully paid (if not already received/approved via receipt or approval)
        if (paymentStatus === 'paid' && order.status !== 'received' && order.status !== 'completed' && order.status !== 'approved') {
            const StockMovement = require('../products/stock-movement.model');
            const { ProductRepository } = require('../products/products.repository');

            // Fetch order with items
            const orderWithItems = await PurchaseOrderRepository.findById(order.id);

            if (orderWithItems && orderWithItems.items && Array.isArray(orderWithItems.items)) {
                for (const item of orderWithItems.items) {
                    const product = await ProductRepository.findById(item.product_id);
                    if (!product) {
                        console.error(`Product with ID ${item.product_id} not found`);
                        continue;
                    }

                    // Calculate Weighted Average Cost
                    const currentStock = Number(product.stock_quantity) || 0;
                    const currentCost = Number(product.cost) || 0;
                    const incomingQty = Number(item.quantity) || 0;
                    const incomingCost = Number(item.unit_cost) || 0;

                    let newCost = currentCost;
                    if (currentStock + incomingQty > 0) {
                        newCost = ((currentStock * currentCost) + (incomingQty * incomingCost)) / (currentStock + incomingQty);
                    }

                    // Add stock
                    const newStock = currentStock + incomingQty;
                    await ProductRepository.update(item.product_id, {
                        stock_quantity: newStock,
                        cost: newCost
                    });

                    // Record stock movement
                    await StockMovement.create({
                        product_id: item.product_id,
                        movement_type: 'purchase',
                        quantity: incomingQty,
                        reference_type: 'purchase_order',
                        reference_id: order.id,
                        notes: `Stock added from purchase order ${order.po_number} (fully paid). Cost updated to ${newCost.toFixed(2)}`,
                        created_by: userId
                    });
                }
            }

            // Update purchase order status
            await PurchaseOrderRepository.update(order.id, { status: 'received' });
        }

        // Accounting: Payment Out (Dr AP / Cr Cash)
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
                    description: `Payment ${payment.reference_number} for PO #${order.po_number}`
                });
            } catch (err) {
                console.error('Accounting Payment Error:', err.message);
            }
        }

        return payment;
    }

    // Purchase Receipts (Goods Receiving)
    async createPurchaseReceipt(purchaseOrderId, data, userId) {
        // Verify purchase order exists
        const order = await PurchaseOrderRepository.findById(purchaseOrderId);
        if (!order) {
            throw new Error('Purchase order not found');
        }

        // Generate receipt number
        const receipt_number = `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const receiptData = {
            ...data,
            purchase_order_id: purchaseOrderId,
            receipt_number,
            created_by: userId
        };

        // Convert receipt_date string to Date object if provided
        if (data.receipt_date) {
            receiptData.receipt_date = new Date(data.receipt_date);
        }

        // If status is 'completed', set received_at
        if (data.status === 'completed' && !data.received_at) {
            receiptData.received_at = data.receipt_date ? new Date(data.receipt_date) : new Date();
        }

        const receipt = await PurchaseReceiptRepository.create(receiptData);

        // Update stock when goods are received (only if not already approved)
        if (data.status === 'completed' && order.status !== 'approved') {
            const StockMovement = require('../products/stock-movement.model');
            const { ProductRepository } = require('../products/products.repository');

            // Add stock for each item in the purchase order
            if (order.items && Array.isArray(order.items)) {
                for (const item of order.items) {
                    // Get current product stock
                    const product = await ProductRepository.findById(item.product_id);
                    if (!product) {
                        throw new Error(`Product with ID ${item.product_id} not found`);
                    }

                    // Calculate Weighted Average Cost
                    // New Avg Cost = ((Current Stock * Current Cost) + (Incoming Qty * Incoming Cost)) / (Current Stock + Incoming Qty)
                    const currentStock = Number(product.stock_quantity) || 0;
                    const currentCost = Number(product.cost) || 0;
                    const incomingQty = Number(item.quantity) || 0;
                    const incomingCost = Number(item.unit_cost) || 0;

                    let newCost = currentCost;
                    if (currentStock + incomingQty > 0) {
                        newCost = ((currentStock * currentCost) + (incomingQty * incomingCost)) / (currentStock + incomingQty);
                    }

                    // Add stock
                    const newStock = currentStock + incomingQty;
                    await ProductRepository.update(item.product_id, {
                        stock_quantity: newStock,
                        cost: newCost // Update Product Cost with new Weighted Average
                    });

                    // Record stock movement
                    await StockMovement.create({
                        product_id: item.product_id,
                        movement_type: 'purchase',
                        quantity: item.quantity, // Positive for stock in
                        reference_type: 'purchase_order',
                        reference_id: order.id,
                        notes: `Stock added from purchase order ${order.po_number}. Cost updated to ${newCost.toFixed(2)}`,
                        created_by: userId
                    });
                }
            }

            // Update purchase order status
            await PurchaseOrderRepository.update(purchaseOrderId, { status: 'received' });
        } else if (data.status === 'partial') {
            await PurchaseOrderRepository.update(purchaseOrderId, { status: 'partial' });
        }

        return receipt;
    }

    async getPurchaseOrderLocations() {
        const purchaseOrders = await PurchaseOrderRepository.findPurchaseOrdersWithSupplierLocation();

        return {
            total: purchaseOrders.length,
            locations: purchaseOrders.map(po => ({
                id: po.id,
                po_number: po.po_number,
                status: po.status,
                total_amount: parseFloat(po.total_amount),
                order_date: po.order_date,
                expected_delivery_date: po.expected_delivery_date,
                supplier: {
                    id: po.supplier.id,
                    name: po.supplier.name,
                    contact_person: po.supplier.contact_person,
                    address: po.supplier.address,
                    city: po.supplier.city,
                    phone: po.supplier.phone,
                    email: po.supplier.email
                },
                coordinates: {
                    lat: parseFloat(po.supplier.latitude),
                    lng: parseFloat(po.supplier.longitude)
                }
            }))
        };
    }
}

module.exports = new PurchaseService();
