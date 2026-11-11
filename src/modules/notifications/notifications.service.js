const { Notification } = require('./notifications.model');
const { Op } = require('sequelize');

class NotificationService {
    /**
     * Get all notifications for a user
     */
    async getAllNotifications(userId, filters = {}) {
        const where = {
            [Op.or]: [
                { user_id: userId },
                { user_id: null } // Notifications for all users
            ]
        };

        // Filter by read status
        if (filters.is_read !== undefined) {
            where.is_read = filters.is_read === 'true';
        }

        // Filter by type
        if (filters.type) {
            where.type = filters.type;
        }

        const notifications = await Notification.findAll({
            where,
            order: [['created_at', 'DESC']],
            limit: filters.limit || 50
        });

        return {
            total: notifications.length,
            unread: notifications.filter(n => !n.is_read).length,
            notifications: notifications.map(n => this._transformNotification(n))
        };
    }

    /**
     * Get unread count for a user
     */
    async getUnreadCount(userId) {
        const count = await Notification.count({
            where: {
                [Op.or]: [
                    { user_id: userId },
                    { user_id: null }
                ],
                is_read: false
            }
        });

        return { count };
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId, userId) {
        const notification = await Notification.findOne({
            where: {
                id: notificationId,
                [Op.or]: [
                    { user_id: userId },
                    { user_id: null }
                ]
            }
        });

        if (!notification) {
            throw new Error('Notification not found');
        }

        await notification.update({
            is_read: true,
            read_at: new Date()
        });

        return this._transformNotification(notification);
    }

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId) {
        await Notification.update(
            {
                is_read: true,
                read_at: new Date()
            },
            {
                where: {
                    [Op.or]: [
                        { user_id: userId },
                        { user_id: null }
                    ],
                    is_read: false
                }
            }
        );

        return { success: true, message: 'All notifications marked as read' };
    }

    /**
     * Delete a notification
     */
    async deleteNotification(notificationId, userId) {
        const notification = await Notification.findOne({
            where: {
                id: notificationId,
                [Op.or]: [
                    { user_id: userId },
                    { user_id: null }
                ]
            }
        });

        if (!notification) {
            throw new Error('Notification not found');
        }

        await notification.destroy();

        return { success: true, message: 'Notification deleted' };
    }

    /**
     * Create a new notification
     */
    async createNotification(data) {
        const notification = await Notification.create({
            user_id: data.user_id || null,
            type: data.type,
            title: data.title,
            message: data.message,
            link: data.link || null,
            reference_type: data.reference_type || null,
            reference_id: data.reference_id || null,
            priority: data.priority || 'medium'
        });

        return this._transformNotification(notification);
    }

    /**
     * Helper: Create order notification
     */
    async createOrderNotification(orderData, type = 'new') {
        let title, message, link;

        if (type === 'new') {
            title = 'New Order Received';
            message = `Order ${orderData.order_number} from ${orderData.customer?.name || orderData.customer?.company || 'Customer'}`;
            link = `/dashboard/sales/orders/${orderData.id}`;
        } else if (type === 'pending') {
            title = 'Order Pending Confirmation';
            message = `Order ${orderData.order_number} is awaiting confirmation`;
            link = `/dashboard/sales/orders/pending`;
        } else if (type === 'confirmed') {
            title = 'Order Confirmed';
            message = `Order ${orderData.order_number} has been confirmed`;
            link = `/dashboard/sales/orders/${orderData.id}`;
        }

        return await this.createNotification({
            type: 'order',
            title,
            message,
            link,
            reference_type: 'order',
            reference_id: orderData.id,
            priority: 'high'
        });
    }

    /**
     * Helper: Create low stock notification
     */
    async createLowStockNotification(productData) {
        return await this.createNotification({
            type: 'stock',
            title: 'Low Stock Alert',
            message: `${productData.name} is running low (${productData.stock_quantity} units left)`,
            link: '/dashboard/products',
            reference_type: 'product',
            reference_id: productData.id,
            priority: 'urgent'
        });
    }

    /**
     * Helper: Create payment notification
     */
    async createPaymentNotification(paymentData, type = 'received') {
        let title, message, link;

        if (type === 'received') {
            title = 'Payment Received';
            message = `Payment of ${paymentData.amount} received for invoice ${paymentData.invoice_number}`;
            link = `/dashboard/sales/payments`;
        } else if (type === 'overdue') {
            title = 'Payment Overdue';
            message = `Invoice ${paymentData.invoice_number} payment is overdue`;
            link = `/dashboard/sales/payments`;
        }

        return await this.createNotification({
            type: 'payment',
            title,
            message,
            link,
            reference_type: 'payment',
            reference_id: paymentData.id,
            priority: type === 'overdue' ? 'urgent' : 'medium'
        });
    }

    /**
     * Helper: Create customer notification
     */
    async createCustomerNotification(customerData, type = 'new') {
        let title, message, link;

        if (type === 'new') {
            title = 'New Customer Added';
            message = `${customerData.company || customerData.name} was added as a new customer`;
            link = '/dashboard/customers';
        }

        return await this.createNotification({
            type: 'customer',
            title,
            message,
            link,
            reference_type: 'customer',
            reference_id: customerData.id,
            priority: 'low'
        });
    }

    /**
     * Helper: Create system notification
     */
    async createSystemNotification(title, message, priority = 'low') {
        return await this.createNotification({
            type: 'system',
            title,
            message,
            priority
        });
    }

    /**
     * Transform notification for API response
     */
    _transformNotification(notification) {
        return {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            link: notification.link,
            reference_type: notification.reference_type,
            reference_id: notification.reference_id,
            is_read: notification.is_read,
            priority: notification.priority,
            read_at: notification.read_at,
            created_at: notification.created_at,
            timestamp: notification.created_at
        };
    }
}

module.exports = new NotificationService();
