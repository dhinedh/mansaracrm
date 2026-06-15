// src/modules/requests/requests.routes.js
const express = require('express');
const requestsController = require('./requests.controller');
const { verifyToken } = require('../../middleware/auth');

const router = express.Router();

router.use(verifyToken);

router.post('/', requestsController.createRequest);
router.get('/', requestsController.getRequests);
router.patch('/:id/cancel', requestsController.cancelRequest);
router.post('/:id/dispatch', requestsController.dispatchRequest);

module.exports = router;
