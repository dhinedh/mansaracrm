// src/modules/vendors/vendors.routes.js
const express = require('express');
const vendorsController = require('./vendors.controller');
const { verifyToken } = require('../../middleware/auth');

const router = express.Router();

router.use(verifyToken);

router.post('/', vendorsController.createVendor);
router.get('/', vendorsController.getVendors);
router.get('/:id', vendorsController.getVendorById);
router.put('/:id', vendorsController.updateVendor);
router.delete('/:id', vendorsController.deleteVendor);
router.post('/:id/generate-agreement', vendorsController.generateAgreement);
router.post('/:id/sign-agreement', vendorsController.signAgreement);
router.post('/:id/update-agreement-terms', vendorsController.updateAgreementTerms);

module.exports = router;
