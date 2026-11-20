// backend/src/modules/bulk-upload/bulk-upload.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bulkUploadController = require('./bulk-upload.controller');
const { verifyToken, requireRole } = require('../../middleware/auth');

const tempUploadDir = 'uploads/temp';
if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tempUploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `bulk-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.xlsx', '.xls', '.csv'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext) || file.mimetype.includes('sheet') || file.mimetype.includes('csv') || file.mimetype.includes('excel')) {
    cb(null, true);
  } else {
    cb(new Error('Only Excel (.xlsx, .xls) and CSV (.csv) files are allowed'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter
});

router.use(verifyToken);

router.get('/template/:module', bulkUploadController.downloadTemplate);
router.get('/history', requireRole(['ADMIN', 'B2B_MANAGER']), bulkUploadController.getUploadHistory);
router.post('/validate', upload.single('file'), bulkUploadController.validateUpload);
router.post('/commit', requireRole(['ADMIN', 'B2B_MANAGER']), bulkUploadController.commitUpload);

module.exports = router;
