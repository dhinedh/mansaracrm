// src/modules/expense/expense.routes.js
const express = require('express');
const expenseController = require('./expense.controller');
const { verifyToken } = require('../../middleware/auth');
const upload = require('../../utils/fileUpload');

const router = express.Router();

// Apply verifyToken to all expense endpoints
router.use(verifyToken);

router.post('/', expenseController.createExpense);
router.get('/', expenseController.getExpenses);
router.post('/upload-bill', upload.single('bill'), expenseController.uploadBill);

module.exports = router;
