// src/modules/stall/stall.routes.js
const express = require('express');
const stallController = require('./stall.controller');
const { verifyToken } = require('../../middleware/auth');
const upload = require('../../utils/fileUpload');

const router = express.Router();

// Apply auth middleware to all stall endpoints
router.use(verifyToken);

// Stall Sessions
router.post('/sessions', stallController.createSession);
router.post('/sessions/:id/close', stallController.closeSession);
router.get('/sessions', stallController.getSessions);
router.get('/sessions/:id', stallController.getSessionById);

// Multi-stage Stall Workflow Endpoints
router.put('/sessions/:id/stock', stallController.updateSessionStock);
router.post('/sessions/:id/freeze', stallController.freezeSessionStock);
router.post('/sessions/:id/unfreeze', stallController.unfreezeSessionStock);
router.put('/sessions/:id/expenses', stallController.updateExpenses);
router.post('/sessions/:id/upload-bill', upload.single('bill'), stallController.uploadBill);

// Stall Sales & P&L Reports
router.post('/sessions/:id/sales', stallController.createSale);
router.get('/sessions/:id/report', stallController.getSessionReport);

module.exports = router;
