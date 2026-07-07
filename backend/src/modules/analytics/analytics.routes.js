// src/modules/analytics/analytics.routes.js
const express = require('express');
const analyticsController = require('./analytics.controller');
const { verifyToken, requireRole } = require('../../middleware/auth');

const router = express.Router();

router.use(verifyToken);

router.get('/admin', requireRole('ADMIN'), analyticsController.getAdminAnalytics);
router.get('/dealer', requireRole('DEALER'), analyticsController.getDealerAnalytics);
router.get('/consolidated-report', analyticsController.getConsolidatedReport);
router.get('/consolidated-report/pdf', analyticsController.exportConsolidatedReportPdf);

module.exports = router;
