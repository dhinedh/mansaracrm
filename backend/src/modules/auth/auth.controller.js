// src/modules/auth/auth.controller.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/database');

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

    const hashedPassword = await bcrypt.hash(password || 'Dealer@123', 12); // Default password if not provided

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

    res.status(201).json({
      success: true,
      message: 'Dealer registered successfully. Pending approval.',
      data: {
        id: result.dealer.id,
        email: result.user.email,
        name: result.user.name,
        companyName: result.dealer.companyName,
        approvalStatus: result.dealer.approvalStatus
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
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Avoid leaking user existence, but let's be descriptive enough in development/CRM settings
      return res.status(404).json({ success: false, message: 'Email address not found' });
    }

    // For safety, generate temporary password/token placeholder for now
    const resetToken = Math.random().toString(36).substring(2, 15);
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordReset: resetToken,
        resetExpiry: expiry
      }
    });

    // In a production app, we would send an email here.
    // For now we will return it in the API response in development so the user can easily reset it,
    // plus log it to the server console.
    console.log(`✉️ Forgot password requested. Reset Token for ${email} is: ${resetToken}`);

    res.json({
      success: true,
      message: 'Password reset instructions have been generated.',
      developmentToken: resetToken // convenient for easy testing!
    });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { email, token, newPassword } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        email,
        passwordReset: token,
        resetExpiry: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
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

    res.json({
      success: true,
      message: 'Password has been reset successfully'
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
