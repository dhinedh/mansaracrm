// src/modules/dealers/dealers.routes.js
const express = require('express');
const { body } = require('express-validator');
const dealersController = require('./dealers.controller');
const { verifyToken, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validator');

const router = express.Router();

router.use(verifyToken);

// Dealer self-profile update action
router.put('/profile/update', requireRole('DEALER'), validate([
  body('companyName').optional().notEmpty().withMessage('Company name cannot be empty'),
  body('phone').optional().notEmpty().withMessage('Phone cannot be empty'),
  body('address').optional().notEmpty().withMessage('Address cannot be empty')
]), dealersController.updateSelfProfile);

// Admin-only actions
router.get('/', requireRole('ADMIN'), dealersController.getAllDealers);
router.get('/zone-check', requireRole('ADMIN'), dealersController.checkZoneConflicts);
router.get('/pincode-lookup/:pincode', dealersController.lookupPincode);
router.get('/:id', requireRole('ADMIN', 'DEALER'), dealersController.getDealerById); // Dealers can view their own details (handled appropriately on front/back)
router.put('/:id', requireRole('ADMIN'), validate([
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('companyName').optional().notEmpty().withMessage('Company name cannot be empty'),
  body('phone').optional().notEmpty().withMessage('Phone cannot be empty'),
  body('address').optional().notEmpty().withMessage('Address cannot be empty')
]), dealersController.updateDealer);

router.patch('/:id/approve', requireRole('ADMIN'), validate([
  body('status').isIn(['APPROVED', 'REJECTED']).withMessage('Status must be APPROVED or REJECTED')
]), dealersController.approveDealer);

router.patch('/:id/toggle-active', requireRole('ADMIN'), validate([
  body('isActive').isBoolean().withMessage('isActive must be a boolean')
]), dealersController.toggleDealerActive);

router.patch('/:id/change-password', requireRole('ADMIN'), validate([
  body('newPassword')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .notEmpty().withMessage('New password is required')
]), dealersController.changeDealerPassword);

router.patch('/:id/margin-credit', requireRole('ADMIN'), dealersController.updateDealerMarginOrCredit);
router.post('/broadcast', requireRole('ADMIN'), dealersController.sendDealerBroadcast);
router.delete('/:id', requireRole('ADMIN'), dealersController.deleteDealer);

module.exports = router;

