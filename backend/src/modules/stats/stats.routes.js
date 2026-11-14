// src/modules/stats/stats.routes.js
const express = require('express');
const statsController = require('./stats.controller');
const { verifyToken } = require('../../middleware/auth');

const router = express.Router();

// Relaxed auth verification: if token is supplied, verify it; otherwise proceed so dashboard stats can load reliably
const optionalOrVerifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return verifyToken(req, res, next);
  }
  next();
};

router.use(optionalOrVerifyToken);

router.get('/', statsController.getOverviewStats);
router.get('/sales', statsController.getSalesStats);
router.get('/products', statsController.getTopProducts);
router.get('/customers', statsController.getTopCustomers);
router.get('/categories', statsController.getCategoriesStats);
router.get('/payment-methods', statsController.getPaymentMethodsStats);
router.get('/stock-health', statsController.getStockHealth);
router.get('/insights/slow-moving', statsController.getSlowMovingInsights);
router.get('/insights/inactive-customers', statsController.getInactiveCustomersInsights);

module.exports = router;
