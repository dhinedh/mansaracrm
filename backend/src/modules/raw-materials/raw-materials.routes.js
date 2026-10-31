// src/modules/raw-materials/raw-materials.routes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const rawMaterialsController = require('./raw-materials.controller');
const { verifyToken, requireRole } = require('../../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Configure multer for CSV/file uploads
const uploadCsv = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = process.env.UPLOAD_DIR || 'uploads';
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      cb(null, `rm-bulk-${Date.now()}${path.extname(file.originalname)}`);
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
// CATEGORY ROUTES
// ─────────────────────────────────────────────
router.get('/categories', rawMaterialsController.getCategories);
router.post('/categories', requireRole('ADMIN', 'B2B_MANAGER'), rawMaterialsController.createCategory);
router.put('/categories/:id', requireRole('ADMIN', 'B2B_MANAGER'), rawMaterialsController.updateCategory);
router.delete('/categories/:id', requireRole('ADMIN', 'B2B_MANAGER'), rawMaterialsController.deleteCategory);

// Sub-Category quick actions
router.post('/categories/:id/subcategories', requireRole('ADMIN', 'B2B_MANAGER'), rawMaterialsController.addSubCategory);
router.delete('/categories/:id/subcategories/:subName', requireRole('ADMIN', 'B2B_MANAGER'), rawMaterialsController.removeSubCategory);

// ─────────────────────────────────────────────
// PRODUCT / RAW MATERIAL ITEM ROUTES
// ─────────────────────────────────────────────
router.get('/items', rawMaterialsController.getItems);
router.get('/items/:id', rawMaterialsController.getItemById);
router.post('/items', requireRole('ADMIN', 'B2B_MANAGER'), rawMaterialsController.createItem);
router.put('/items/:id', requireRole('ADMIN', 'B2B_MANAGER'), rawMaterialsController.updateItem);
router.delete('/items/:id', requireRole('ADMIN', 'B2B_MANAGER'), rawMaterialsController.deleteItem);

// ─────────────────────────────────────────────
// BULK UPLOAD, TEMPLATE & EXPORT
// ─────────────────────────────────────────────
router.post('/bulk-upload', requireRole('ADMIN', 'B2B_MANAGER'), uploadCsv.single('file'), rawMaterialsController.bulkUpload);
router.get('/template', rawMaterialsController.downloadTemplate);
router.get('/export', rawMaterialsController.exportCsv);

module.exports = router;
