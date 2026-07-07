// src/modules/offer/offer.controller.js
const prisma = require('../../config/database');

// Create a new promotional item
exports.createOfferItem = async (req, res, next) => {
  try {
    const { name, description, purchaseCost, quantity } = req.body;

    if (!name || purchaseCost === undefined || quantity === undefined) {
      return res.status(400).json({ success: false, message: 'Name, purchase cost, and quantity are required.' });
    }

    const item = await prisma.offerItem.create({
      data: {
        name,
        description: description || '',
        purchaseCost: parseFloat(purchaseCost),
        quantity: parseInt(quantity),
        initialQuantity: parseInt(quantity)
      }
    });

    res.status(201).json({ success: true, message: 'Promotional item added successfully', data: item });
  } catch (error) {
    next(error);
  }
};

// Retrieve promotional items list
exports.getOfferItems = async (req, res, next) => {
  try {
    const items = await prisma.offerItem.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

// Distribute promotional items to a store, event, or general marketing
exports.distributeOfferItem = async (req, res, next) => {
  try {
    const { offerItemId, quantity, date, distributedToType, storeId, stallSessionId, notes } = req.body;

    if (!offerItemId || !quantity || !distributedToType) {
      return res.status(400).json({ success: false, message: 'Promotional item, quantity, and distribution type are required.' });
    }

    const item = await prisma.offerItem.findUnique({ where: { id: offerItemId } });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Promotional item not found.' });
    }

    const distQty = parseInt(quantity);
    if (item.quantity < distQty) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient stock for "${item.name}". Available: ${item.quantity}, Requested: ${distQty}` 
      });
    }

    // Decrement item quantity
    const updatedItem = await prisma.offerItem.update({
      where: { id: offerItemId },
      data: {
        quantity: item.quantity - distQty
      }
    });

    // Create distribution record
    const distribution = await prisma.offerDistribution.create({
      data: {
        offerItemId,
        quantity: distQty,
        date: date ? new Date(date) : new Date(),
        distributedToType,
        storeId: distributedToType === 'STORE' ? storeId : null,
        stallSessionId: distributedToType === 'EVENT' ? stallSessionId : null,
        notes: notes || ''
      }
    });

    res.status(201).json({ 
      success: true, 
      message: 'Promotional items distributed successfully', 
      data: { distribution, offerItem: updatedItem } 
    });
  } catch (error) {
    next(error);
  }
};

// Retrieve distribution logs list
exports.getOfferDistributions = async (req, res, next) => {
  try {
    const { offerItemId, storeId, stallSessionId } = req.query;

    const where = {};
    if (offerItemId) where.offerItemId = offerItemId;
    if (storeId) where.storeId = storeId;
    if (stallSessionId) where.stallSessionId = stallSessionId;

    const distributions = await prisma.offerDistribution.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        offerItem: true,
        store: true,
        stallSession: true
      }
    });

    res.json({ success: true, data: distributions });
  } catch (error) {
    next(error);
  }
};
