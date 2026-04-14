const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// @route   POST /api/notifications/broadcast
// @desc    Officer broadcasts an emergency message to all citizens
router.post('/broadcast', protect, async (req, res) => {
    try {
        const { message } = req.body;
        const User = require('../models/User'); // Dynamically require to avoid circular deps if any

        const citizens = await User.find({ role: 'citizen' }).select('_id');

        const notificationsData = citizens.map(c => ({
            userId: c._id,
            message: `⚠️ EMERGENCY ALERT: ${message}`,
            type: 'system_alert'
        }));

        if (notificationsData.length > 0) {
            await Notification.insertMany(notificationsData);
        }

        res.json({ message: 'Broadcast sent successfully' });
    } catch (error) {
        console.error('Error broadcasting:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/notifications
// @desc    Get user's notifications
router.get('/', protect, async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user.id })
            .sort({ createdAt: -1 });
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/notifications/mark-all-read
// @desc    Mark all unread notifications as read
router.put('/mark-all-read', protect, async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user.id, isRead: false },
            { $set: { isRead: true } }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
router.put('/:id/read', protect, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { isRead: true },
            { new: true }
        );
        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
