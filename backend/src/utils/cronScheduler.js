// crm/backend/src/utils/cronScheduler.js
// Automated Scheduled Jobs for Payment Due Reminders & Overdue Warning Sweeps

const prisma = require('../config/database');
const centralNotificationService = require('./centralNotificationService');

class CronScheduler {
  constructor() {
    this.timer = null;
  }

  start() {
    console.log('⏰ [CRON SCHEDULER] Initialized automated daily payment sweeps...');

    // Run initial sweep 10 seconds after start
    setTimeout(() => {
      this.runPaymentSweeps().catch(err => console.error('[CRON ERROR]', err.message));
    }, 10000);

    // Schedule daily check every 24 hours (86,400,000 ms)
    this.timer = setInterval(() => {
      this.runPaymentSweeps().catch(err => console.error('[CRON ERROR]', err.message));
    }, 24 * 60 * 60 * 1000);
  }

  async runPaymentSweeps() {
    console.log('🔍 [CRON SCHEDULER] Running daily payment due & overdue sweeps...');
    await this.sweepPaymentDueReminders();
    await this.sweepOverdueWarnings();
  }

  /**
   * Sweep 1: Find invoices due in 3 days or 1 day
   */
  async sweepPaymentDueReminders() {
    try {
      const now = new Date();
      const inThreeDays = new Date();
      inThreeDays.setDate(now.getDate() + 3);

      const openInvoices = await prisma.invoice.findMany({
        where: {
          status: 'OPEN',
          isCredit: true,
          dueDate: {
            gte: now,
            lte: inThreeDays
          }
        },
        include: {
          dealer: true
        }
      });

      console.log(`[CRON SCHEDULER] Found ${openInvoices.length} invoices due within 3 days.`);

      for (const inv of openInvoices) {
        if (inv.dealer) {
          await centralNotificationService.notifyPaymentReminder(inv, inv.dealer);
        }
      }
    } catch (error) {
      console.error('[CRON SCHEDULER ERROR] sweepPaymentDueReminders:', error.message);
    }
  }

  /**
   * Sweep 2: Find invoices past due date
   */
  async sweepOverdueWarnings() {
    try {
      const now = new Date();

      const overdueInvoices = await prisma.invoice.findMany({
        where: {
          status: 'OPEN',
          isCredit: true,
          dueDate: {
            lt: now
          }
        },
        include: {
          dealer: true
        }
      });

      console.log(`[CRON SCHEDULER] Found ${overdueInvoices.length} OVERDUE invoices.`);

      for (const inv of overdueInvoices) {
        if (inv.dealer) {
          await centralNotificationService.notifyOverduePayment(inv, inv.dealer);
        }
      }
    } catch (error) {
      console.error('[CRON SCHEDULER ERROR] sweepOverdueWarnings:', error.message);
    }
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
  }
}

module.exports = new CronScheduler();
