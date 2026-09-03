// crm/backend/src/utils/centralNotificationService.js
// Central Multi-Channel Notification Engine for Mansara Foods B2B CRM

const { sendDealerTemplateMessage } = require('./whatsappService');
const sendEmail = require('./emailService');

const centralNotificationService = {
  /**
   * Helper to format currency INR
   */
  _formatCurrency: (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  },

  /**
   * 1. Stock Request Created (Order Placed by Dealer)
   */
  notifyStockRequestCreated: async (request, dealer) => {
    try {
      const phone = dealer.phone || dealer.whatsapp;
      const dealerName = dealer.name || dealer.companyName || 'Valued Partner';
      const requestId = request.requestId || request._id || request.id;
      const itemsCount = String(request.items?.length || 0);
      const totalVal = String(request.totalAmount || request.total || 0);

      console.log(`[CENTRAL NOTIF] Triggering StockRequestCreated for dealer ${dealerName} (${requestId})`);

      if (phone) {
        await sendDealerTemplateMessage({
          phone,
          templateName: 'dealer_stock_request_created_v1',
          bodyParameters: [dealerName, String(requestId), itemsCount, totalVal]
        });
      }

      if (dealer.email) {
        await sendEmail({
          to: dealer.email,
          subject: `Stock Request #${requestId} Submitted | Mansara Foods B2B`,
          html: `
            <h2>Stock Request Received! 📦</h2>
            <p>Dear <strong>${dealerName}</strong>,</p>
            <p>Your stock request <strong>#${requestId}</strong> has been submitted successfully.</p>
            <ul>
              <li><strong>Items Count:</strong> ${itemsCount} products</li>
              <li><strong>Estimated Total:</strong> ₹${totalVal}</li>
              <li><strong>Status:</strong> PENDING ALLOCATION</li>
            </ul>
            <p><a href="https://crm.mansarafoods.com/requests/${requestId}">Track Request in B2B Portal</a></p>
          `
        }).catch(err => console.warn('[EMAIL NOTIF FAIL]', err.message));
      }
    } catch (error) {
      console.error('[CENTRAL NOTIF ERROR] notifyStockRequestCreated:', error.message);
    }
  },

  /**
   * 2. Stock Request Dispatched (In-Transit)
   */
  notifyStockRequestDispatched: async (request, dealer, shippingData = {}) => {
    try {
      const phone = dealer.phone || dealer.whatsapp;
      const dealerName = dealer.name || dealer.companyName || 'Valued Partner';
      const requestId = request.requestId || request._id || request.id;
      const courier = shippingData.courier || request.courier || 'Mansara Logistics';
      const awb = shippingData.awb || request.trackingNumber || 'IN-TRANSIT';
      const edd = shippingData.edd || request.estimatedDeliveryDate || '2-3 Business Days';

      console.log(`[CENTRAL NOTIF] Triggering StockRequestDispatched for dealer ${dealerName} (${requestId})`);

      if (phone) {
        await sendDealerTemplateMessage({
          phone,
          templateName: 'dealer_stock_request_dispatched_v1',
          bodyParameters: [dealerName, String(requestId), courier, awb, String(edd)]
        });
      }

      if (dealer.email) {
        await sendEmail({
          to: dealer.email,
          subject: `Stock Request #${requestId} Dispatched 🚚 | Mansara Foods`,
          html: `
            <h2>Stock Request Dispatched! 🚚</h2>
            <p>Dear <strong>${dealerName}</strong>,</p>
            <p>Your stock request <strong>#${requestId}</strong> has been dispatched and is on its way to your warehouse.</p>
            <ul>
              <li><strong>Courier / Transport:</strong> ${courier}</li>
              <li><strong>AWB / Tracking No:</strong> ${awb}</li>
              <li><strong>Expected Delivery Date:</strong> ${edd}</li>
            </ul>
            <p><a href="https://crm.mansarafoods.com/requests/${requestId}">Track Live Location</a></p>
          `
        }).catch(err => console.warn('[EMAIL NOTIF FAIL]', err.message));
      }
    } catch (error) {
      console.error('[CENTRAL NOTIF ERROR] notifyStockRequestDispatched:', error.message);
    }
  },

  /**
   * 3. Stock Request Delivered
   */
  notifyStockRequestDelivered: async (request, dealer) => {
    try {
      const phone = dealer.phone || dealer.whatsapp;
      const dealerName = dealer.name || dealer.companyName || 'Valued Partner';
      const requestId = request.requestId || request._id || request.id;
      const delDate = new Date().toLocaleDateString('en-IN');

      console.log(`[CENTRAL NOTIF] Triggering StockRequestDelivered for dealer ${dealerName} (${requestId})`);

      if (phone) {
        await sendDealerTemplateMessage({
          phone,
          templateName: 'dealer_stock_request_delivered_v1',
          bodyParameters: [dealerName, String(requestId), delDate]
        });
      }

      if (dealer.email) {
        await sendEmail({
          to: dealer.email,
          subject: `Stock Request #${requestId} Delivered ✅ | Mansara Foods`,
          html: `
            <h2>Stock Delivered Successfully! ✅</h2>
            <p>Dear <strong>${dealerName}</strong>,</p>
            <p>Stock request <strong>#${requestId}</strong> was delivered to your registered store address on ${delDate}.</p>
            <p>Please inspect stock items and report any discrepancies or damages in the portal within 24 hours.</p>
          `
        }).catch(err => console.warn('[EMAIL NOTIF FAIL]', err.message));
      }
    } catch (error) {
      console.error('[CENTRAL NOTIF ERROR] notifyStockRequestDelivered:', error.message);
    }
  },

  /**
   * 4. B2B Tax Invoice Generated
   */
  notifyInvoiceGenerated: async (invoice, dealer, pdfUrl = '') => {
    try {
      const phone = dealer.phone || dealer.whatsapp;
      const dealerName = dealer.name || dealer.companyName || 'Valued Partner';
      const invNo = invoice.invoiceNumber || invoice._id || invoice.id;
      const reqId = invoice.requestId || invoice.orderId || 'N/A';
      const amount = String(invoice.totalAmount || invoice.total || 0);
      const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : 'Net 15 Days';
      const downloadLink = pdfUrl || `https://crm.mansarafoods.com/invoices/${invNo}.pdf`;

      console.log(`[CENTRAL NOTIF] Triggering InvoiceGenerated for ${dealerName} (${invNo})`);

      if (phone) {
        await sendDealerTemplateMessage({
          phone,
          templateName: 'dealer_tax_invoice_v1',
          bodyParameters: [dealerName, String(invNo), String(reqId), amount, dueDate, downloadLink]
        });
      }

      if (dealer.email) {
        await sendEmail({
          to: dealer.email,
          subject: `Tax Invoice #${invNo} Generated | Mansara Foods B2B`,
          html: `
            <h2>Tax Invoice Generated 📄</h2>
            <p>Dear <strong>${dealerName}</strong>,</p>
            <p>B2B Tax Invoice <strong>#${invNo}</strong> has been generated for stock request <strong>#${reqId}</strong>.</p>
            <ul>
              <li><strong>Total Payable:</strong> ₹${amount}</li>
              <li><strong>Payment Due Date:</strong> ${dueDate}</li>
            </ul>
            <p><a href="${downloadLink}">Download Invoice PDF</a></p>
          `
        }).catch(err => console.warn('[EMAIL NOTIF FAIL]', err.message));
      }
    } catch (error) {
      console.error('[CENTRAL NOTIF ERROR] notifyInvoiceGenerated:', error.message);
    }
  },

  /**
   * 5. Automated Payment Due Reminder
   */
  notifyPaymentReminder: async (invoice, dealer) => {
    try {
      const phone = dealer.phone || dealer.whatsapp;
      const dealerName = dealer.name || dealer.companyName || 'Valued Partner';
      const invNo = invoice.invoiceNumber || invoice._id || invoice.id;
      const amount = String(invoice.totalAmount || invoice.total || 0);
      const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : 'Due Soon';

      console.log(`[CENTRAL NOTIF] Triggering PaymentReminder for ${dealerName} (${invNo})`);

      if (phone) {
        await sendDealerTemplateMessage({
          phone,
          templateName: 'dealer_payment_reminder_v1',
          bodyParameters: [dealerName, String(invNo), amount, dueDate]
        });
      }
    } catch (error) {
      console.error('[CENTRAL NOTIF ERROR] notifyPaymentReminder:', error.message);
    }
  },

  /**
   * 6. Overdue Payment Alert (Credit Hold Warning)
   */
  notifyOverduePayment: async (invoice, dealer) => {
    try {
      const phone = dealer.phone || dealer.whatsapp;
      const dealerName = dealer.name || dealer.companyName || 'Valued Partner';
      const invNo = invoice.invoiceNumber || invoice._id || invoice.id;
      const amount = String(invoice.totalAmount || invoice.total || 0);
      const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : 'Overdue';

      console.log(`[CENTRAL NOTIF] Triggering OverduePayment for ${dealerName} (${invNo})`);

      if (phone) {
        await sendDealerTemplateMessage({
          phone,
          templateName: 'dealer_overdue_warning_v1',
          bodyParameters: [dealerName, String(invNo), amount, dueDate]
        });
      }
    } catch (error) {
      console.error('[CENTRAL NOTIF ERROR] notifyOverduePayment:', error.message);
    }
  },

  /**
   * 7. Payment Receipt Confirmation
   */
  notifyPaymentReceived: async (paymentRecord, invoice, dealer) => {
    try {
      const phone = dealer.phone || dealer.whatsapp;
      const dealerName = dealer.name || dealer.companyName || 'Valued Partner';
      const invNo = invoice?.invoiceNumber || invoice?._id || paymentRecord?.invoiceId || 'N/A';
      const amountPaid = String(paymentRecord.amount || 0);
      const mode = paymentRecord.mode || paymentRecord.paymentMethod || 'Online / NEFT';
      const utr = paymentRecord.utr || paymentRecord.referenceNumber || 'CONFIRMED';
      const remBal = String(dealer.outstandingBalance || 0);

      console.log(`[CENTRAL NOTIF] Triggering PaymentReceived for ${dealerName} (₹${amountPaid})`);

      if (phone) {
        await sendDealerTemplateMessage({
          phone,
          templateName: 'dealer_payment_receipt_v1',
          bodyParameters: [dealerName, amountPaid, String(invNo), mode, String(utr), remBal]
        });
      }
    } catch (error) {
      console.error('[CENTRAL NOTIF ERROR] notifyPaymentReceived:', error.message);
    }
  },

  /**
   * 8. Credit Limit & Margin Update
   */
  notifyMarginCreditUpdated: async (dealer, updateDetails = {}) => {
    try {
      const phone = dealer.phone || dealer.whatsapp;
      const dealerName = dealer.name || dealer.companyName || 'Valued Partner';
      const tier = updateDetails.tier || dealer.dealerCategory || 'STANDARD PARTNER';
      const margin = String(updateDetails.margin !== undefined ? updateDetails.margin : (dealer.defaultMargin || 10));
      const credit = String(updateDetails.creditLimit !== undefined ? updateDetails.creditLimit : (dealer.creditLimit || 100000));

      console.log(`[CENTRAL NOTIF] Triggering MarginCreditUpdated for ${dealerName}`);

      if (phone) {
        await sendDealerTemplateMessage({
          phone,
          templateName: 'dealer_margin_credit_update_v1',
          bodyParameters: [dealerName, tier, margin, credit]
        });
      }
    } catch (error) {
      console.error('[CENTRAL NOTIF ERROR] notifyMarginCreditUpdated:', error.message);
    }
  },

  /**
   * 9. Stock Return Status / Credit Note Issued
   */
  notifyCreditNoteIssued: async (creditNote, claim, dealer) => {
    try {
      const phone = dealer.phone || dealer.whatsapp;
      const dealerName = dealer.name || dealer.companyName || 'Valued Partner';
      const cnNo = creditNote.creditNoteNumber || creditNote._id || creditNote.id;
      const amount = String(creditNote.amount || 0);
      const claimNo = claim.claimNumber || claim._id || claim.id || 'N/A';

      console.log(`[CENTRAL NOTIF] Triggering CreditNoteIssued for ${dealerName} (${cnNo})`);

      if (phone) {
        await sendDealerTemplateMessage({
          phone,
          templateName: 'dealer_credit_note_v1',
          bodyParameters: [dealerName, String(cnNo), amount, String(claimNo)]
        });
      }
    } catch (error) {
      console.error('[CENTRAL NOTIF ERROR] notifyCreditNoteIssued:', error.message);
    }
  },

  /**
   * 10. Support Ticket Agent Reply / Resolution
   */
  notifyTicketUpdated: async (ticket, replyText, dealer) => {
    try {
      const phone = dealer.phone || dealer.whatsapp;
      const dealerName = dealer.name || dealer.companyName || 'Valued Partner';
      const ticketId = ticket.ticketId || ticket._id || ticket.id;
      const subject = ticket.subject || 'Dealer Support Inquiry';
      const status = ticket.status || 'UPDATED';
      const truncatedReply = replyText ? replyText.slice(0, 100) : 'Agent replied to your ticket.';

      console.log(`[CENTRAL NOTIF] Triggering TicketUpdated for ${dealerName} (${ticketId})`);

      if (phone) {
        await sendDealerTemplateMessage({
          phone,
          templateName: 'dealer_ticket_update_v1',
          bodyParameters: [dealerName, String(ticketId), subject, status, truncatedReply]
        });
      }
    } catch (error) {
      console.error('[CENTRAL NOTIF ERROR] notifyTicketUpdated:', error.message);
    }
  },

  /**
   * 11. Promotional Scheme Broadcast to Dealer Tiers
   */
  broadcastPromotionalScheme: async (dealers = [], schemeDetails = {}) => {
    try {
      const { title, code = 'SPECIAL', validUntil = 'Limited Time' } = schemeDetails;
      console.log(`[CENTRAL NOTIF] Broadcasting promotional scheme "${title}" to ${dealers.length} dealers...`);

      let successCount = 0;
      for (const dealer of dealers) {
        const phone = dealer.phone || dealer.whatsapp;
        const dealerName = dealer.name || dealer.companyName || 'Partner';
        if (phone) {
          try {
            await sendDealerTemplateMessage({
              phone,
              templateName: 'dealer_promotional_scheme_v1',
              bodyParameters: [dealerName, title, code, validUntil]
            });
            successCount++;
          } catch (e) {
            console.warn(`[BROADCAST FAIL] ${phone}:`, e.message);
          }
        }
      }
      return successCount;
    } catch (error) {
      console.error('[CENTRAL NOTIF ERROR] broadcastPromotionalScheme:', error.message);
    }
  }
};

module.exports = centralNotificationService;
