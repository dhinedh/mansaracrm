// backend/src/modules/audit/audit.routes.js
const express = require('express');
const router = express.Router();
const auditController = require('./audit.controller');
const { verifyToken, requireRole } = require('../../middleware/auth');

// Audit logs are strictly for Admin and Managers — read-only, never editable/deletable
router.use(verifyToken);

router.get('/logs', requireRole(['ADMIN', 'B2B_MANAGER']), auditController.getAuditLogs);
router.get('/stats', requireRole(['ADMIN', 'B2B_MANAGER']), auditController.getAuditStats);
router.get('/logs/:entity/:entityId', requireRole(['ADMIN', 'B2B_MANAGER', 'SALES']), auditController.getRecordHistory);

module.exports = router;
