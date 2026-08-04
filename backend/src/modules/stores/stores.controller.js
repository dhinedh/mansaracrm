// src/modules/stores/stores.controller.js
const prisma = require('../../config/database');

exports.getDealerStores = async (req, res, next) => {
  try {
    const where = { isActive: true };

    if (req.user.role === 'DEALER') {
      if (req.user.dealer) {
        where.dealerId = req.user.dealer.id;
      }
    } else if (req.query.dealerId) {
      where.dealerId = req.query.dealerId;
    }

    const stores = await prisma.store.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    const enriched = [];
    for (const store of stores) {
      let marginRule = null;
      if (store.dealerId) {
        marginRule = await prisma.margin.findFirst({
          where: {
            dealerId: store.dealerId,
            storeId: store.id,
            productId: null,
            categoryId: null
          }
        });
      }
      enriched.push({
        ...store,
        marginPercent: marginRule ? marginRule.marginPercent : null
      });
    }

    res.json({ success: true, data: enriched });
  } catch (error) {
    next(error);
  }
};

exports.createStore = async (req, res, next) => {
  try {
    // Allow both DEALER and ADMIN (for standalone B2C stores)
    let dealerId;
    if (req.user.role === 'DEALER') {
      dealerId = req.user.dealer.id;
    } else if (req.user.role === 'ADMIN') {
      dealerId = req.body.dealerId || null; // optional for admin-created stores
    } else {
      return res.status(403).json({ success: false, message: 'Only dealers or admins can manage stores' });
    }

    const {
      name, gstNumber, address, city, state, pincode, zone, phone,
      ownerName, ownerPhone, initialInvestment, notes,
      marginPercent, classification, revisitDate
    } = req.body;

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
        phone,
        ownerName: ownerName || '',
        ownerPhone: ownerPhone || '',
        initialInvestment: parseFloat(initialInvestment || 0),
        notes: notes || '',
        classification: classification || 'RETAIL',
        revisitDate: revisitDate ? new Date(revisitDate) : null
      }
    });

    if (dealerId && marginPercent !== undefined && marginPercent !== null && marginPercent !== '') {
      await prisma.margin.create({
        data: {
          dealerId,
          storeId: store.id,
          marginPercent: parseFloat(marginPercent)
        }
      });
    }

    res.status(201).json({ success: true, message: 'Store created successfully', data: store });
  } catch (error) {
    next(error);
  }
};

exports.updateStore = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name, gstNumber, address, city, state, pincode, zone, phone,
      ownerName, ownerPhone, initialInvestment, notes,
      marginPercent, classification, revisitDate
    } = req.body;

    const store = await prisma.store.findUnique({ where: { id } });
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    // Auth validation: only owning dealer or admin can edit
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
        phone: phone !== undefined ? phone : store.phone,
        ownerName: ownerName !== undefined ? ownerName : (store.ownerName || ''),
        ownerPhone: ownerPhone !== undefined ? ownerPhone : (store.ownerPhone || ''),
        initialInvestment: initialInvestment !== undefined ? parseFloat(initialInvestment) : (store.initialInvestment || 0),
        notes: notes !== undefined ? notes : (store.notes || ''),
        classification: classification !== undefined ? classification : store.classification,
        revisitDate: revisitDate !== undefined ? (revisitDate ? new Date(revisitDate) : null) : store.revisitDate
      }
    });

    if (store.dealerId && marginPercent !== undefined && marginPercent !== null) {
      const existingMargin = await prisma.margin.findFirst({
        where: {
          dealerId: store.dealerId,
          storeId: id,
          productId: null,
          categoryId: null
        }
      });

      if (marginPercent === '') {
        if (existingMargin) {
          await prisma.margin.delete({ where: { id: existingMargin.id } });
        }
      } else {
        if (existingMargin) {
          await prisma.margin.update({
            where: { id: existingMargin.id },
            data: { marginPercent: parseFloat(marginPercent) }
          });
        } else {
          await prisma.margin.create({
            data: {
              dealerId: store.dealerId,
              storeId: id,
              marginPercent: parseFloat(marginPercent)
            }
          });
        }
      }
    }

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
