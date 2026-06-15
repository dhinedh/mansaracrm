// src/modules/returns/returns.routes.js
const express = require('express');
const returnsController = require('./returns.controller');
const { verifyToken } = require('../../middleware/auth');

const router = express.Router();

router.use(verifyToken);

router.post('/', returnsController.createReturn);
router.get('/', returnsController.getReturns);
router.patch('/:id/status', returnsController.updateReturnStatus);

module.exports = router;
