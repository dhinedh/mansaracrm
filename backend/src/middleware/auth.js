// src/middleware/auth.js — JWT Authentication Middleware
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access token required' });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'mansara_crm_jwt_secret_key_2024';
    const decoded = jwt.verify(token, secret);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { dealer: true },
    });

    if (!user) return res.status(401).json({ success: false, message: 'User not found' });
    if (!user.isActive) return res.status(403).json({ success: false, message: 'Account is deactivated' });

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  const userRole = (req.user?.role || '').toUpperCase();
  const staffRole = (req.user?.staffRole || '').toUpperCase();
  const normalizedRoles = roles.map(r => r.toUpperCase());
  if (!normalizedRoles.includes(userRole) && !normalizedRoles.includes(staffRole)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }
  next();
};

const requireStaffRole = (...staffRoles) => (req, res, next) => {
  const userRole = (req.user?.role || '').toUpperCase();
  if (userRole !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  // Super admin bypasses all module sub-role checks
  const staffRole = (req.user?.staffRole || '').toUpperCase();
  if (!req.user?.staffRole || staffRole === 'ADMIN') {
    return next();
  }
  const normalizedStaffRoles = staffRoles.map(s => s.toUpperCase());
  if (!normalizedStaffRoles.includes(staffRole)) {
    return res.status(403).json({ success: false, message: 'You do not have privilege access for this module' });
  }
  next();
};

const requireApprovedDealer = (req, res, next) => {
  if (req.user.role === 'DEALER') {
    if (!req.user.dealer || req.user.dealer.approvalStatus !== 'APPROVED') {
      return res.status(403).json({ success: false, message: 'Dealer account not approved yet' });
    }
  }
  next();
};

module.exports = { verifyToken, requireRole, requireStaffRole, requireApprovedDealer };
