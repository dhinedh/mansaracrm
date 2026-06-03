// src/modules/stores/stores.controller.js
const prisma = require('../../config/database');

exports.getDealerStores = async (req, res, next) => {
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

    const stores = await prisma.store.findMany({
      where: { dealerId, isActive: true },
      orderBy: { name: 'asc' }
    });

    res.json({ success: true, data: stores });
  } catch (error) {
    next(error);
  }
};

exports.createStore = async (req, res, next) => {
  try {
    if (req.user.role !== 'DEALER') {
      return res.status(403).json({ success: false, message: 'Only dealers can manage stores' });
    }

    const { name, gstNumber, address, city, state, pincode, zone, phone } = req.body;
    const dealerId = req.user.dealer.id;

    const store = await prisma.store.create({
      data: {
        dealerId,
        name,
        gstNumber,
        address,
        city,
        state,
        pincode,
        zone,
        phone
      }
    });

    res.status(201).json({ success: true, message: 'Store created successfully', data: store });
  } catch (error) {
    next(error);
  }
};

exports.updateStore = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, gstNumber, address, city, state, pincode, zone, phone } = req.body;

    const store = await prisma.store.findUnique({ where: { id } });
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    // Auth validation: only owning dealer can edit
    if (req.user.role === 'DEALER' && store.dealerId !== req.user.dealer.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const updatedStore = await prisma.store.update({
      where: { id },
      data: {
        name: name || store.name,
        gstNumber: gstNumber !== undefined ? gstNumber : store.gstNumber,
        address: address || store.address,
        city: city !== undefined ? city : store.city,
        state: state !== undefined ? state : store.state,
        pincode: pincode !== undefined ? pincode : store.pincode,
        zone: zone !== undefined ? zone : store.zone,
        phone: phone !== undefined ? phone : store.phone
      }
    });

    res.json({ success: true, message: 'Store updated successfully', data: updatedStore });
  } catch (error) {
    next(error);
  }
};

exports.deleteStore = async (req, res, next) => {
  try {
    const { id } = req.params;

    const store = await prisma.store.findUnique({ where: { id } });
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    if (req.user.role === 'DEALER' && store.dealerId !== req.user.dealer.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Soft delete
    await prisma.store.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({ success: true, message: 'Store deleted successfully' });
  } catch (error) {
    next(error);
  }
};
