// src/modules/crm/crm.routes.js
const express = require('express');
const crmController = require('./crm.controller');
const { verifyToken } = require('../../middleware/auth');

const router = express.Router();

router.use(verifyToken);

// Leads
router.post('/leads', crmController.createLead);
router.get('/leads', crmController.getLeads);
router.patch('/leads/:id', crmController.updateLeadStatus);

// Visits
router.post('/visits', crmController.logVisit);
router.get('/visits', crmController.getVisits);
router.post('/visits/check-in', crmController.checkInVisit);
router.post('/visits/:id/check-out', crmController.checkOutVisit);

// Samples
router.post('/samples', crmController.createSample);
router.get('/samples', crmController.getSamples);
router.patch('/samples/:id', crmController.updateSampleStatus);

module.exports = router;
