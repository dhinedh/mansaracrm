// src/modules/billing/billing.routes.js
const express = require('express');
const { body } = require('express-validator');
const billingController = require('./billing.controller');
const { verifyToken, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validator');

const router = express.Router();

router.use(verifyToken);

router.get('/', billingController.getInvoices);
router.get('/agreement/:dealerId', billingController.downloadAgreementPdf);
router.get('/:id', billingController.getInvoiceById);
router.get('/:id/pdf', billingController.downloadPdf);
router.patch('/:id/close', requireRole('DEALER', 'ADMIN'), billingController.closeInvoice);
router.delete('/:id', requireRole('DEALER', 'ADMIN'), billingController.deleteInvoice);

router.post('/', requireRole('DEALER'), validate([
  body('storeId').custom((value, { req }) => {
    if (!value) {
      if (!req.body.storeName || !req.body.storeName.trim()) {
        throw new Error('Either Store ID or Store Name is required');
      }
      return true;
    }
    if (!/^[0-9a-fA-F]{24}$/.test(value)) {
      throw new Error('Invalid Store ID format');
    }
    return true;
  }),
  body('items').isArray({ min: 1 }).withMessage('Items list must be a non-empty array'),
  body('items.*.productId').notEmpty().withMessage('Product ID is required for each item'),
  body('items.*.quantity').isInt({ gt: 0 }).withMessage('Quantity must be positive integer')
]), billingController.createInvoice);

router.post('/:id/fulfill', billingController.fulfillInvoiceItems);
router.put('/:id/adjust', billingController.adjustInvoice);

module.exports = router;
