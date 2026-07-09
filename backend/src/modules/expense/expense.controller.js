// src/modules/expense/expense.controller.js
const prisma = require('../../config/database');

// Create a new general expense
exports.createExpense = async (req, res, next) => {
  try {
    const { title, amount, date, category, storeId, stallSessionId, billUrl, notes } = req.body;

    if (!title || amount === undefined || !category) {
      return res.status(400).json({ success: false, message: 'Title, amount, and category are required.' });
    }

    let dealerId = null;
    if (req.user.role === 'DEALER') {
      dealerId = req.user.dealer.id;
    } else if (req.body.dealerId) {
      dealerId = req.body.dealerId;
    }

    const expense = await prisma.expense.create({
      data: {
        title,
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date(),
        category,
        dealerId,
        storeId: storeId || null,
        stallSessionId: stallSessionId || null,
        billUrl: billUrl || '',
        notes: notes || ''
      }
    });

    res.status(201).json({ success: true, message: 'Expense recorded successfully', data: expense });
  } catch (error) {
    next(error);
  }
};

// Retrieve general expenses list
exports.getExpenses = async (req, res, next) => {
  try {
    const { category, storeId, stallSessionId, search, dealerId } = req.query;

    const where = {};
    if (req.user.role === 'DEALER') {
      where.dealerId = req.user.dealer.id;
    } else if (dealerId) {
      where.dealerId = dealerId;
    }
    if (category) where.category = category;
    if (storeId) where.storeId = storeId;
    if (stallSessionId) where.stallSessionId = stallSessionId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } }
      ];
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        store: true,
        stallSession: true
      }
    });

    res.json({ success: true, data: expenses });
  } catch (error) {
    next(error);
  }
};

// Upload bill photo
exports.uploadBill = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }
    const billUrl = `uploads/${req.file.filename}`;
    res.json({ success: true, message: 'Bill receipt uploaded successfully', billUrl });
  } catch (error) {
    next(error);
  }
};

// PUT /expenses/:id/status
exports.updateExpenseStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be APPROVED or REJECTED.' });
    }

    // Verify user role
    const isStaff = req.user.role === 'ADMIN' || (req.user.role !== 'DEALER' && ['ADMIN', 'B2B_MANAGER', 'FINANCE_OFFICER'].includes(req.user.staffRole));
    if (!isStaff) {
      return res.status(403).json({ success: false, message: 'Forbidden. Insufficient permissions.' });
    }

    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found.' });

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        status,
        rejectionRemarks: status === 'REJECTED' ? (remarks || '') : '',
        approvedBy: status === 'APPROVED' ? req.user.id : null,
        approvedAt: status === 'APPROVED' ? new Date() : null
      }
    });

    res.json({ success: true, message: `Expense request ${status.toLowerCase()} successfully.`, data: updated });
  } catch (error) {
    next(error);
  }
};
