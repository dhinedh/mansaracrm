// src/modules/products/products.routes.js
const express = require('express');
const { body } = require('express-validator');
const productsController = require('./products.controller');
const { verifyToken, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const upload = require('../../utils/fileUpload');

const router = express.Router();

router.use(verifyToken);

// ─────────────────────────────────────────────
// CATEGORY ROUTES
// ─────────────────────────────────────────────
router.get('/categories', productsController.getCategories);
router.post('/categories', requireRole('ADMIN'), validate([
  body('name').notEmpty().withMessage('Category name is required')
]), productsController.createCategory);
router.put('/categories/:id', requireRole('ADMIN'), productsController.updateCategory);
router.delete('/categories/:id', requireRole('ADMIN'), productsController.deleteCategory);

// ─────────────────────────────────────────────
// PRODUCT ROUTES
// ─────────────────────────────────────────────
router.get('/', productsController.getProducts);
router.get('/:id', productsController.getProductById);

router.post('/', requireRole('ADMIN'), upload.single('image'), validate([
  body('name').notEmpty().withMessage('Product name is required'),
  body('sku').notEmpty().withMessage('SKU code is required'),
  body('price').isFloat({ gt: 0 }).withMessage('Price must be greater than 0'),
  body('gstPercent').isFloat({ min: 0 }).withMessage('GST percent must be non-negative'),
  body('categoryId').notEmpty().withMessage('Category ID is required')
]), productsController.createProduct);

router.put('/:id', requireRole('ADMIN'), upload.single('image'), validate([
  body('name').optional().notEmpty().withMessage('Product name cannot be empty'),
  body('price').optional().isFloat({ gt: 0 }).withMessage('Price must be greater than 0'),
  body('gstPercent').optional().isFloat({ min: 0 }).withMessage('GST percent must be non-negative')
]), productsController.updateProduct);

router.delete('/:id', requireRole('ADMIN'), productsController.deleteProduct);

// ─────────────────────────────────────────────
// BULK UPLOAD ROUTE
// ─────────────────────────────────────────────

// Separate multer instance that allows CSV files
const uploadCsv = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = process.env.UPLOAD_DIR || 'uploads';
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      cb(null, `bulk-upload-${Date.now()}${path.extname(file.originalname)}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowed = /csv|text\/csv|application\/vnd\.ms-excel/;
    const ext = path.extname(file.originalname).toLowerCase() === '.csv';
    if (ext || allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed for bulk upload'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

router.post('/bulk-upload', requireRole('ADMIN'), uploadCsv.single('file'), productsController.bulkUploadProducts);

module.exports = router;
