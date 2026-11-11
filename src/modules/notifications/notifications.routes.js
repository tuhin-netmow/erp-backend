const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../core/middleware/auth');
const notificationsController = require('./notifications.controller');

// Apply authentication middleware to all routes
router.use(verifyToken);

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications for current user
 * @access  Private
 */
router.get('/', (req, res) => notificationsController.getAllNotifications(req, res));

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get('/unread-count', (req, res) => notificationsController.getUnreadCount(req, res));

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.patch('/:id/read', (req, res) => notificationsController.markAsRead(req, res));

/**
 * @route   POST /api/notifications/mark-all-read
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.post('/mark-all-read', (req, res) => notificationsController.markAllAsRead(req, res));

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a notification
 * @access  Private
 */
router.delete('/:id', (req, res) => notificationsController.deleteNotification(req, res));

/**
 * @route   POST /api/notifications
 * @desc    Create a new notification (admin only)
 * @access  Private
 */
router.post('/', (req, res) => notificationsController.createNotification(req, res));

module.exports = router;
