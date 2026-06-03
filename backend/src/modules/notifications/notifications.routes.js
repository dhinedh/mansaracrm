// src/modules/notifications/notifications.routes.js
const express = require('express');
const notificationsController = require('./notifications.controller');
const { verifyToken } = require('../../middleware/auth');

const router = express.Router();

router.use(verifyToken);

router.get('/', notificationsController.getNotifications);
router.patch('/read-all', notificationsController.markAllAsRead);
router.patch('/:id/read', notificationsController.markAsRead);
router.delete('/:id', notificationsController.deleteNotification);

module.exports = router;
