// src/modules/ecom/ecom.routes.js
const express = require('express');
const ecomController = require('./ecom.controller');
const { verifyToken, requireRole } = require('../../middleware/auth');

const router = express.Router();

// All routes are protected and require admin role
router.use(verifyToken);
router.use(requireRole('ADMIN'));

// Orders
router.get('/orders', ecomController.getOrders);
router.get('/orders/:id', ecomController.getOrderById);
router.put('/orders/:id/status', ecomController.updateOrderStatus);
router.put('/orders/:id/confirm', ecomController.confirmOrder);
router.delete('/orders/:id', ecomController.deleteOrder);

// Combos
router.get('/combos', ecomController.getCombos);
router.post('/combos', ecomController.createCombo);
router.put('/combos/:id', ecomController.updateCombo);
router.delete('/combos/:id', ecomController.deleteCombo);

// Banners
router.get('/banners', ecomController.getBanners);
router.post('/banners', ecomController.createBanner);
router.put('/banners/:id', ecomController.updateBanner);
router.delete('/banners/:id', ecomController.deleteBanner);

// Reviews
router.get('/reviews', ecomController.getReviews);
router.put('/reviews/:id/approve', ecomController.approveReview);
router.delete('/reviews/:id', ecomController.deleteReview);

// Blog
router.get('/blog', ecomController.getBlogPosts);
router.post('/blog', ecomController.createBlogPost);
router.put('/blog/:id', ecomController.updateBlogPost);
router.delete('/blog/:id', ecomController.deleteBlogPost);

// Careers
router.get('/careers', ecomController.getCareers);
router.post('/careers', ecomController.createCareer);
router.put('/careers/:id', ecomController.updateCareer);
router.delete('/careers/:id', ecomController.deleteCareer);

// Press Releases
router.get('/press', ecomController.getPressReleases);
router.post('/press', ecomController.createPressRelease);
router.put('/press/:id', ecomController.updatePressRelease);
router.delete('/press/:id', ecomController.deletePressRelease);

// Retail Customers
router.get('/customers', ecomController.getCustomers);
router.get('/customers/:id', ecomController.getCustomerById);

// Website Settings
router.get('/settings', ecomController.getSettings);
router.put('/settings', ecomController.updateSettings);

module.exports = router;
