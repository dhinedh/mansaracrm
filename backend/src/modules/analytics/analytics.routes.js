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

// Saved Reports endpoints
router.post('/saved-reports',             analyticsController.createSavedReport);
router.get('/saved-reports',              analyticsController.getSavedReports);
router.get('/saved-reports/:id',          analyticsController.getSavedReportById);
router.delete('/saved-reports/:id',       analyticsController.deleteSavedReport);
router.get('/saved-reports/:id/pdf',      analyticsController.exportSavedReportPdf);

module.exports = router;
