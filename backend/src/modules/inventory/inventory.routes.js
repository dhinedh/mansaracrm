// src/modules/inventory/inventory.routes.js
const express = require('express');
const { body } = require('express-validator');
const inventoryController = require('./inventory.controller');
const { verifyToken, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validator');

const router = express.Router();

router.use(verifyToken);

// ─────────────────────────────────────────────
// MULTER CONFIG FOR BULK CSV UPLOAD
// ─────────────────────────────────────────────
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadCsv = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = process.env.UPLOAD_DIR || 'uploads';
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      cb(null, `inv-bulk-${Date.now()}${path.extname(file.originalname)}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowed = /csv|text\/csv|application\/vnd\.ms-excel|text\/plain/;
    const ext = path.extname(file.originalname).toLowerCase() === '.csv';
    if (ext || allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed for bulk upload'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

// ─────────────────────────────────────────────
// COMPANY INVENTORY (ADMIN & B2B MANAGER)
// ─────────────────────────────────────────────
router.get('/company', requireRole('ADMIN', 'B2B_MANAGER'), inventoryController.getCompanyInventory);
router.get('/sales-report', requireRole('ADMIN', 'B2B_MANAGER'), inventoryController.getSalesReport);
router.get('/generate-inventory-id', requireRole('ADMIN', 'B2B_MANAGER'), inventoryController.generateInventoryId);
router.get('/lookup-quotation', requireRole('ADMIN', 'B2B_MANAGER'), inventoryController.lookupQuotation);
router.post('/inward-stock', requireRole('ADMIN', 'B2B_MANAGER'), inventoryController.inwardQuotationStock);
router.post('/bulk-inward', requireRole('ADMIN', 'B2B_MANAGER'), uploadCsv.single('file'), inventoryController.bulkInwardStock);
router.post('/company/create', requireRole('ADMIN', 'B2B_MANAGER'), inventoryController.createStockEntry);
router.post('/company/issue-production', requireRole('ADMIN', 'B2B_MANAGER'), inventoryController.issueToProduction);
router.post('/company/finished-goods', requireRole('ADMIN', 'B2B_MANAGER'), inventoryController.createFinishedGoodsBatch);
router.post('/company/trigger-pr', requireRole('ADMIN', 'B2B_MANAGER'), inventoryController.triggerPRNotification);

router.post('/company/adjust', requireRole('ADMIN'), validate([
  body('productId').optional().notEmpty().withMessage('Product ID is required'),
  body('quantity').isInt({ gt: 0 }).withMessage('Quantity must be positive integer'),
  body('type').isIn(['IN', 'OUT', 'ADJUSTMENT']).withMessage('Invalid adjustment type')
]), inventoryController.adjustCompanyInventory);
router.put('/company/update', requireRole('ADMIN'), validate([
  body('productId').optional(),
  body('id').optional(),
  body('quantity').isInt({ gte: 0 }).withMessage('Quantity must be a non-negative integer'),
  body('minQuantity').isInt({ gte: 0 }).withMessage('Min quantity must be a non-negative integer'),
  body('storageLocation').optional(),
  body('unit').optional()
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
  body('recipientType').optional().isIn(['DEALER', 'STORE', 'OTHER']).withMessage('Invalid recipient type'),
  body('dealerId').optional().isString(),
  body('storeId').optional().isString(),
  body('recipientName').optional().isString(),
  body('recipientPhone').optional().isString(),
  body('recipientAddress').optional().isString(),
  body('transferReason').optional().isString(),
  body('items').isArray({ min: 1 }).withMessage('Items list must be a non-empty array'),
  body('items.*.productId').notEmpty().withMessage('Product ID is required for each item'),
  body('items.*.quantity').isInt({ gt: 0 }).withMessage('Quantity must be greater than 0 for each item')
]), inventoryController.createStockTransfer);

router.patch('/transfers/:id/status', validate([
  body('status').isIn(['IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'DISCREPANCY']).withMessage('Invalid status'),
  body('items').optional().isArray().withMessage('Items must be an array'),
  body('items.*.productId').optional().notEmpty().withMessage('Product ID is required'),
  body('items.*.receivedQuantity').optional().isInt({ gte: 0 }).withMessage('Received quantity must be a non-negative integer'),
  body('items.*.hasDiscrepancy').optional().isBoolean().withMessage('hasDiscrepancy must be a boolean'),
  body('items.*.discrepancyComment').optional().isString().withMessage('discrepancyComment must be a string')
]), inventoryController.updateTransferStatus);

module.exports = router;
