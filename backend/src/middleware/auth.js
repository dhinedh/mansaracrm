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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

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
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
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

module.exports = { verifyToken, requireRole, requireApprovedDealer };
