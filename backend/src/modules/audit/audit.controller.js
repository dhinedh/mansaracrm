// backend/src/modules/audit/audit.controller.js
const prisma = require('../../config/database');
const mongoose = require('mongoose');

/**
 * GET /api/audit/logs
 * List audit trail with rich filtering & pagination (Admin only)
 */
exports.getAuditLogs = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 25, 
      entity, 
      action, 
      userId, 
      search, 
      startDate, 
      endDate,
      entityId
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 25, 100);
    const skip = (pageNum - 1) * limitNum;

    const AuditLogModel = mongoose.model('AuditLog');
    const query = {};

    if (entity && entity !== 'ALL') {
      query.entity = entity;
    }
    if (entityId) {
      query.entityId = entityId;
    }
    if (action && action !== 'ALL') {
      query.action = action;
    }
    if (userId) {
      query.userId = userId;
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }
    if (search) {
      query.$or = [
        { recordTitle: new RegExp(search, 'i') },
        { details: new RegExp(search, 'i') },
        { entity: new RegExp(search, 'i') },
        { action: new RegExp(search, 'i') }
      ];
    }

    const [logs, total] = await Promise.all([
      AuditLogModel.find(query)
        .populate('userId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AuditLogModel.countDocuments(query)
    ]);

    // Format logs with user details
    const formattedLogs = logs.map(l => ({
      id: l._id,
      userId: l.userId?._id || l.userId,
      userName: l.userId?.name || 'System / Admin',
      userEmail: l.userId?.email || '',
      userRole: l.userId?.role || 'ADMIN',
      action: l.action,
      entity: l.entity,
      entityId: l.entityId,
      recordTitle: l.recordTitle || `${l.entity} #${l.entityId || ''}`.trim(),
      details: l.details || '',
      oldValues: l.oldValues || null,
      newValues: l.newValues || null,
      ipAddress: l.ipAddress || '',
      createdAt: l.createdAt
    }));

    res.json({
      success: true,
      data: {
        logs: formattedLogs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/audit/logs/:entity/:entityId
 * Fetch complete history for a specific CRM record
 */
exports.getRecordHistory = async (req, res, next) => {
  try {
    const { entity, entityId } = req.params;
    const AuditLogModel = mongoose.model('AuditLog');

    const logs = await AuditLogModel.find({
      entity: new RegExp(`^${entity}$`, 'i'),
      entityId: String(entityId)
    })
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const formatted = logs.map(l => ({
      id: l._id,
      userId: l.userId?._id || l.userId,
      userName: l.userId?.name || 'Staff User',
      userRole: l.userId?.role || 'STAFF',
      action: l.action,
      entity: l.entity,
      entityId: l.entityId,
      recordTitle: l.recordTitle,
      details: l.details,
      oldValues: l.oldValues,
      newValues: l.newValues,
      createdAt: l.createdAt
    }));

    res.json({
      success: true,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/audit/stats
 * Aggregate audit stats for dashboard
 */
exports.getAuditStats = async (req, res, next) => {
  try {
    const AuditLogModel = mongoose.model('AuditLog');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalLogs, todayLogs, moduleBreakdown] = await Promise.all([
      AuditLogModel.countDocuments({}),
      AuditLogModel.countDocuments({ createdAt: { $gte: today } }),
      AuditLogModel.aggregate([
        { $group: { _id: '$entity', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalLogs,
        todayLogs,
        moduleBreakdown: moduleBreakdown.map(b => ({ entity: b._id, count: b.count }))
      }
    });
  } catch (error) {
    next(error);
  }
};
