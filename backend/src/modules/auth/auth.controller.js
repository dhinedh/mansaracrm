// src/modules/auth/auth.controller.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/database');
const { sendVendorRegistrationEmail } = require('../../utils/emailService');
const { sendVendorWhatsAppRegistration, sendWhatsAppOTP } = require('../../utils/whatsappService');

const generateTokens = (user) => {
  const secret = process.env.JWT_SECRET || 'mansara_crm_jwt_secret_key_2024';
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role, staffRole: user.staffRole },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET || 'mansara_crm_refresh_secret_key_2024',
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );

  return { accessToken, refreshToken };
};

exports.registerDealer = async (req, res, next) => {
  try {
    const { 
      email, 
      password, 
      name, 
      companyName, 
      gstNumber, 
      address, 
      city, 
      state, 
      pincode, 
      zones,      // array of zone strings
      zone,       // legacy single string support
      area, 
      phone, 
      dealerType,
      dealerCategory,
      initialDeposit,
      categories,  // array of category IDs
      defaultMargin,
      billingProfile  // 'NORMAL' | 'ADVANCE'
    } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const fs = require('fs');
      const path = require('path');
      fs.appendFileSync(path.join(__dirname, '../../../errors.log'), `[Email Conflict] ${new Date().toISOString()} - Email: ${email}\n`);
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    if (gstNumber) {
      const existingGST = await prisma.dealer.findUnique({ where: { gstNumber } });
      if (existingGST) {
        const fs = require('fs');
        const path = require('path');
        fs.appendFileSync(path.join(__dirname, '../../../errors.log'), `[GST Conflict] ${new Date().toISOString()} - GST: ${gstNumber}\n`);
        return res.status(400).json({ success: false, message: 'GST Number already registered' });
      }
    }

    const rawPassword = password || 'Dealer@123';
    const hashedPassword = await bcrypt.hash(rawPassword, 12); // Default password if not provided

    // Create user and dealer profile in single transaction
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: 'DEALER',
          isActive: true
        }
      });

      // Create default margin rule for new dealer
      const marginPercentVal = defaultMargin !== undefined && defaultMargin !== null && defaultMargin !== ''
        ? parseFloat(defaultMargin)
        : 10.0;

      const newDealer = await tx.dealer.create({
        data: {
          userId: newUser.id,
          companyName,
          gstNumber,
          address,
          city,
          state,
          pincode,
          zones: zones && zones.length > 0 ? zones : (zone ? [zone] : []),
          area,
          phone,
          dealerType: dealerType || 'RETAIL',
          dealerCategory: dealerCategory || 'STARTER',
          initialDeposit: initialDeposit ? parseFloat(initialDeposit) : 0,
          categories: categories || [],
          billingProfile: billingProfile || 'NORMAL',
          approvalStatus: 'PENDING', // Starts as PENDING
          defaultMargin: marginPercentVal
        }
      });

      await tx.margin.create({
        data: {
          dealerId: newDealer.id,
          marginPercent: marginPercentVal,
          isDefault: true
        }
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'REGISTER_DEALER',
          entity: 'Dealer',
          entityId: newDealer.id,
          newValues: { email, name, companyName }
        }
      });

      // Create vendor welcoming notification
      await tx.notification.create({
        data: {
          userId: newUser.id,
          type: 'ACCOUNT_UPDATE',
          title: 'Welcome to Mansara Foods CRM!',
          message: `Welcome ${name}! Your dealer partner account for ${companyName} has been registered successfully. Login Email: ${email}`,
          metadata: { 
            email, 
            companyName, 
            dealerType: dealerType || 'RETAIL', 
            dealerCategory: dealerCategory || 'STARTER',
            defaultMargin: marginPercentVal
          }
        }
      });

      // Create admin notification
      const admins = await tx.user.findMany({ where: { role: 'ADMIN' } });
      for (const admin of admins) {
        await tx.notification.create({
          data: {
            userId: admin.id,
            type: 'ACCOUNT_UPDATE',
            title: 'New Dealer Registration',
            message: `Dealer ${companyName} (${name}) has registered and is pending approval.`,
            metadata: { dealerId: newDealer.id }
          }
        });
      }

      return { user: newUser, dealer: newDealer };
    });

    let emailResult = { success: false };
    let whatsappResult = { success: false };

    // Send registration notifications via Email & WhatsApp
    // 1. Send registration email with details
    emailResult = await sendVendorRegistrationEmail({
      email: result.user.email,
      name: result.user.name,
      companyName: result.dealer.companyName,
      password: rawPassword,
      phone: result.dealer.phone,
      dealerType: result.dealer.dealerType,
      dealerCategory: result.dealer.dealerCategory,
      defaultMargin: result.dealer.defaultMargin,
      gstNumber: result.dealer.gstNumber,
      address: result.dealer.address,
      city: result.dealer.city,
      state: result.dealer.state,
      pincode: result.dealer.pincode,
      approvalStatus: result.dealer.approvalStatus
    });

    // 2. Send registration message directly via WhatsApp Chatbot to vendor's WhatsApp phone number
    whatsappResult = await sendVendorWhatsAppRegistration({
      phone: result.dealer.phone,
      name: result.user.name,
      companyName: result.dealer.companyName,
      email: result.user.email,
      password: rawPassword,
      dealerType: result.dealer.dealerType,
      dealerCategory: result.dealer.dealerCategory,
      defaultMargin: result.dealer.defaultMargin,
      gstNumber: result.dealer.gstNumber,
      approvalStatus: result.dealer.approvalStatus
    });

    res.status(201).json({
      success: true,
      message: 'Dealer registered successfully. Registration details message dispatched to vendor via Email & WhatsApp chatbot.',
      data: {
        id: result.dealer.id,
        email: result.user.email,
        name: result.user.name,
        password: rawPassword,
        companyName: result.dealer.companyName,
        phone: result.dealer.phone,
        dealerType: result.dealer.dealerType,
        dealerCategory: result.dealer.dealerCategory,
        defaultMargin: result.dealer.defaultMargin,
        approvalStatus: result.dealer.approvalStatus,
        emailNotificationSent: emailResult.success,
        whatsappNotificationSent: whatsappResult.success,
        whatsappUrl: whatsappResult.whatsappUrl
      }
    });
  } catch (error) {
    const fs = require('fs');
    const path = require('path');
    try {
      fs.appendFileSync(path.join(__dirname, '../../../errors.log'), `[Exception] ${new Date().toISOString()} - Error: ${error.message} - Stack: ${error.stack}\n`);
    } catch (e) {
      console.error(e);
    }
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { dealer: true }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account is deactivated' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    const { accessToken, refreshToken } = generateTokens(user);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token: accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          staffRole: user.staffRole,
          dealer: user.dealer ? {
            id: user.dealer.id,
            companyName: user.dealer.companyName,
            approvalStatus: user.dealer.approvalStatus
          } : null
        }
      }
    });
  } catch (error) {
    if (error.name === 'MongooseError' || error.message?.includes('buffering timed out') || error.message?.includes('timed out')) {
      console.error('⚠️ Database buffering timeout during login attempt:', error.message);
      return res.status(503).json({
        success: false,
        message: 'Database connection temporarily timed out. Please try logging in again.'
      });
    }
    next(error);
  }
};

exports.me = async (req, res, next) => {
  try {
    const user = req.user;
    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        staffRole: user.staffRole,
        dealer: user.dealer
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const rawIdentifier = req.body.identifier || req.body.email || '';
    const cleanId = rawIdentifier.trim();

    if (!cleanId) {
      return res.status(400).json({ success: false, message: 'Email or phone number is required' });
    }

    let user = null;
    let dealerPhone = '';

    // Check if input is email (contains @)
    if (cleanId.includes('@')) {
      user = await prisma.user.findUnique({
        where: { email: cleanId.toLowerCase() },
        include: { dealer: true }
      });
    } else {
      // Input is phone number — search in Dealer model or User model
      const cleanPhone = cleanId.replace(/\D/g, '');
      
      if (cleanPhone) {
        const dealer = await prisma.dealer.findFirst({
          where: {
            $or: [
              { phone: cleanId },
              { phone: cleanPhone },
              { phone: { $regex: cleanPhone } }
            ]
          },
          include: { user: true }
        });
        if (dealer && dealer.user) {
          user = dealer.user;
          dealerPhone = dealer.phone;
        }
      }

      if (!user) {
        user = await prisma.user.findFirst({
          where: {
            $or: [
              { email: cleanId.toLowerCase() },
              { phone: cleanId }
            ]
          },
          include: { dealer: true }
        });
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No registered account found with the provided email or phone number.'
      });
    }

    // Determine target phone number for WhatsApp OTP
    const phone = user.dealer?.phone || user.phone || dealerPhone;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'No registered WhatsApp phone number found for this account. Please contact support.'
      });
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP & expiry to User record
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordReset: otp,
        resetExpiry: expiry
      }
    });

    // Mask phone number for security display e.g. +91 ******3210
    const digitsOnly = phone.replace(/\D/g, '');
    const maskedPhone = digitsOnly.length >= 10
      ? `${digitsOnly.slice(0, 2)}******${digitsOnly.slice(-4)}`
      : '******' + digitsOnly.slice(-4);

    // Dispatch WhatsApp OTP
    console.log(`🔐 Forgot password requested. Sending WhatsApp OTP for user ${user.email} (${phone})...`);
    await sendWhatsAppOTP({
      phone,
      otp,
      name: user.name
    });

    res.json({
      success: true,
      message: `OTP has been sent to your registered WhatsApp number (+91 ${maskedPhone}).`,
      data: {
        email: user.email,
        phone: phone,
        maskedPhone: `+91 ${maskedPhone}`,
        developmentOtp: otp // Convenient for local developer testing!
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { identifier, token, newPassword } = req.body;
    const cleanId = (identifier || req.body.email || '').trim();
    const cleanToken = (token || '').trim();

    if (!cleanToken) {
      return res.status(400).json({ success: false, message: '6-digit OTP is required' });
    }

    let user = null;

    // Search user by email, phone, or token match
    if (cleanId.includes('@')) {
      user = await prisma.user.findFirst({
        where: {
          email: cleanId.toLowerCase(),
          passwordReset: cleanToken,
          resetExpiry: { gt: new Date() }
        }
      });
    } else if (cleanId) {
      const cleanPhone = cleanId.replace(/\D/g, '');
      const dealer = await prisma.dealer.findFirst({
        where: {
          $or: [{ phone: cleanId }, { phone: cleanPhone }]
        }
      });
      const userId = dealer ? dealer.userId : null;

      user = await prisma.user.findFirst({
        where: {
          $or: [
            { id: userId },
            { email: cleanId.toLowerCase() },
            { phone: cleanId }
          ],
          passwordReset: cleanToken,
          resetExpiry: { gt: new Date() }
        }
      });
    } else {
      user = await prisma.user.findFirst({
        where: {
          passwordReset: cleanToken,
          resetExpiry: { gt: new Date() }
        }
      });
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired 6-digit OTP. Please request a new OTP.'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordReset: null,
        resetExpiry: null
      }
    });

    console.log(`✓ Password successfully reset via WhatsApp OTP for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

exports.createStaffUser = async (req, res, next) => {
  try {
    const { email, password, name, staffRole } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password || 'Staff@123', 12);
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN',
        staffRole: staffRole || 'VIEWER',
        isActive: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Staff user created successfully',
      data: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        staffRole: newUser.staffRole,
        isActive: newUser.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getStaffUsers = async (req, res, next) => {
  try {
    // Only return users who have role: 'ADMIN' (staff)
    const staff = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        staffRole: true,
        isActive: true,
        lastLogin: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    next(error);
  }
};

exports.updateStaffUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, staffRole, isActive, password } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.role !== 'ADMIN') {
      return res.status(404).json({ success: false, message: 'Staff user not found' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (staffRole) updateData.staffRole = staffRole;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Staff user updated successfully',
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        staffRole: updatedUser.staffRole,
        isActive: updatedUser.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteStaffUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.role !== 'ADMIN') {
      return res.status(404).json({ success: false, message: 'Staff user not found' });
    }

    // Do not allow deleting the last super admin
    if (user.staffRole === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN', staffRole: 'ADMIN' }
      });
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot delete the last super administrator' });
      }
    }

    await prisma.user.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Staff user deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
