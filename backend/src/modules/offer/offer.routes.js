// src/modules/offer/offer.routes.js
const express = require('express');
const offerController = require('./offer.controller');
const { verifyToken } = require('../../middleware/auth');

const router = express.Router();

// Apply verifyToken to all offer endpoints
router.use(verifyToken);

router.post('/items', offerController.createOfferItem);
router.get('/items', offerController.getOfferItems);
router.post('/distributions', offerController.distributeOfferItem);
router.get('/distributions', offerController.getOfferDistributions);

module.exports = router;
