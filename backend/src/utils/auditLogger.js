// backend/src/utils/auditLogger.js
// Central Audit Logging Utility for Mansara CRM
const prisma = require('../config/database');

/**
 * Log an audit action to AuditLog collection.
 * 
 * @param {Object} params
 * @param {string|Object} params.userId - User ID who made the change
 * @param {string} params.action - CREATE, UPDATE, DELETE, STATUS_CHANGE, STOCK_ADJUSTMENT, LOCATION_VERIFIED
 * @param {string} params.entity - Module/Entity name: 'Store', 'Order', 'Product', 'Stock', 'Customer', 'Margin', 'Invoice', 'MarketingEvent'
 * @param {string} params.entityId - ID of the modified record
 * @param {string} [params.recordTitle] - Human-readable name/title of the record
 * @param {string} [params.details] - Short description of the modification
 * @param {Object} [params.oldValues] - State before change
 * @param {Object} [params.newValues] - State after change
 * @param {Object} [params.req] - Express request (to extract IP and user)
 */
async function logAudit({
  userId,
  action,
  entity,
  entityId,
  recordTitle = '',
  details = '',
  oldValues = null,
  newValues = null,
  req = null
}) {
  try {
    const effectiveUserId = userId || req?.user?.id || req?.user?._id;
    if (!effectiveUserId) {
      console.warn('[AuditLogger] Skipped audit log due to missing userId for entity:', entity, entityId);
      return null;
    }

    const ipAddress = req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || '127.0.0.1';

    // Sanitize values to prevent circular references or secrets
    const sanitize = (val) => {
      if (!val) return null;
      try {
        const copy = JSON.parse(JSON.stringify(val));
        if (copy.password) delete copy.password;
        if (copy.token) delete copy.token;
        return copy;
      } catch (e) {
        return { stringValue: String(val) };
      }
    };

    const logEntry = await prisma.auditLog.create({
      data: {
        userId: effectiveUserId,
        action: String(action).toUpperCase(),
        entity: String(entity),
        entityId: entityId ? String(entityId) : undefined,
        recordTitle: recordTitle ? String(recordTitle) : undefined,
        details: details ? String(details) : undefined,
        oldValues: sanitize(oldValues),
        newValues: sanitize(newValues),
        ipAddress: String(ipAddress)
      }
    });

    return logEntry;
  } catch (error) {
    console.error('[AuditLogger] Error writing audit log:', error.message);
    return null;
  }
}

module.exports = {
  logAudit
};
