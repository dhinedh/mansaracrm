// src/modules/stall/stall.routes.js
const express = require('express');
const stallController = require('./stall.controller');
const { verifyToken } = require('../../middleware/auth');

const router = express.Router();

// Apply auth middleware to all stall endpoints
router.use(verifyToken);

// Stall Sessions
router.post('/sessions', stallController.createSession);
router.post('/sessions/:id/close', stallController.closeSession);
router.get('/sessions', stallController.getSessions);
router.get('/sessions/:id', stallController.getSessionById);

// Stall Sales & P&L Reports
router.post('/sessions/:id/sales', stallController.createSale);
router.get('/sessions/:id/report', stallController.getSessionReport);

module.exports = router;
