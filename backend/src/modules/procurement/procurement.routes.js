// src/modules/procurement/procurement.routes.js
const express = require('express');
const procurementController = require('./procurement.controller');
const { verifyToken } = require('../../middleware/auth');

const router = express.Router();

router.use(verifyToken);

// Purchase Requests (PR) & Quote Selection
router.post('/purchase-requests', procurementController.createPurchaseRequest);
router.get('/purchase-requests', procurementController.getPurchaseRequests);
router.post('/purchase-requests/:id/add-quote', procurementController.addVendorQuote);
router.post('/purchase-requests/:id/generate-po', procurementController.generatePOFromPR);

// Purchase Orders (PO)
router.get('/purchase-orders', procurementController.getPurchaseOrders);
router.get('/purchase-orders/:id', procurementController.getPurchaseOrderById);
router.post('/purchase-orders/:id/create-grn', procurementController.createGRN);

// Goods Receipt Notes (GRN & Quality Check)
router.get('/grn', procurementController.getGoodsReceiptNotes);
router.put('/grn/:id/payment', procurementController.updateGRNPayment);

// Document Archiving & Traceability
router.get('/document-archive', procurementController.getDocumentArchive);

module.exports = router;
