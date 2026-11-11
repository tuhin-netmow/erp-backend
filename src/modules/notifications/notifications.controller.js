const NotificationService = require('./notifications.service');
const { success, error } = require('../../core/utils/response');
const { User } = require('../users/user.model');

class NotificationController {
    // Check if user is Superadmin
    async _isSuperadmin(req) {
        try {
            const userId = req.user?.id;
            if (!userId) return false;

            // Fetch user with role from database
            const user = await User.findOne({
                where: { id: userId },
                include: ['role']
            });

            if (!user || !user.role) return false;

            const userRoleName = user.role.name || '';
            return userRoleName.toLowerCase() === 'superadmin';
        } catch (err) {
            console.error('Error checking superadmin status:', err);
            return false;
        }
    }

    async getAllNotifications(req, res) {
        try {
            const userId = req.user?.id;
            const filters = {
                is_read: req.query.is_read,
                type: req.query.type,
                limit: req.query.limit
            };

            const result = await NotificationService.getAllNotifications(userId, filters);
            return success(res, 'Notifications retrieved successfully', result);
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async getUnreadCount(req, res) {
        try {
            const userId = req.user?.id;
            const result = await NotificationService.getUnreadCount(userId);
            return success(res, 'Unread count retrieved successfully', result);
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async markAsRead(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;

            const result = await NotificationService.markAsRead(id, userId);
            return success(res, 'Notification marked as read', result);
        } catch (err) {
            return error(res, err.message, 404);
        }
    }

    async markAllAsRead(req, res) {
        try {
            const userId = req.user?.id;
            const result = await NotificationService.markAllAsRead(userId);
            return success(res, 'All notifications marked as read', result);
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    async deleteNotification(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;

            const result = await NotificationService.deleteNotification(id, userId);
            return success(res, result.message, result);
        } catch (err) {
            return error(res, err.message, 404);
        }
    }

    async createNotification(req, res) {
        try {
            // Check if user is Superadmin
            const isSuperAdmin = await this._isSuperadmin(req);
            if (!isSuperAdmin) {
                return error(res, 'Access denied. Superadmin only.', 403);
            }

            const result = await NotificationService.createNotification(req.body);
            return success(res, 'Notification created successfully', result, 201);
        } catch (err) {
            return error(res, err.message, 400);
        }
    }
}

module.exports = new NotificationController();
