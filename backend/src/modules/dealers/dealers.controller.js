// src/modules/dealers/dealers.controller.js
const prisma = require('../../config/database');
const bcrypt = require('bcryptjs');

exports.getAllDealers = async (req, res, next) => {
  try {
    const { status, zone, search } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) {
      where.approvalStatus = status;
    }
    if (zone) {
      where.zone = zone;
    }
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const { data: dealers, total } = await prisma.dealer.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            isActive: true,
            lastLogin: true
          }
        },
        categoryDetails: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    res.json({
      success: true,
      data: dealers,
      total,
      page,
      limit
    });
  } catch (error) {
    next(error);
  }
};

exports.getDealerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const dealer = await prisma.dealer.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            isActive: true,
            lastLogin: true
          }
        },
        stores: true,
        inventory: {
          include: {
            product: true
          }
        },
        categoryDetails: true
      }
    });

    if (!dealer) {
      return res.status(404).json({ success: false, message: 'Dealer not found' });
    }

    // Enrich with default margin rule — so edit forms always pre-populate this field
    // even for dealers registered before this field was introduced
    const defaultMarginRule = await prisma.margin.findFirst({
      where: {
        dealerId: id,
        isDefault: true,
        storeId: null,
        productId: null,
        categoryId: null
      }
    });
    dealer.defaultMargin = defaultMarginRule?.marginPercent ?? 10;

    res.json({
      success: true,
      data: dealer
    });
  } catch (error) {
    next(error);
  }
};


exports.updateDealer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const existingDealer = await prisma.dealer.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!existingDealer) {
      return res.status(404).json({ success: false, message: 'Dealer not found' });
    }

    const updatedDealer = await prisma.$transaction(async (tx) => {
      // Update User Name
      if (name) {
        await tx.user.update({
          where: { id: existingDealer.userId },
          data: { name }
        });
      }

      // Gather all fields sent in request body that belong to the Dealer schema dynamically
      const updateData = {};
      const schemaPaths = prisma.dealer.model.schema.paths;

      for (const path in schemaPaths) {
        if (['_id', '__v', 'userId', 'createdAt', 'updatedAt'].includes(path)) continue;
        if (req.body[path] !== undefined) {
          const schemaType = schemaPaths[path];
          if (schemaType.instance === 'Number') {
            if (req.body[path] === null || req.body[path] === '') {
              updateData[path] = path === 'defaultMargin' ? 10 : null;
            } else {
              updateData[path] = parseFloat(req.body[path]);
            }
          } else {
            updateData[path] = req.body[path];
          }
        }
      }

      // Handle legacy/fallback for zone/zones
      if (req.body.zones === undefined && req.body.zone !== undefined) {
        updateData.zones = req.body.zone ? [req.body.zone] : [];
      }

      // Sync defaultMargin to Margin collection if it was updated
      if (updateData.defaultMargin !== undefined) {
        const mongoose = require('mongoose');
        const marginModel = mongoose.model('Margin');
        await marginModel.findOneAndUpdate(
          { dealerId: id, isDefault: true },
          { marginPercent: updateData.defaultMargin },
          { upsert: true }
        );
      }

      // Update Dealer Details
      return await tx.dealer.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });
    });

    res.json({
      success: true,
      message: 'Dealer updated successfully',
      data: updatedDealer
    });
  } catch (error) {
    next(error);
  }
};

exports.approveDealer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body; // status: APPROVED or REJECTED

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid approval status. Must be APPROVED or REJECTED' });
    }

    const dealer = await prisma.dealer.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!dealer) {
      return res.status(404).json({ success: false, message: 'Dealer not found' });
    }

    const updatedDealer = await prisma.$transaction(async (tx) => {
      const updateData = {
        approvalStatus: status,
        approvedAt: status === 'APPROVED' ? new Date() : null,
        approvedBy: req.user.id
      };
      if (notes) updateData.notes = notes;

      const d = await tx.dealer.update({
        where: { id },
        data: updateData
      });

      // Send a notification to the dealer
      await tx.notification.create({
        data: {
          userId: dealer.userId,
          type: 'ACCOUNT_UPDATE',
          title: `Dealer Account ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
          message: status === 'APPROVED'
            ? `Congratulations! Your dealer account with Mansara Foods has been approved. You can now log in and build invoices.`
            : `Your dealer application status: Rejected. Reason: ${notes || 'No reason provided.'}`,
          metadata: { status }
        }
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: status === 'APPROVED' ? 'APPROVE_DEALER' : 'REJECT_DEALER',
          entity: 'Dealer',
          entityId: id,
          newValues: { status }
        }
      });

      return d;
    });

    res.json({
      success: true,
      message: `Dealer account ${status.toLowerCase()} successfully`,
      data: updatedDealer
    });
  } catch (error) {
    next(error);
  }
};

exports.toggleDealerActive = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body; // boolean

    const dealer = await prisma.dealer.findUnique({
      where: { id }
    });

    if (!dealer) {
      return res.status(404).json({ success: false, message: 'Dealer not found' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: dealer.userId },
        data: { isActive }
      });

      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: isActive ? 'ACTIVATE_DEALER' : 'DEACTIVATE_DEALER',
          entity: 'Dealer',
          entityId: id,
          newValues: { isActive }
        }
      });
    });

    res.json({
      success: true,
      message: `Dealer successfully ${isActive ? 'activated' : 'deactivated'}`
    });
  } catch (error) {
    next(error);
  }
};

exports.changeDealerPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const dealer = await prisma.dealer.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!dealer) {
      return res.status(404).json({ success: false, message: 'Dealer not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: dealer.userId },
        data: { password: hashedPassword }
      });

      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'CHANGE_DEALER_PASSWORD',
          entity: 'User',
          entityId: dealer.userId,
          newValues: { changedBy: req.user.email, dealerCompany: dealer.companyName }
        }
      });

      await tx.notification.create({
        data: {
          userId: dealer.userId,
          type: 'ACCOUNT_UPDATE',
          title: 'Password Changed',
          message: 'Your account password has been updated by the administrator. Please use your new password on next login.',
          metadata: { changedAt: new Date().toISOString() }
        }
      });
    });

    res.json({
      success: true,
      message: `Password updated successfully for ${dealer.companyName}`
    });
  } catch (error) {
    next(error);
  }
};

exports.lookupPincode = async (req, res, next) => {
  try {
    const { pincode } = req.params;
    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({ success: false, message: 'Invalid Indian Pincode. Must be 6 digits.' });
    }

    const axios = require('axios');
    const response = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = response.data[0];

    if (data.Status !== 'Success' || !data.PostOffice || data.PostOffice.length === 0) {
      return res.json({ success: false, message: 'Pincode not found' });
    }

    const first = data.PostOffice[0];
    const district = first.District;
    const state = first.State;

    const CHENNAI_ZONES = [
      'Thiruvottiyur', 'Manali', 'Madhavaram', 'Tondiarpet', 'Royapuram',
      'Thiru-Vi-Ka Nagar', 'Ambattur', 'Anna Nagar', 'Teynampet', 'Kodambakkam',
      'Valasaravakkam', 'Alandur', 'Adyar', 'Perungudi', 'Sholinganallur'
    ];

    let suggestedZones = [];
    if (district.toLowerCase() === 'chennai') {
      suggestedZones = CHENNAI_ZONES;
    } else {
      suggestedZones = [district];
    }

    res.json({
      success: true,
      data: {
        district,
        state,
        suggestedZones
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateSelfProfile = async (req, res, next) => {
  try {
    const dealerId = req.user.dealer?.id;
    if (!dealerId) {
      return res.status(400).json({ success: false, message: 'Dealer profile not found' });
    }

    const { name, companyName, phone, address, city, state, pincode, logoBase64, bankDetails, invoiceTerms, invoicePrefix } = req.body;

    const updatedDealer = await prisma.$transaction(async (tx) => {
      if (name) {
        await tx.user.update({
          where: { id: req.user.id },
          data: { name }
        });
      }

      const updateData = {
        companyName: companyName || undefined,
        phone: phone || undefined,
        address: address || undefined,
        city: city !== undefined ? city : undefined,
        state: state !== undefined ? state : undefined,
        pincode: pincode !== undefined ? pincode : undefined,
        logoBase64: logoBase64 !== undefined ? logoBase64 : undefined
      };

      if (bankDetails !== undefined) {
        updateData.bankDetails = bankDetails;
      }

      if (invoiceTerms !== undefined) {
        updateData.invoiceTerms = invoiceTerms;
      }

      if (invoicePrefix !== undefined) {
        updateData.invoicePrefix = invoicePrefix;
      }

      return await tx.dealer.update({
        where: { id: dealerId },
        data: updateData,
        include: {
          user: {
            select: { id: true, email: true, name: true, isActive: true }
          }
        }
      });
    });

    res.json({
      success: true,
      message: 'Billing profile updated successfully',
      data: updatedDealer
    });
  } catch (error) {
    next(error);
  }
};

exports.checkZoneConflicts = async (req, res, next) => {
  try {
    let { zones } = req.query;
    if (!zones) {
      return res.json({ success: true, conflicts: [] });
    }

    // Normalize zones to array
    const queryZones = Array.isArray(zones) ? zones : [zones];
    if (queryZones.length === 0) {
      return res.json({ success: true, conflicts: [] });
    }

    // Query active approved dealers with overlapping zones
    const conflictingDealers = await prisma.dealer.findMany({
      where: {
        approvalStatus: 'APPROVED',
        zones: { in: queryZones }
      },
      include: {
        user: true
      }
    });

    // Filter to active dealer users
    const activeConflicts = conflictingDealers.filter(d => d.user?.isActive);

    const conflicts = activeConflicts.map(d => ({
      dealerId: d.id,
      companyName: d.companyName,
      zones: d.zones.filter(z => queryZones.includes(z))
    }));

    res.json({
      success: true,
      conflicts
    });
  } catch (error) {
    next(error);
  }
};

