// src/modules/b2c-stores/b2c-stores.routes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ctrl = require('./b2c-stores.controller');
const { verifyToken } = require('../../middleware/auth');

const router = express.Router();

// Configure multer for photo uploads
const uploadsDir = path.join(__dirname, '../../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `b2c-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5 MB max

router.use(verifyToken);

// ─── Store CRUD ───────────────────────────────────────────────────────────────
router.get('/',          ctrl.getAllB2CStores);
router.post('/',         ctrl.createB2CStore);
router.get('/:id',       ctrl.getB2CStoreById);
router.put('/:id',       ctrl.updateB2CStore);
router.delete('/:id',    ctrl.deleteB2CStore);

// ─── Stock Configuration ───────────────────────────────────────────────────
router.get('/:id/stock',            ctrl.getStoreStock);
router.put('/:id/stock',            ctrl.updateStoreStock);
router.post('/:id/stock/freeze',    ctrl.freezeStoreStock);
router.post('/:id/stock/unfreeze',  ctrl.unfreezeStoreStock);
router.post('/:id/stock/add',       ctrl.addStoreStock);

// ─── Visits ───────────────────────────────────────────────────────────────────
router.get('/:id/visits',                   ctrl.getStoreVisits);
router.post('/:id/visits/checkin',          ctrl.checkInStoreVisit);
router.put('/visits/:visitId/checkout',     ctrl.checkOutStoreVisit);

// ─── Billing (Invoices) ───────────────────────────────────────────────────────
router.get('/:id/invoices',  ctrl.getStoreInvoices);
router.post('/:id/invoices', ctrl.createStoreInvoice);

// ─── Expenses ─────────────────────────────────────────────────────────────────
router.get('/:id/expenses',   ctrl.getStoreExpenses);
router.post('/:id/expenses',  ctrl.createStoreExpense);

// ─── Offer Distributions ──────────────────────────────────────────────────────
router.get('/:id/offers', ctrl.getStoreOffers);

// ─── Photos ───────────────────────────────────────────────────────────────────
router.post('/upload-photo', upload.single('photo'), ctrl.uploadPhoto);
router.post('/:id/photos',   ctrl.addStorePhoto);

// ─── P&L Report ───────────────────────────────────────────────────────────────
router.get('/:id/report', ctrl.getStoreReport);

module.exports = router;
