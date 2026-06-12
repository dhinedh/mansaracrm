// src/modules/auth/auth.routes.js
const express = require('express');
const { body } = require('express-validator');
const authController = require('./auth.controller');
const { verifyToken, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validator');

const router = express.Router();

// Public routes
router.post('/login', validate([
  body('email').trim().isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
]), authController.login);

router.post('/forgot-password', validate([
  body('email').trim().isEmail().withMessage('Please enter a valid email')
]), authController.forgotPassword);

router.post('/reset-password', validate([
  body('email').trim().isEmail().withMessage('Please enter a valid email'),
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
]), authController.resetPassword);

// Protected routes
router.get('/me', verifyToken, authController.me);

// Admin-only route: Register a dealer
router.post('/register-dealer', verifyToken, requireRole('ADMIN'), validate([
  body('email').trim().isEmail().withMessage('Please enter a valid email'),
  body('name').notEmpty().withMessage('Dealer name is required'),
  body('companyName').notEmpty().withMessage('Company name is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('dealerType').optional().isIn(['WHOLESALE', 'RETAIL', 'DISTRIBUTOR', 'SUPER_DISTRIBUTOR'])
]), authController.registerDealer);

module.exports = router;
