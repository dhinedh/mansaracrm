// src/modules/field-sales/field-sales.routes.js
const express = require('express');
const fieldSalesController = require('./field-sales.controller');
const { verifyToken } = require('../../middleware/auth');

const router = express.Router();

// Apply auth middleware to all field sales endpoints
router.use(verifyToken);

// 1. Profile & Settings (Module 1, 34)
router.get('/profile', fieldSalesController.getSalespersonProfile);
router.put('/profile', fieldSalesController.updateSalespersonProfile);
router.post('/change-password', fieldSalesController.changePassword);

// 2. Salesperson Dashboard (Module 2)
router.get('/dashboard/stats', fieldSalesController.getDashboardStats);

// 3–10. Shops, Check-in/Check-out, Visits, Customer 360, Beat Planning (Modules 3–9)
router.get('/shops', fieldSalesController.getShops);
router.post('/shops', fieldSalesController.registerShopLead);
router.get('/shops/:id/360', fieldSalesController.getCustomer360);
router.post('/visits/check-in', fieldSalesController.checkInVisit);
router.post('/visits/:id/check-out', fieldSalesController.checkOutVisit);
router.get('/visits', fieldSalesController.getVisits);

// 10. Competitor Intelligence (Module 10)
router.post('/competitor-intel', fieldSalesController.recordCompetitorIntel);
router.get('/competitor-intel', fieldSalesController.getCompetitorIntel);

// 11–17. Products, Catalogue, Price Simulator, Margin Requests, Schemes (Modules 11–17)
router.get('/catalogue', fieldSalesController.getCatalogue);
router.post('/simulate-price', fieldSalesController.simulatePrice);
router.post('/margins/request', fieldSalesController.requestMarginApproval);
router.get('/schemes', fieldSalesController.getActiveSchemes);

// 18–23. Orders, Quick Reorder, Quotations, Amendments, Returns (Modules 18–23)
router.post('/orders', fieldSalesController.createSalesOrder);
router.get('/orders', fieldSalesController.getSalesOrders);
router.post('/quotations', fieldSalesController.createQuotation);
router.get('/quotations', fieldSalesController.getQuotations);
router.post('/amendments', fieldSalesController.requestAmendmentOrReturn);
router.get('/amendments', fieldSalesController.getAmendmentRequests);

// 24–29. Payments, Collections, Commitments, Follow-ups, DAR (Modules 24–29)
router.post('/collections', fieldSalesController.recordPaymentCollection);
router.post('/commitments', fieldSalesController.recordPaymentCommitment);
router.get('/commitments', fieldSalesController.getPaymentCommitments);
router.post('/follow-ups', fieldSalesController.createFollowUp);
router.get('/follow-ups', fieldSalesController.getFollowUps);
router.put('/follow-ups/:id/complete', fieldSalesController.completeFollowUp);
router.get('/dar', fieldSalesController.getDailyActivityReport);

// 30–34. Performance & Offline Sync (Modules 30–34)
router.get('/performance', fieldSalesController.getPerformanceHistory);
router.post('/sync', fieldSalesController.syncOfflineData);

// Invoices fulfillment / adjustments
router.post('/invoices/:id/fulfill', fieldSalesController.fulfillInvoiceItems);
router.put('/invoices/:id/adjust', fieldSalesController.adjustInvoice);

// ======================================================
// ADMIN FIELD SALES ROUTES (Excluding Live GPS)
// ======================================================
router.get('/admin/team', fieldSalesController.getAdminSalesTeam);
router.get('/admin/team/:id/details', fieldSalesController.getAdminSalespersonDetails);
router.post('/admin/team', fieldSalesController.createAdminSalesperson);
router.put('/admin/team/:id', fieldSalesController.updateAdminSalesperson);

router.get('/admin/beats', fieldSalesController.getAdminBeats);
router.post('/admin/beats/assign', fieldSalesController.updateAdminBeatRoute);

router.get('/admin/approvals', fieldSalesController.getAdminApprovals);
router.put('/admin/approvals/margins/:id', fieldSalesController.reviewMarginApproval);
router.put('/admin/approvals/quotations/:id', fieldSalesController.reviewQuotationApproval);
router.put('/admin/approvals/amendments/:id', fieldSalesController.reviewAmendmentApproval);

router.get('/admin/competitors', fieldSalesController.getAdminCompetitorFeed);
router.get('/admin/dar-audit', fieldSalesController.getAdminDarAudit);

router.get('/admin/orders', fieldSalesController.getAdminSalesOrders);
router.put('/admin/orders/:id/status', fieldSalesController.updateAdminOrderStatus);
router.get('/admin/collections', fieldSalesController.getAdminCollections);
router.get('/admin/performance', fieldSalesController.getAdminPerformance);

// Admin Store Visits & Allocations
router.get('/admin/visits/today', fieldSalesController.getAdminTodayVisits);
router.post('/admin/visits/allocate', fieldSalesController.allocateStoreVisit);
router.put('/admin/visits/:id/status', fieldSalesController.updateAdminVisitStatus);

module.exports = router;

