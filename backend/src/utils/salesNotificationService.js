// src/utils/salesNotificationService.js
// Central Notification & WhatsApp Engine for Field Sales Activities
const mongoose = require('mongoose');
const { sendAdminFieldSalesAlert } = require('./whatsappService');

/**
 * Notifies all Admins both in-app (Notification Center) and via WhatsApp on Admin phone numbers
 * for any field sales action taken by a salesperson.
 */
const notifyAdminOfSalesAction = async ({
  actionType = 'FIELD_ACTION', // 'ORDER_REQUEST' | 'FIELD_INVOICE' | 'STORE_VISIT' | 'VISIT_CHECKOUT' | 'NEW_STORE_LEAD' | 'STOCK_AUDIT' | 'STOCK_ADJUSTMENT' | 'MARGIN_REQUEST' | 'COMPETITOR_INTEL' | 'PAYMENT_COLLECTION' | 'BEAT_VISIT'
  title = 'Field Sales Activity Alert',
  message = '',
  salesperson = {},
  store = {},
  details = '',
  metadata = {},
  targetUrl = 'https://crm.mansarafoods.com/admin/field-orders'
}) => {
  try {
    const UserModel = mongoose.model('User');
    const NotificationModel = mongoose.model('Notification');

    const salespersonName = salesperson?.name || 'Field Sales Executive';
    const salespersonPhone = salesperson?.phone || '';
    const storeName = store?.name || 'Retail Outlet';
    const storePhone = store?.phone || '';
    const storeLocation = store?.city || store?.address || 'Tamil Nadu';

    // 1. Create In-App Notifications for ALL Admins
    try {
      const admins = await UserModel.find({ role: 'ADMIN' }).select('_id');
      const notifType = actionType === 'ORDER_REQUEST' ? 'ORDER_REQUEST' : 'FIELD_SALES';

      if (admins && admins.length > 0) {
        for (const admin of admins) {
          await NotificationModel.create({
            userId: admin._id,
            type: notifType,
            title,
            message,
            isRead: false,
            metadata: {
              ...metadata,
              actionType,
              salespersonId: salesperson?.id,
              salespersonName,
              storeId: store?.id,
              storeName,
              targetUrl,
              source: 'FIELD_SALES',
              createdAt: new Date()
            }
          });
        }
        console.log(`[FIELD NOTIF] ✓ Created ${admins.length} in-app admin notification(s) for "${title}"`);
      }
    } catch (inAppErr) {
      console.warn('[FIELD NOTIF] Failed to save in-app notification:', inAppErr.message);
    }

    // 2. Dispatch WhatsApp Alert to Admin WhatsApp Numbers
    try {
      await sendAdminFieldSalesAlert({
        actionType,
        title,
        salespersonName,
        salespersonPhone,
        storeName,
        storePhone,
        storeLocation,
        details: details || message,
        targetUrl
      });
    } catch (waErr) {
      console.warn('[FIELD NOTIF] Failed to send Admin WhatsApp alert:', waErr.message);
    }
  } catch (error) {
    console.error('[FIELD NOTIF ERROR]', error.message);
  }
};

module.exports = {
  notifyAdminOfSalesAction
};
