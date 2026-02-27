const express = require('express');
const router = express.Router();
const queries = require('../db/queries');

// GET /api/notifications — unread notifications
router.get('/', (req, res, next) => {
  try {
    const notifications = queries.getUnreadNotifications();
    const unreadCount = queries.getUnreadCount();
    res.json({ notifications, unreadCount });
  } catch (err) {
    next(err);
  }
});

// PUT /api/notifications/:id/read — mark as read
router.put('/:id/read', (req, res, next) => {
  try {
    queries.markNotificationRead(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
