// src/modules/dealers/dealers.controller.js
const prisma = require('../../config/database');
const bcrypt = require('bcryptjs');

exports.getAllDealers = async (req, res, next) => {
  try {
    const { status, zone, search } = req.query;

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

    const dealers = await prisma.dealer.findMany({
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
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: dealers
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
    const {
      name,
      companyName,
      gstNumber,
      address,
      city,
      state,
      pincode,
      zones,
      zone,  // legacy single string support
      area,
      phone,
      dealerType,
      creditLimit,
      initialDeposit,
      categories,
      notes
    } = req.body;

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

      // Update Dealer Details
      return await tx.dealer.update({
        where: { id },
        data: {
          companyName: companyName || existingDealer.companyName,
          gstNumber: gstNumber !== undefined ? gstNumber : existingDealer.gstNumber,
          address: address || existingDealer.address,
          city: city !== undefined ? city : existingDealer.city,
          state: state !== undefined ? state : existingDealer.state,
          pincode: pincode !== undefined ? pincode : existingDealer.pincode,
          zones: zones !== undefined ? zones : (zone !== undefined ? (zone ? [zone] : []) : existingDealer.zones),
          area: area !== undefined ? area : existingDealer.area,
          phone: phone || existingDealer.phone,
          dealerType: dealerType || existingDealer.dealerType,
          creditLimit: creditLimit !== undefined ? creditLimit : existingDealer.creditLimit,
          initialDeposit: initialDeposit !== undefined ? parseFloat(initialDeposit) : existingDealer.initialDeposit,
          categories: categories !== undefined ? categories : existingDealer.categories,
          notes: notes !== undefined ? notes : existingDealer.notes
        },
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

    const { name, companyName, phone, address, city, state, pincode, logoBase64, bankDetails, invoiceTerms } = req.body;

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

