// src/modules/billing/billing.routes.js
const express = require('express');
const { body } = require('express-validator');
const billingController = require('./billing.controller');
const { verifyToken, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validator');

const router = express.Router();

router.use(verifyToken);

router.get('/', billingController.getInvoices);
router.get('/:id', billingController.getInvoiceById);
router.get('/:id/pdf', billingController.downloadPdf);

router.post('/', requireRole('DEALER'), validate([
  body('storeId').notEmpty().withMessage('Store ID is required'),
  body('items').isArray({ min: 1 }).withMessage('Items list must be a non-empty array'),
  body('items.*.productId').notEmpty().withMessage('Product ID is required for each item'),
  body('items.*.quantity').isInt({ gt: 0 }).withMessage('Quantity must be positive integer')
]), billingController.createInvoice);

module.exports = router;
