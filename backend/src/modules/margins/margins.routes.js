// src/modules/margins/margins.routes.js
const express = require('express');
const { body } = require('express-validator');
const marginsController = require('./margins.controller');
const { verifyToken, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validator');

const router = express.Router();

router.use(verifyToken);

router.get('/', marginsController.getMargins);

router.post('/', requireRole('DEALER', 'ADMIN'), validate([
  body('marginPercent').isFloat({ min: 0, max: 200 }).withMessage('Margin must be a percentage between 0 and 200')
]), marginsController.setMargin);

router.delete('/:id', marginsController.deleteMargin);

module.exports = router;
