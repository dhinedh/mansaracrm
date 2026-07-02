// src/modules/field-sales/field-sales.routes.js
const express = require('express');
const fieldSalesController = require('./field-sales.controller');
const { verifyToken } = require('../../middleware/auth');

const router = express.Router();

// Apply auth middleware to all field sales endpoints
router.use(verifyToken);

// Store Visits Check-In & Check-Out
router.post('/visits/check-in', fieldSalesController.checkInVisit);
router.post('/visits/:id/check-out', fieldSalesController.checkOutVisit);
router.get('/visits', fieldSalesController.getVisits);

// Pending Item Deliveries & Invoice Adjustments
router.post('/invoices/:id/fulfill', fieldSalesController.fulfillInvoiceItems);
router.put('/invoices/:id/adjust', fieldSalesController.adjustInvoice);

module.exports = router;
