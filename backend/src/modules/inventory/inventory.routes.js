// src/modules/inventory/inventory.routes.js
const express = require('express');
const { body } = require('express-validator');
const inventoryController = require('./inventory.controller');
const { verifyToken, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validator');

const router = express.Router();

router.use(verifyToken);

// ─────────────────────────────────────────────
// COMPANY INVENTORY (ADMIN ONLY)
// ─────────────────────────────────────────────
router.get('/company', requireRole('ADMIN'), inventoryController.getCompanyInventory);
router.post('/company/adjust', requireRole('ADMIN'), validate([
  body('productId').notEmpty().withMessage('Product ID is required'),
  body('quantity').isInt({ gt: 0 }).withMessage('Quantity must be positive integer'),
  body('type').isIn(['IN', 'OUT', 'ADJUSTMENT']).withMessage('Invalid adjustment type')
]), inventoryController.adjustCompanyInventory);
router.put('/company/update', requireRole('ADMIN'), validate([
  body('productId').notEmpty().withMessage('Product ID is required'),
  body('quantity').isInt({ gte: 0 }).withMessage('Quantity must be a non-negative integer'),
  body('minQuantity').isInt({ gte: 0 }).withMessage('Min quantity must be a non-negative integer')
]), inventoryController.updateCompanyInventory);

// ─────────────────────────────────────────────
// DEALER INVENTORY (BOTH ADMIN & DEALER)
// ─────────────────────────────────────────────
router.get('/dealer', inventoryController.getDealerInventory);

// ─────────────────────────────────────────────
// STOCK TRANSFERS
// ─────────────────────────────────────────────
router.get('/transfers', inventoryController.getStockTransfers);

router.post('/transfers', requireRole('ADMIN'), validate([
  body('dealerId').notEmpty().withMessage('Dealer ID is required'),
  body('items').isArray({ min: 1 }).withMessage('Items list must be a non-empty array'),
  body('items.*.productId').notEmpty().withMessage('Product ID is required for each item'),
  body('items.*.quantity').isInt({ gt: 0 }).withMessage('Quantity must be greater than 0 for each item')
]), inventoryController.createStockTransfer);

router.patch('/transfers/:id/status', validate([
  body('status').isIn(['IN_TRANSIT', 'DELIVERED', 'CANCELLED']).withMessage('Invalid status')
]), inventoryController.updateTransferStatus);

module.exports = router;
