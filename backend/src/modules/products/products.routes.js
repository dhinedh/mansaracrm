// src/modules/products/products.routes.js
const express = require('express');
const { body } = require('express-validator');
const productsController = require('./products.controller');
const { verifyToken, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validator');
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

module.exports = router;
