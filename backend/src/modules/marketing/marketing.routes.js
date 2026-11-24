// backend/src/modules/marketing/marketing.routes.js
const express = require('express');
const router = express.Router();
const marketingController = require('./marketing.controller');
const { verifyToken, requireRole } = require('../../middleware/auth');
const upload = require('../../utils/fileUpload');

router.use(verifyToken);

router.get('/events', marketingController.getEvents);
router.get('/events/:id', marketingController.getEventById);
router.get('/staff', marketingController.getMarketingStaff);

// Creation allowed by Admin, B2B Manager, or authorized staff
router.post('/events', requireRole('ADMIN', 'B2B_MANAGER', 'SALES'), marketingController.createEvent);

// Update event details
router.put('/events/:id', requireRole('ADMIN', 'B2B_MANAGER', 'SALES'), marketingController.updateEvent);

// Complete event & upload photos
router.post('/events/:id/complete', upload.array('photos', 10), marketingController.completeEvent);

// Upload extra photos
router.post('/events/:id/photos', upload.array('photos', 10), marketingController.uploadEventPhotos);

// Delete event (Admin only)
router.delete('/events/:id', requireRole('ADMIN', 'B2B_MANAGER'), marketingController.deleteEvent);

module.exports = router;
