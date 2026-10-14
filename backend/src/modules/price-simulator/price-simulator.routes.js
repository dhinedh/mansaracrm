// src/modules/price-simulator/price-simulator.routes.js
const express = require('express');
const { body } = require('express-validator');
const priceSimulatorController = require('./price-simulator.controller');
const { verifyToken, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validator');

const router = express.Router();

router.use(verifyToken);

// Live simulation calculation engine
router.post(
  '/simulate',
  validate([
    body('mrp').notEmpty().withMessage('MRP is required'),
    body('requestedMarginPct').notEmpty().withMessage('Requested margin percentage is required')
  ]),
  priceSimulatorController.simulatePrice
);

// Commit and approve store margin workflow
// Authorized for Admin, Arun Sir, Deepika Mam, and B2B Managers
router.post(
  '/approve-margin',
  requireRole('ADMIN'),
  validate([
    body('storeId').notEmpty().withMessage('Store ID is required'),
    body('marginPercent').isFloat({ min: 0, max: 100 }).withMessage('Margin must be a percentage between 0 and 100')
  ]),
  priceSimulatorController.commitAndApproveMargin
);

// Get list of all approved store margins & commitments
router.get('/approved-margins', priceSimulatorController.getApprovedStoreMargins);

// Revoke an approved margin rule
router.delete('/margin-rules/:id', requireRole('ADMIN'), priceSimulatorController.revokeMarginRule);

// Simulation history records
router.get('/simulations', priceSimulatorController.getSimulations);
router.post('/simulations', requireRole('ADMIN'), priceSimulatorController.saveSimulation);

module.exports = router;
