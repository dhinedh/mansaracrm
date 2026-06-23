// src/modules/margins/margins.controller.js
const prisma = require('../../config/database');

exports.getMargins = async (req, res, next) => {
  try {
    let dealerId;
    if (req.user.role === 'ADMIN') {
      dealerId = req.query.dealerId;
      if (!dealerId) {
        return res.status(400).json({ success: false, message: 'dealerId query param required for admin' });
      }
    } else {
      dealerId = req.user.dealer.id;
    }

    const margins = await prisma.margin.findMany({
      where: { dealerId },
      include: {
        store: true,
        product: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({ success: true, data: margins });
  } catch (error) {
    next(error);
  }
};

exports.setMargin = async (req, res, next) => {
  try {
    const { storeId, productId, categoryId, marginPercent, isDefault } = req.body;
    
    let dealerId;
    if (req.user.role === 'ADMIN') {
      dealerId = req.body.dealerId;
      if (!dealerId) {
        return res.status(400).json({ success: false, message: 'dealerId is required for admin' });
      }
    } else {
      dealerId = req.user.dealer.id;
    }

    // Validate store ownership if storeId is provided
    if (storeId) {
      const store = await prisma.store.findFirst({
        where: { id: storeId, dealerId }
      });
      if (!store) {
        return res.status(404).json({ success: false, message: 'Store not found or does not belong to dealer' });
      }
    }

    // Set margin (upsert pattern manually or using updateMany/create)
    // Find if margin already exists for the combination
    const existing = await prisma.margin.findFirst({
      where: {
        dealerId,
        storeId: storeId || null,
        productId: productId || null,
        categoryId: categoryId || null,
      }
    });

    let margin;
    if (existing) {
      margin = await prisma.margin.update({
        where: { id: existing.id },
        data: {
          marginPercent: parseFloat(marginPercent),
          isDefault: isDefault || false
        }
      });
    } else {
      margin = await prisma.margin.create({
        data: {
          dealerId,
          storeId: storeId || null,
          productId: productId || null,
          categoryId: categoryId || null,
          marginPercent: parseFloat(marginPercent),
          isDefault: isDefault || false
        }
      });
    }

    res.json({
      success: true,
      message: 'Margin rule set successfully',
      data: margin
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteMargin = async (req, res, next) => {
  try {
    const { id } = req.params;

    const margin = await prisma.margin.findUnique({ where: { id } });
    if (!margin) {
      return res.status(404).json({ success: false, message: 'Margin rule not found' });
    }

    if (req.user.role === 'DEALER' && margin.dealerId !== req.user.dealer.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await prisma.margin.delete({ where: { id } });

    res.json({ success: true, message: 'Margin rule deleted successfully' });
  } catch (error) {
    next(error);
  }
};
