// src/modules/auth/auth.controller.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/database');

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
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
      initialDeposit,
      categories  // array of category IDs
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
          initialDeposit: initialDeposit ? parseFloat(initialDeposit) : 0,
          categories: categories || [],
          approvalStatus: 'PENDING' // Starts as PENDING
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
          dealer: user.dealer ? {
            id: user.dealer.id,
            companyName: user.dealer.companyName,
            approvalStatus: user.dealer.approvalStatus
          } : null
        }
      }
    });
  } catch (error) {
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
