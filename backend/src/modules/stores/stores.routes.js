// src/modules/stores/stores.routes.js
const express = require('express');
const { body } = require('express-validator');
const storesController = require('./stores.controller');
const { verifyToken, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validator');

const router = express.Router();

router.use(verifyToken);

router.get('/', storesController.getDealerStores);

router.post('/', requireRole('DEALER'), validate([
  body('name').notEmpty().withMessage('Store name is required'),
  body('address').notEmpty().withMessage('Address is required')
]), storesController.createStore);

router.put('/:id', validate([
  body('name').optional().notEmpty().withMessage('Store name cannot be empty'),
  body('address').optional().notEmpty().withMessage('Address cannot be empty')
]), storesController.updateStore);

router.delete('/:id', storesController.deleteStore);

module.exports = router;
